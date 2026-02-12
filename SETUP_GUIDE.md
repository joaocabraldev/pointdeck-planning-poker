# Poker Planning Application - Complete Setup

## Overview

This is a full-stack poker planning application with real-time collaboration features. Teams can estimate story complexity using T-shirt sizes (XS, S, M, L) in synchronized voting sessions.

## Project Structure

```
poker_planning/
├── client/           # React frontend application
│   ├── src/
│   │   ├── api/      # API client & WebSocket manager
│   │   ├── store/    # State management (Zustand)
│   │   ├── ui/       # React components & pages
│   │   ├── model.ts  # Data models
│   │   └── storage.ts # LocalStorage wrapper
│   └── ...
├── server/           # Node.js/Express backend API
│   ├── src/          # API routes, middleware, WebSocket
│   └── docs/         # API documentation
└── README.md         # This file
```

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies (if any)
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Start the Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3000`
- API Documentation: `http://localhost:3000/api-docs`

### 3. Start the Frontend Client

In a new terminal:

```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173` (default Vite port)

### 4. Use the Application

1. Open `http://localhost:5173` in your browser
2. Enter your name to sign in
3. Click "Create New Room"
4. Share the room URL with your team
5. Start voting!

## Features Implemented

### Frontend (Client)

✅ **User Authentication**
- Name-based signup with JWT token
- Persistent sessions (localStorage)
- Automatic token refresh on reload
- Protected routes with authentication guards

✅ **Room Management**
- Create new rooms (generates unique room ID)
- Join rooms via URL (`/rooms/{room_id}`)
- Auto-redirect to room after authentication
- Share room links via clipboard

✅ **Real-Time Voting**
- WebSocket integration for live updates
- Vote on stories using XS, S, M, L sizes
- See who has voted (without revealing votes)
- Change votes before session closes
- Cancel votes

✅ **Room Owner Controls**
- Start voting sessions
- Close voting and reveal results
- Reset voting for new rounds
- Set agreed values (consensus)
- Remove participants

✅ **Participant View**
- See all room participants
- Real-time vote status indicators
- View results when voting closes
- See agreed values

✅ **UI/UX**
- Clean, responsive interface
- Loading states
- Error handling with user-friendly messages
- Copy-to-clipboard for room sharing
- Visual feedback for user actions

### Backend (Server)

✅ **RESTful API**
- Session creation (authentication)
- Room CRUD operations
- Voting endpoints
- Participant management

✅ **WebSocket Server**
- Real-time room updates
- Room subscriptions
- Automatic reconnection handling
- JWT authentication for WebSocket

✅ **API Documentation**
- Swagger/OpenAPI documentation
- Interactive API explorer
- Comprehensive guides

## Architecture

### Frontend Stack

- **React 19** - Modern UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **React Router 7** - Client-side routing
- **Zustand** - Lightweight state management
- **Socket.IO Client** - Real-time communication

### Backend Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Socket.IO** - WebSocket server
- **JWT** - Authentication
- **Swagger** - API documentation
- **ULID** - Unique ID generation

## API Endpoints

### Authentication
- `POST /session` - Create user session (login)

### Rooms
- `POST /rooms` - Create new room
- `GET /rooms/:id` - Get room state
- `POST /rooms/:id/join` - Join room
- `DELETE /rooms/:id/participants/:participantId` - Remove participant

### Voting
- `POST /rooms/:id/voting/start` - Start voting session
- `POST /rooms/:id/votes` - Submit/update vote
- `DELETE /rooms/:id/votes` - Cancel vote
- `POST /rooms/:id/voting/close` - Close voting & reveal results
- `POST /rooms/:id/voting/reset` - Reset voting session
- `POST /rooms/:id/agreed-value` - Set consensus value

### WebSocket Events

**Client → Server:**
- `subscribe-room` - Subscribe to room updates
- `unsubscribe-room` - Unsubscribe from room

**Server → Client:**
- `room-updated` - Room state changed
- `subscribed` - Subscription confirmed
- `error` - Error occurred

## User Flow

### Creating a Room

1. User lands on home page (`/`)
2. If not authenticated, redirected to `/signup`
3. User enters name and creates session
4. User clicks "Create New Room"
5. API creates room, user becomes owner
6. User redirected to `/rooms/{room_id}`
7. User can share room URL with team

### Joining a Room

1. User receives room link (`/rooms/{room_id}`)
2. If not authenticated, redirected to `/signup` (URL saved)
3. After authentication, user auto-redirected to room
4. User automatically joins room
5. WebSocket connection established
6. User sees room state in real-time

### Voting Session

**Owner:**
1. Clicks "Start Voting"
2. Participants see voting buttons
3. Owner monitors vote count
4. When ready, clicks "Close Voting"
5. Results revealed to everyone
6. Owner sets "Agreed Value" (optional)
7. Clicks "Reset Voting" for next round

**Participant:**
1. Waits for owner to start voting
2. Casts vote (XS, S, M, L)
3. Can change vote anytime before close
4. Sees checkmarks for who voted
5. When owner closes, sees all votes
6. Sees agreed value if set

## Configuration

### Client Environment Variables

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### Server Configuration

The server runs on port 3000 by default. Modify in `server/src/api.ts` if needed.

## Development

### Running Tests (Server)

```bash
cd server
npm test
```

### Building for Production

**Backend:**
```bash
cd server
npm run build
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm run preview
```

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is in use:

```bash
# Kill process on port 3000 (server)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (client)
lsof -ti:5173 | xargs kill -9
```

### CORS Issues

The server allows all origins by default. For production, configure CORS in `server/src/api.ts`.

### WebSocket Connection Fails

1. Check that backend is running
2. Verify JWT token is valid
3. Check browser console for errors
4. Ensure no proxy/firewall blocking WebSocket

### Session Lost on Refresh

Check browser localStorage - session should persist. If not:
1. Check for browser privacy settings blocking localStorage
2. Verify session store is saving correctly

## Documentation

- **API Overview**: `server/docs/API_OVERVIEW.md`
- **Frontend Integration**: `server/docs/FRONTEND_INTEGRATION.md`
- **WebSocket Guide**: `server/docs/WEBSOCKET_GUIDE.md`
- **Client README**: `client/CLIENT_README.md`

## Next Steps / Future Enhancements

- [ ] User profiles with avatars
- [ ] Room history and past voting sessions
- [ ] Export voting results
- [ ] Multiple voting systems (Fibonacci, etc.)
- [ ] Room passwords for privacy
- [ ] Voting timers
- [ ] Comments on estimates
- [ ] Dark mode
- [ ] Mobile app

## License

MIT

---

**Built with ❤️ for agile teams**

