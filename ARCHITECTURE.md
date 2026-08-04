# NEM Forms monorepo

The repository is the canonical source for both production applications:

- The React/Vite web application lives at the repository root and deploys to Firebase Hosting.
- The Express API lives in `apps/backend` and deploys to Render.

## Local verification

Use Node.js 22 or newer, then run:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

## Local development

From the repository root, run the backend and frontend in separate terminals:

```sh
npm run dev:backend
npm run dev
```

`npm run dev:server` is an alias for the backend command. The frontend is served at
`http://localhost:3000` and proxies `/api` requests to the backend at
`http://localhost:3001`. During the migration, the backend development command uses
`apps/backend/.env` when present and otherwise reuses `../n-server/.env`.

`npm run test:legacy` runs the much larger historical suite. It is retained while older malformed and hanging tests are incrementally repaired; the default suite covers customer submission, templates, security rules, and backend policies.

## Security boundaries

- Browser code never receives Datapro, VerifyData, Gemini, email, Firebase Admin, encryption, or CSRF secrets.
- Public KYC/CDD submissions and document uploads enter through rate-limited API endpoints.
- Firebase rules restrict direct document access and submission reads to owners or authorized staff.
- Administrative, email, status-change, deletion, analytics, and test endpoints require server-side authentication and role authorization.

Do not restore the historical root `server.js` as a deployment source. New backend changes belong in `apps/backend`.
