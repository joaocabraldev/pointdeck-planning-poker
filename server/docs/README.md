# Poker Planning API Documentation

Welcome to the Poker Planning API documentation! This folder contains comprehensive guides for integrating and using the API.

## 📚 Documentation Index

### 1. [API Overview](./API_OVERVIEW.md) - **START HERE**
Complete API reference with all endpoints, request/response examples, and quick start guide.

**Contents:**
- Quick start tutorial
- Authentication guide
- Complete endpoint reference
- Data models and types
- Error handling
- cURL examples
- Testing checklist

**Best for:** Understanding the API, testing endpoints, backend integration

---

### 2. [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)
Step-by-step guide for integrating the API into your frontend application.

**Contents:**
- API client setup (TypeScript)
- WebSocket manager implementation
- React hooks examples
- Common pitfalls and solutions
- UI/UX recommendations

**Best for:** Frontend developers building the client application

---

### 3. [WebSocket Guide](./WEBSOCKET_GUIDE.md)
Detailed guide for WebSocket real-time updates implementation.

**Contents:**
- Architecture overview
- Connection and authentication
- Event reference (client ↔ server)
- React/Vue integration examples
- Security considerations
- Troubleshooting guide

**Best for:** Implementing real-time features, debugging WebSocket issues

---

## 🚀 Quick Start for Frontend Developers

### Prerequisites
- Node.js installed
- API server running at `http://localhost:3000`
- Basic knowledge of React or Vue

### Steps

1. **Read the [API Overview](./API_OVERVIEW.md)** to understand the system
2. **Follow the [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)** for implementation
3. **Refer to [WebSocket Guide](./WEBSOCKET_GUIDE.md)** for real-time features
4. **Test using Swagger UI:** http://localhost:3000/api-docs

### Installation

```bash
npm install socket.io-client
```

### Basic Flow

```javascript
// 1. Create session
const { user, token } = await apiClient.createSession('Your Name');

// 2. Create or join room
const { room_id } = await apiClient.createRoom('Sprint Planning');

// 3. Connect WebSocket
const socket = io('http://localhost:3000', { auth: { token } });
socket.emit('subscribe-room', room_id);

// 4. Listen for updates
socket.on('room-updated', (roomData) => {
  // Update UI
});
```

---

## 🔑 Key Concepts

### Authentication
- All endpoints (except `/session`) require JWT Bearer token
- Token validity: 24 hours
- Pass token in `Authorization: Bearer <token>` header

### Room Management
- Room creator is automatically the **owner**
- Owner has special permissions (start/close voting, remove participants, set agreed value)
- Participants can join rooms and vote

### Voting Flow
1. Owner starts voting → `POST /rooms/{id}/voting/start`
2. Participants submit votes → `POST /rooms/{id}/votes`
3. Owner closes voting → `POST /rooms/{id}/voting/close`
4. Results revealed automatically
5. Owner sets agreed value → `POST /rooms/{id}/agreed-value`
6. Owner resets for next item → `POST /rooms/{id}/voting/reset`

### Real-Time Updates
- Use WebSocket for live updates (don't poll!)
- Subscribe to room: `socket.emit('subscribe-room', roomId)`
- Listen for updates: `socket.on('room-updated', callback)`
- All room changes trigger `room-updated` event

---

## 📊 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/session` | Create user session | ❌ |
| POST | `/rooms` | Create room | ✅ |
| GET | `/rooms/{id}` | Get room state | ✅ |
| POST | `/rooms/{id}/join` | Join room | ✅ |
| DELETE | `/rooms/{id}/participants/{id}` | Remove participant | ✅ (Owner) |
| POST | `/rooms/{id}/voting/start` | Start voting | ✅ (Owner) |
| POST | `/rooms/{id}/votes` | Submit vote | ✅ |
| DELETE | `/rooms/{id}/votes` | Cancel vote | ✅ |
| POST | `/rooms/{id}/voting/close` | Close voting | ✅ (Owner) |
| POST | `/rooms/{id}/voting/reset` | Reset voting | ✅ (Owner) |
| POST | `/rooms/{id}/agreed-value` | Set agreed value | ✅ (Owner) |

---

## 🎨 Vote Values

The system uses T-shirt sizing for estimates:

| Value | Meaning | Description |
|-------|---------|-------------|
| `XS` | Extra Small | Very simple task |
| `S` | Small | Simple task |
| `M` | Medium | Moderate complexity |
| `L` | Large | Complex task |

---

## 🧪 Interactive Testing

### Swagger UI
Visit http://localhost:3000/api-docs for interactive API testing with built-in authentication.

### cURL Examples
See [API Overview](./API_OVERVIEW.md#testing-with-curl) for complete cURL examples.

---

## 🛠️ Development Tools

- **Swagger UI:** http://localhost:3000/api-docs
- **OpenAPI Spec:** http://localhost:3000/api-docs.json
- **Health Check:** http://localhost:3000/

---

## 📝 Data Models Reference

### Room Response
```typescript
{
  room_id: string;
  name?: string;
  created_by: { id: string; name: string };
  createdAt: Date;
  participants: Array<{ id: string; name: string }>;
  votes: Record<string, 'XS' | 'S' | 'M' | 'L'>;
  votingStatus: 'idle' | 'active' | 'closed';
  votingStartedAt?: Date;
  votingClosedAt?: Date;
  votingDuration?: string;  // "mm:ss" format
  revealed: boolean;
  agreedValue?: 'XS' | 'S' | 'M' | 'L';
}
```

---

## ❓ Common Questions

### How do I determine if a user is the room owner?
```javascript
const isOwner = room.created_by.id === currentUser.id;
```

### When should I show individual votes?
```javascript
if (room.revealed === true) {
  // Show all votes
}
```

### How do I know who hasn't voted yet?
```javascript
const notVoted = room.participants.filter(
  p => !room.votes[p.id]
);
```

### Should I poll for room updates?
**No!** Always use WebSocket (`room-updated` events) for real-time updates.

---

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check JWT token is included in Authorization header
   - Verify token hasn't expired (24h validity)

2. **WebSocket not connecting**
   - Ensure token is passed in `auth.token`
   - Check server is running
   - Verify CORS settings

3. **Room updates not received**
   - Confirm you subscribed: `socket.emit('subscribe-room', roomId)`
   - Check room ID is correct
   - Verify WebSocket is connected

---

## 📞 Support

For issues or questions:
- Check the relevant documentation file
- Review Swagger UI examples
- Inspect browser console for errors
- Check server logs

---

## 🎯 Next Steps

1. ✅ Read [API Overview](./API_OVERVIEW.md)
2. ✅ Set up API client ([Frontend Integration](./FRONTEND_INTEGRATION.md))
3. ✅ Implement authentication
4. ✅ Create room functionality
5. ✅ Add WebSocket integration ([WebSocket Guide](./WEBSOCKET_GUIDE.md))
6. ✅ Build voting UI
7. ✅ Test with multiple users
8. ✅ Deploy!

Happy coding! 🚀

