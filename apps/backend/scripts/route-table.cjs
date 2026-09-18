#!/usr/bin/env node
/**
 * Prints the Express route table of apps/backend/server.js as JSON lines, in registration order.
 * Used as a behaviour-preservation check while server.js is split into modules:
 *   node scripts/route-table.cjs > before.jsonl ; (refactor) ; node scripts/route-table.cjs > after.jsonl ; diff
 * Requires apps/backend/.env (Firebase Admin initialises at require time). Never listens.
 */
'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
process.env.ROUTE_TABLE_ONLY = 'true';

// Silence startup logging (nodemailer writes its DEBUG lines to stdout) so only JSON rows are emitted.
const silenced = ['log', 'info', 'debug', 'warn'];
const original = Object.fromEntries(silenced.map((k) => [k, console[k]]));
for (const k of silenced) console[k] = () => {};
const { app } = require('../server.js');
for (const k of silenced) console[k] = original[k];

function handlerName(fn) {
  return (fn && (fn.displayName || fn.name)) || '<anonymous>';
}

// Express stores mount points as regexps; keep the source verbatim so diffs are exact.
function mountOf(layer) {
  const src = layer.regexp ? layer.regexp.source : '';
  return src === '^\\/?$' ? '' : src;
}

function walk(stack, mounts, out) {
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .filter((m) => layer.route.methods[m])
        .map((m) => m.toUpperCase());
      out.push({
        kind: 'route',
        mounts,
        methods,
        path: layer.route.path,
        handlers: layer.route.stack.map((l) => handlerName(l.handle)),
      });
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      walk(layer.handle.stack, mounts.concat(mountOf(layer)), out);
    } else {
      out.push({ kind: 'use', mounts, mount: mountOf(layer), handler: handlerName(layer.handle) });
    }
  }
}

const rows = [];
walk(app._router.stack, [], rows);
for (const row of rows) process.stdout.write(JSON.stringify(row) + '\n');
process.stderr.write(
  `${rows.filter((r) => r.kind === 'route').length} routes, ${rows.filter((r) => r.kind === 'use').length} middleware layers\n`
);
setTimeout(() => process.exit(0), 200);
