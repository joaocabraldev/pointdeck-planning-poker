# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Poker Planning — a real-time collaborative estimation tool where teams vote with t-shirt sizes (XS, S, M, L). Monorepo with an Express/TypeScript backend and a React/TypeScript frontend.

## Commands

### Server (run from `server/`)
- **Dev server:** `npm run dev` (tsx watch, port 3000)
- **Build:** `npm run build`
- **Type check:** `npm run typecheck`
- **Unit tests:** `npm test` (Jest with coverage)
- **Single test file:** `NODE_OPTIONS='--experimental-vm-modules' npx jest src/api.test.ts`
- **Watch tests:** `npm run test:watch`

### Client (run from `client/`)
- **Dev server:** `npm run dev` (Vite on port 5173)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint)

### E2E Tests (run from project root)
- **Run all:** `npm test` (Playwright, auto-starts server + client)
- **Headed mode:** `npm run test:headed`
- **Debug mode:** `npm run test:debug`
- **View report:** `npm run test:report`

## Architecture

### Server (`server/src/`)
Express 5 + Socket.IO app, ESM modules (`"type": "module"`), compiled with TypeScript.

- `api.ts` — Express app setup, mounts routes and Socket.IO, exports `app` for test use
- `session.route.ts` — `POST /session` creates a user and returns a JWT
- `rooms.route.ts` — All room CRUD and voting endpoints (create, join, vote, start/close/reset voting, agreed-value, remove participant)
- `auth.middleware.ts` — JWT Bearer token authentication middleware; extends Request as `AuthRequest`
- `store.ts` — Singleton in-memory store using Maps for users and rooms (no database)
- `socket.ts` — Socket.IO setup with JWT auth middleware; rooms subscribe/unsubscribe via events, `emitRoomUpdate()` pushes state changes to subscribers
- `pokerPlanningRoom.model.ts` — Room types: `VoteValue`, `VotingStatus` (idle/active/closed), `PokerPlanningRoom`, `RoomResponse`
- `user.model.ts` — User and session types
- `api.test.ts` — Jest integration tests using supertest against the Express app

### Client (`client/src/`)
React 19 + Vite (rolldown-vite) + Zustand for state + react-router for navigation.

- `api/client.ts` — `ApiClient` class wrapping fetch calls to backend (singleton `apiClient`)
- `api/socket.ts` — Socket.IO client connection
- `store/sessionStore.ts` — Zustand session state
- `ui/` — React components and pages

### API URL configuration
Server runs on port 3000. Client uses `VITE_API_URL` env var (defaults to `http://localhost:3000`). See `client/.env.example`.

### Real-time Updates
Room state changes emit `room-updated` events via Socket.IO. Clients subscribe with `subscribe-room` and unsubscribe with `unsubscribe-room`. Both HTTP and WebSocket connections require JWT auth.

### Testing
- **Server unit tests** use Jest + supertest, run against the Express app directly (server doesn't bind a port in test mode via `NODE_ENV=test`). Store is cleared in `beforeEach`.
- **E2E tests** in `tests/` use Playwright (Chromium only, serial execution). Playwright config auto-starts both server and client dev servers.
- Note: The test file uses route aliases (`/rooms/:id/start-voting`, `/rooms/:id/vote`, etc.) that map to the actual routes (`/rooms/:id/voting/start`, `/rooms/:id/votes`, etc.).

### IDs
All entity IDs (users, rooms) use ULIDs via the `ulid` package.

### Documentation
Any new endpoint should be documented in the OpenAPI spec (`server/openapi.yaml`).