## Cursor Cloud specific instructions

### Overview

Pointdeck is a real-time poker planning app. Monorepo with two services, no external dependencies (no DB, no Docker, no Redis). See `CLAUDE.md` for full command reference.

### Services

| Service | Dir | Port | Dev command |
|---------|-----|------|-------------|
| Express API + Socket.IO | `server/` | 3000 | `npm run dev` |
| React (Vite) frontend | `client/` | 5173 | `npm run dev` |

### Running tests

- **Server unit tests:** `cd server && npm test` — 23 of 40 tests pass; 17 tests fail due to pre-existing route-alias mismatches (tests use `/rooms/:id/start-voting` etc. but actual routes are `/rooms/:id/voting/start`). This is documented in `CLAUDE.md`.
- **Client lint:** `cd client && npm run lint` — has 1 pre-existing `@typescript-eslint/no-explicit-any` error in `src/storage.ts` and 1 `react-hooks/exhaustive-deps` warning.
- **E2E tests (Playwright):** `npm test` from root — most tests timeout due to pre-existing selector mismatches (e.g., tests expect placeholder "Enter your name" but UI has "Your name"). The Playwright config auto-starts both dev servers if not already running.

### Gotchas

- The server's Jest tests don't exit cleanly due to a `setInterval` in `socket.ts` that logs connected client count. Jest warns about this but it doesn't affect test results.
- Client uses `vite: "npm:rolldown-vite@7.2.5"` override in `package.json`. This is intentional.
- Playwright is configured for Chromium only with serial execution (`workers: 1`).
