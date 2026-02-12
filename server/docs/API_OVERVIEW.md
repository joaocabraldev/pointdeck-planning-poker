# Poker Planning API - Complete Guide

## Overview

This is a real-time collaborative poker planning application API that allows teams to estimate story complexity using T-shirt sizes (XS, S, M, L). The API supports REST endpoints for actions and WebSocket connections for real-time updates.

**Base URL:** `http://localhost:3000`  
**Swagger UI:** `http://localhost:3000/api-docs`

## Quick Start

### 1. Create a User Session (Login)

```bash
curl -X POST http://localhost:3000/session \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'
```

**Response:**
```json
{
  "user": {
    "id": "01HXYZ123ABC456DEF789GHI",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token!** Use it for all subsequent requests.

### 2. Create a Room

```bash
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Sprint Planning"}'
```

**Response:**
```json
{
  "room_id": "01HXYZ987ZYX654WVU321TSR"
}
```

### 3. Get Room State

```bash
curl http://localhost:3000/rooms/01HXYZ987ZYX654WVU321TSR \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Connect to WebSocket for Real-Time Updates

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  socket.emit('subscribe-room', 'ROOM_ID');
});

socket.on('room-updated', (roomData) => {
  console.log('Room updated:', roomData);
  // Update your UI
});
```

## Authentication

All endpoints (except `/session`) require JWT authentication via Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Validity:** 24 hours

## API Endpoints

### Authentication

#### POST `/session` - Create User Session
Creates a new user and returns a JWT token.

**Request:**
```json
{
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "01HXYZ123ABC456DEF789GHI",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Room Management

#### POST `/rooms` - Create Room
Creates a new poker planning room. The creator automatically becomes the owner and first participant.

**Request:**
```json
{
  "name": "Sprint Planning"  // optional
}
```

**Response:**
```json
{
  "room_id": "01HXYZ987ZYX654WVU321TSR"
}
```

#### GET `/rooms/{id}` - Get Room State
Retrieves complete room information.

**Response:**
```json
{
  "room_id": "01HXYZ987ZYX654WVU321TSR",
  "name": "Sprint Planning",
  "created_by": {
    "id": "01HXYZ123ABC456DEF789GHI",
    "name": "John Doe"
  },
  "createdAt": "2026-02-11T12:00:00.000Z",
  "participants": [
    {"id": "01HXYZ123ABC456DEF789GHI", "name": "John Doe"},
    {"id": "01HXYZ456DEF789GHI123ABC", "name": "Jane Smith"}
  ],
  "votes": {
    "01HXYZ123ABC456DEF789GHI": "M",
    "01HXYZ456DEF789GHI123ABC": "L"
  },
  "votingStatus": "active",
  "votingStartedAt": "2026-02-11T12:05:00.000Z",
  "votingClosedAt": null,
  "votingDuration": "02:30",
  "revealed": false,
  "agreedValue": null
}
```

#### POST `/rooms/{id}/join` - Join Room
Adds the authenticated user to the room's participant list.

**Response:** `200 OK` (no body)

#### DELETE `/rooms/{id}/participants/{participantId}` - Remove Participant
Removes a participant from the room. **Owner only.**

**Response:** `200 OK` (no body)

**Error Cases:**
- `400` - Attempting to remove room owner
- `403` - Not the room owner
- `404` - Room or participant not found

---

### Voting

#### POST `/rooms/{id}/voting/start` - Start Voting
Starts a new voting session. **Owner only.** Clears previous votes.

**Response:** `200 OK` (no body)

**Error Cases:**
- `400` - Voting already active
- `403` - Not the room owner

#### POST `/rooms/{id}/votes` - Submit/Update Vote
Submit or update your vote for the active voting session.

**Request:**
```json
{
  "vote": "M"  // XS, S, M, or L
}
```

**Response:** `200 OK` (no body)

**Error Cases:**
- `400` - Voting not active or invalid vote
- `403` - Must join room first

#### DELETE `/rooms/{id}/votes` - Cancel Vote
Removes your vote from the current voting session.

**Response:** `200 OK` (no body)

#### POST `/rooms/{id}/voting/close` - Close Voting
Closes the voting session and reveals all votes. **Owner only.**

**Response:** `200 OK` (no body)

**Error Cases:**
- `400` - Voting not active
- `403` - Not the room owner

#### POST `/rooms/{id}/voting/reset` - Reset Voting
Resets voting to idle state, clearing all votes. **Owner only.**

**Response:** `200 OK` (no body)

#### POST `/rooms/{id}/agreed-value` - Set Agreed Estimate
Records the consensus estimate after voting is closed. **Owner only.**

**Request:**
```json
{
  "value": "M"  // XS, S, M, or L
}
```

**Response:** `200 OK` (no body)

**Error Cases:**
- `400` - Voting not closed or invalid value
- `403` - Not the room owner

---

## WebSocket Events

### Connection

Connect with JWT authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe-room` | `roomId: string` | Subscribe to room updates |
| `unsubscribe-room` | `roomId: string` | Unsubscribe from room |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribed` | `{ roomId: string }` | Subscription confirmed |
| `unsubscribed` | `{ roomId: string }` | Unsubscription confirmed |
| `room-updated` | `RoomResponse` | Room state changed |
| `error` | `{ message: string }` | Error occurred |

### Real-Time Updates

The `room-updated` event is emitted when:
- Participant joins or is removed
- Vote is submitted, updated, or cancelled
- Voting starts, closes, or resets
- Agreed value is set

---

## Data Models

### User
```typescript
{
  id: string;        // ULID
  name: string;
}
```

### Room Response
```typescript
{
  room_id: string;
  name?: string;
  created_by: {
    id: string;
    name: string;
  };
  createdAt: Date;
  participants: Array<{
    id: string;
    name: string;
  }>;
  votes: Record<string, VoteValue>;  // userId → vote
  votingStatus: 'idle' | 'active' | 'closed';
  votingStartedAt?: Date;
  votingClosedAt?: Date;
  votingDuration?: string;  // Format: "mm:ss"
  revealed: boolean;
  agreedValue?: VoteValue;
}
```

### Vote Value
```typescript
type VoteValue = 'XS' | 'S' | 'M' | 'L';
```

---

## Typical User Flow

### Room Owner Flow

1. **Create session** → Get JWT token
2. **Create room** → Get room_id
3. **Connect WebSocket** → Subscribe to room
4. **Share room_id** with team
5. **Wait for participants** to join
6. **Start voting** → `POST /rooms/{id}/voting/start`
7. **Submit vote** → `POST /rooms/{id}/votes`
8. **Close voting** → `POST /rooms/{id}/voting/close`
9. **Review results** and discuss
10. **Set agreed value** → `POST /rooms/{id}/agreed-value`
11. **Reset voting** for next item → `POST /rooms/{id}/voting/reset`

### Participant Flow

1. **Create session** → Get JWT token
2. **Join room** → `POST /rooms/{id}/join`
3. **Connect WebSocket** → Subscribe to room
4. **Wait for voting to start** (receive `room-updated`)
5. **Submit vote** → `POST /rooms/{id}/votes`
6. **Wait for results** (receive `room-updated` when closed)
7. **View agreed value** (receive `room-updated`)

---

## Error Handling

All errors return JSON with an `error` field:

```json
{
  "error": "Error message"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input, validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not authorized for action) |
| 404 | Not Found (room/participant not found) |

---

## Frontend Integration Checklist

### Initial Setup
- [ ] Install `socket.io-client`
- [ ] Create API client with token management
- [ ] Implement session creation (login)
- [ ] Store JWT token (localStorage/sessionStorage)

### Room Management
- [ ] Create room functionality
- [ ] Join room functionality
- [ ] Display room participants
- [ ] Handle room owner actions

### WebSocket Integration
- [ ] Connect WebSocket with JWT token
- [ ] Subscribe to room on mount
- [ ] Listen for `room-updated` events
- [ ] Update UI state on room updates
- [ ] Unsubscribe on unmount
- [ ] Handle reconnection

### Voting Features
- [ ] Start voting button (owner only)
- [ ] Vote submission UI (XS, S, M, L cards)
- [ ] Display voting status
- [ ] Show votes when revealed
- [ ] Close voting button (owner only)
- [ ] Set agreed value (owner only)
- [ ] Reset voting button (owner only)

### UI/UX Considerations
- [ ] Show voting timer (use `votingDuration`)
- [ ] Hide votes until revealed
- [ ] Indicate who hasn't voted yet
- [ ] Show consensus/agreed value
- [ ] Handle connection states (loading, connected, error)
- [ ] Show real-time participant changes

---

## Testing with cURL

### Complete Flow Example

```bash
# 1. Create session
TOKEN=$(curl -s -X POST http://localhost:3000/session \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User"}' | jq -r '.token')

# 2. Create room
ROOM_ID=$(curl -s -X POST http://localhost:3000/rooms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room"}' | jq -r '.room_id')

# 3. Get room state
curl http://localhost:3000/rooms/$ROOM_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Start voting
curl -X POST http://localhost:3000/rooms/$ROOM_ID/voting/start \
  -H "Authorization: Bearer $TOKEN"

# 5. Submit vote
curl -X POST http://localhost:3000/rooms/$ROOM_ID/votes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vote":"M"}'

# 6. Close voting
curl -X POST http://localhost:3000/rooms/$ROOM_ID/voting/close \
  -H "Authorization: Bearer $TOKEN"

# 7. Set agreed value
curl -X POST http://localhost:3000/rooms/$ROOM_ID/agreed-value \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"M"}'
```

---

## Additional Resources

- **Swagger UI:** `http://localhost:3000/api-docs` - Interactive API documentation
- **WebSocket Guide:** See `docs/WEBSOCKET_GUIDE.md` for detailed WebSocket implementation
- **OpenAPI Spec:** `http://localhost:3000/api-docs.json` - Raw OpenAPI specification

---

## Environment Variables

```bash
JWT_SECRET=your-secret-key-change-in-production  # Default if not set
NODE_ENV=development  # Use 'test' for testing, 'production' for prod
```

---

## Notes for Frontend Developers

1. **Token Management:** Store JWT token securely. Consider token expiration (24h).
2. **Real-time Updates:** Always use WebSocket for room state updates, not polling.
3. **Optimistic Updates:** You can update UI immediately and rely on WebSocket to confirm.
4. **Error Handling:** Handle all error cases (401, 403, 404, 400) gracefully.
5. **Room Owner:** Check `created_by.id === user.id` to determine if user is owner.
6. **Vote Privacy:** Don't show individual votes unless `revealed === true`.
7. **Reconnection:** Implement WebSocket reconnection logic with exponential backoff.
8. **Loading States:** Show loading indicators during API calls.
9. **Validation:** Validate vote values (XS, S, M, L) client-side before submission.
10. **URL Sharing:** Make room URLs shareable (e.g., `/room/{id}`).

