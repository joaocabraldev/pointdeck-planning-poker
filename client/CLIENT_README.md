# Poker Planning Client

Frontend application for collaborative poker planning sessions using T-shirt sizing (XS, S, M, L) or your own custom options.

## Features

- 🔐 User authentication
- 🎯 Create and join planning rooms
- 🗳️ Real-time voting with WebSocket updates
- 👥 Participant management
- 📊 View voting results
- 🔗 Share room links
- 👑 Room owner controls (start/close/reset voting)
- ✅ Set agreed values

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Running backend server (see `../server`)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the client directory (optional):

```env
VITE_API_URL=http://localhost:3000
VITE_VOTE_VALUES=XS,S,M,L
VITE_VOTING_STATUSES=idle,active,closed
```

**Environment Variables:**
- `VITE_API_URL` - Backend API URL (default: `http://localhost:3000`)
- `VITE_VOTE_VALUES` - Comma-separated list of voting options (default: `XS,S,M,L`)
- `VITE_VOTING_STATUSES` - Comma-separated list of voting states (default: `idle,active,closed`)

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Usage

### Authentication

1. When you first visit the app, you'll be prompted to enter your name
2. The app will create a session and store your authentication token

### Creating a Room

1. After authentication, click "Create New Room" on the home page
2. You'll automatically join the room as the owner
3. Share the room URL with your team members

### Joining a Room

1. Click on a shared room link (e.g., `/rooms/[room_id]`)
2. If not authenticated, you'll be prompted to sign in first
3. After authentication, you'll automatically join the room

### Voting

**As Room Owner:**
1. Click "▶️ Start Voting" to begin a voting session
2. All participants can now cast their votes
3. Click "⏹️ Close Voting" to reveal results
4. Optionally set an "Agreed Value" for the estimate
5. Click "🔄 Reset Voting" to start a new round

**As Participant:**
1. Wait for the owner to start voting
2. Select your vote from the available options (default: XS, S, M, L)
3. You can change your vote before the owner closes voting
4. Click "❌ Cancel My Vote" to remove your vote

### Room Features

- **Participants List**: Shows all team members in the room
- **Vote Status**: Displays who has voted (without revealing votes)
- **Share Button**: Copy room link to clipboard
- **Remove Participants**: Room owners can remove participants (except themselves)
- **Real-time Updates**: All changes sync instantly via WebSocket

## Project Structure

```
src/
├── api/
│   ├── client.ts       # REST API client
│   └── socket.ts       # WebSocket manager
├── store/
│   └── sessionStore.ts # Zustand state management
├── ui/
│   ├── pages/
│   │   ├── Signup.tsx  # Authentication page
│   │   ├── Welcome.tsx # Home page
│   │   └── Room.tsx    # Room/voting page
│   ├── App.tsx         # Main app with routing
│   └── main.tsx        # Entry point
├── model.ts            # Data models
└── storage.ts          # LocalStorage wrapper
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router 7** - Client-side routing
- **Zustand** - State management
- **Socket.IO Client** - Real-time WebSocket communication

## API Integration

The client integrates with the Poker Planning API. See `/server/docs/API_OVERVIEW.md` for API documentation.

### Environment Variables

- `VITE_API_URL` - Backend API URL (default: `http://localhost:3000`)
- `VITE_VOTE_VALUES` - Comma-separated list of voting options (default: `XS,S,M,L`)
- `VITE_VOTING_STATUSES` - Comma-separated list of voting state names (default: `idle,active,closed`)

## Customization

### Custom Voting Options

You can customize the voting cards by setting `VITE_VOTE_VALUES` in your `.env` file:

```env
VITE_VOTE_VALUES=1,2,3,5,8,13,21
```

This will display Fibonacci numbers instead of T-shirt sizes. The voting pool will dynamically update across the application.

### Custom Voting States

You can customize the voting state names by setting `VITE_VOTING_STATUSES` in your `.env` file:

```env
VITE_VOTING_STATUSES=waiting,voting,closed
```

**Note:** The order matters:
1. First state = initial/idle state (waiting for owner to start)
2. Second state = active voting state
3. Third state = closed/revealed state

Make sure your backend is also configured with matching values (see `../server` documentation).

## Troubleshooting

### Connection Issues

If you can't connect to the backend:
1. Ensure the backend server is running on `http://localhost:3000`
2. Check the `VITE_API_URL` environment variable
3. Check browser console for CORS errors

### Authentication Issues

If you're stuck at the login screen:
1. Clear localStorage: `localStorage.clear()`
2. Refresh the page
3. Try signing in again

### WebSocket Issues

If real-time updates aren't working:
1. Check browser console for WebSocket errors
2. Ensure the backend WebSocket server is running
3. Verify your JWT token is valid (check localStorage)

## License

MIT

