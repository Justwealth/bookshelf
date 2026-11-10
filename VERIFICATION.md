# Verification

## Passed

- Dependencies installed with exact direct versions and an npm lockfile.
- TypeScript strict type checking (`npm run typecheck`).
- Three automated validation tests (`npm test`): normalizing input, rejecting invalid/oversized values, rejecting invalid identifiers.
- Optimized Next.js build (`npm run build`), including route generation and type checking.
- Database migration created Better Auth's tables and the books table.
- Full HTTP integration flow through Next.js, the typed tRPC client, the standalone tRPC backend, Better Auth, and the `pg` database driver:
  - Unauthenticated book access rejected.
  - Two accounts registered with session cookies.
  - Book creation, listing, updating, and deletion.
  - Separate account could neither see nor update/delete the first account's book.
  - Invalid book input rejected.
  - Wrong-origin backend mutation rejected.
  - Updated data confirmed by both a new HTTP request and direct SQL query.
  - Incorrect password rejected; correct password accepted.
  - Logout invalidated the original session.

## Environment limits

The runtime had no Docker service and could not run native PostgreSQL under a non-root user. Integration checks used PGlite (PostgreSQL compiled to WebAssembly) through a temporary PostgreSQL wire-protocol server. This test dependency is **not** part of the delivered application. The application is configured for native PostgreSQL 17 in Docker. Native Docker startup and PostgreSQL 17 itself were not executed here.

The production HTTP server started successfully. Automated visual browser checks could not run because Chromium was not installed and the browser download failed. No claim of screenshot or visual verification is made.

## Reproduce with PostgreSQL 17

Follow README setup, keep `npm run dev` running, and run `npm run test:integration` in another terminal. The test deletes only its own temporary users at the end. Also follow the manual demonstration checklist in README.
