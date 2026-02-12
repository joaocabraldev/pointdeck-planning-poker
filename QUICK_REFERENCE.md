# 🃏 Poker Planning - Quick Reference

## 🚀 Quick Start

```bash
# Terminal 1 - Start Backend
cd server && npm run dev

# Terminal 2 - Start Frontend  
cd client && npm run dev

# Open browser
open http://localhost:5173
```

## 📍 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs

## 🎭 User Roles

| Role | Capabilities |
|------|-------------|
| **Room Owner** 👑 | Start/close/reset voting, set agreed value, remove participants |
| **Participant** | Vote, cancel vote, view results when revealed |

## 🗳️ Vote Options

```
XS - Extra Small
S  - Small
M  - Medium
L  - Large
```

## 🔄 Voting States

| State | Description | Actions Available |
|-------|-------------|-------------------|
| **IDLE** | No active voting | Owner: Start Voting |
| **ACTIVE** | Voting in progress | All: Submit/Cancel Vote, Owner: Close Voting |
| **CLOSED** | Results revealed | Owner: Set Agreed Value, Reset Voting |

## 🎯 Main Flows

### Create & Share Room
1. Sign in with name
2. Click "Create New Room"
3. Click "📋 Share Room"
4. Share link with team

### Join Room
1. Receive room link
2. Sign in (if needed)
3. Automatically join room
4. Wait for voting to start

### Voting Session (Owner)
1. Click "▶️ Start Voting"
2. Cast your vote
3. Monitor vote count
4. Click "⏹️ Close Voting"
5. (Optional) Set agreed value
6. Click "🔄 Reset Voting" for next round

### Voting Session (Participant)
1. Wait for owner to start
2. Select vote (XS/S/M/L)
3. Change vote if needed
4. View results when owner closes

## 🔑 Keyboard Shortcuts

- **Enter** - Submit form (signup, create room)
- **Escape** - Close modals (future feature)

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect | Check backend is running on port 3000 |
| Session lost | Check localStorage, re-login if needed |
| Real-time not working | Verify WebSocket connection in console |
| Port in use | Kill process: `lsof -ti:3000 \| xargs kill -9` |

## 📦 Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- React Router 7
- Zustand (state)
- Socket.IO Client

**Backend:**
- Node.js + Express
- TypeScript
- Socket.IO (WebSocket)
- JWT (auth)
- Swagger (docs)

## 📁 Key Files

```
client/src/
├── api/
│   ├── client.ts      # REST API
│   └── socket.ts      # WebSocket
├── store/
│   └── sessionStore.ts # Auth state
└── ui/pages/
    ├── Signup.tsx     # Login
    ├── Welcome.tsx    # Home
    └── Room.tsx       # Voting room
```

## 🎨 Component Props

### Room Component
- Auto-joins room on mount
- Subscribes to WebSocket updates
- Shows participants list
- Handles all voting actions
- Owner controls conditional rendering

### Signup Component
- Name input validation
- Async authentication
- Error display
- Auto-redirect after signup

### Welcome Component
- Create room button
- Navigation to rooms
- Logout functionality

## 🔐 Authentication

**Storage:** localStorage key `"session"`

**Token:** JWT with 24h expiration

**Flow:**
1. User enters name
2. API creates session
3. Token stored in localStorage
4. Token included in all API requests
5. Token used for WebSocket auth

## 💡 Tips

- **Share Links Early**: Create room and share before starting voting
- **Remove Inactive**: Owners can remove participants who left
- **Reset Often**: Use reset between different stories
- **Agreed Value**: Use to record final team decision
- **Refresh Safe**: Sessions persist across page refreshes

## 🐛 Debug Commands

```bash
# Check backend health
curl http://localhost:3000/api-docs

# Check session in browser console
localStorage.getItem('session')

# Clear session
localStorage.removeItem('session')

# View all local storage
Object.keys(localStorage)
```

## 📚 Documentation

- **Setup Guide**: `/SETUP_GUIDE.md`
- **Implementation**: `/IMPLEMENTATION_SUMMARY.md`
- **API Docs**: `/server/docs/API_OVERVIEW.md`
- **WebSocket**: `/server/docs/WEBSOCKET_GUIDE.md`
- **Frontend**: `/client/CLIENT_README.md`

---

**Built for agile teams | MIT License | 2026**

