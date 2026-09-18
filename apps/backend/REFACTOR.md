# Splitting `server.js` into modules

`server.js` is a 20k-line single closure. It is being split into `src/` **without changing behaviour**.
Every step is verified by `node scripts/check-refactor.cjs`, which fails unless:

1. every file passes `node --check`,
2. no file uses an identifier it does not define or import (`scripts/free-vars.cjs`),
3. the live Express route table (methods, paths, handler names, registration order, `app.use` layers)
   is byte-identical to `scripts/route-table.baseline.jsonl`.

Then `npm test` must pass. Only re-baseline (`node scripts/route-table.cjs 2>/dev/null | grep '^{' > scripts/route-table.baseline.jsonl`)
when a route was **deliberately** added or removed, and say so in the commit message.

## Target layout

```
server.js                 entry only: require('./src/app'), startServer(), shutdown handlers
src/app.cjs               createApp(): builds the express app in the exact current order
src/context.cjs           builds the shared `ctx` object once (db, admin, bucket, transporter, helpers…)
src/config/               env.cjs firebase.cjs mail.cjs cors.cjs rateLimits.cjs csrf.cjs
src/middleware/           auth.cjs validation.cjs logging.cjs security.cjs errors.cjs
src/lib/                  events.cjs tickets.cjs collections.cjs storage.cjs roles.cjs …
src/routes/               one file per domain, each `module.exports = function register(app, ctx) { … }`
```

## The extraction recipe (repeat per block)

1. Pick a contiguous block of `server.js` that is one domain (use the `// ===== … =====` banners).
2. Create `src/routes/<domain>.cjs`:
   ```js
   'use strict';
   module.exports = function register(app, ctx) {
     const { db, admin, requireAuth, requireSuperAdmin, logAction /* … */ } = ctx;
     // pasted block, unchanged, still using app.get/app.post with the same absolute paths
   };
   ```
   Keep `app.<verb>(...)` calls as they are. Do **not** convert to `express.Router()` in this pass;
   mounting changes the layer structure and the route-table diff will flag it.
3. Replace the block in `server.js` with `require('./src/routes/<domain>.cjs')(app, ctx);` at the
   same position. Order is behaviour: limiters, CSRF and body parsers depend on it.
4. Run `node scripts/free-vars.cjs src/routes/<domain>.cjs`. Every name printed must be added to the
   `ctx` destructure (and to `ctx` in `server.js`/`src/context.cjs` if not already there), or
   `require`d directly when it is an npm package or a `server-utils` module.
5. Run `node scripts/free-vars.cjs server.js`. Names printed here were defined inside the block and
   used elsewhere: export them from the module (`register.helpers = { … }` or a sibling `src/lib`
   file) and import them back.
6. `node scripts/check-refactor.cjs && npm test`.

Helpers that several domains share (validators, `logAction`, `getUserDetailsForLogging`,
`validateCollectionName`, …) move to `src/lib` or `src/middleware` as soon as a second domain needs
them, and are exposed through `ctx`.

## Rules

- No behaviour changes inside a refactor commit. Bug fixes are separate commits with their own tests.
- Never `require('../server.js')` from a module: `server.js` depends on modules, not the reverse.
- `ctx` is built once. Modules must not mutate it.
- Keep `process.env` reads in `src/config/env.cjs`; modules receive values through `ctx.env`.
