# WebSocket Real-Time Room Updates - Implementation Guide

## Overview

The Poker Planning API now supports real-time updates via WebSocket connections. Clients can subscribe to room updates and receive instant notifications whenever room state changes.

## Server Implementation

### Features Implemented

✅ **JWT Authentication**: WebSocket connections require JWT token authentication  
✅ **Room Subscriptions**: Clients can subscribe to specific rooms  
✅ **Automatic Updates**: All room state changes emit `room-updated` events  
✅ **Multi-room Support**: Clients can subscribe to multiple rooms simultaneously  

### WebSocket Events

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe-room` | `roomId: string` | Subscribe to room updates |
| `unsubscribe-room` | `roomId: string` | Unsubscribe from room updates |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribed` | `{ roomId: string }` | Confirmation of successful subscription |
| `unsubscribed` | `{ roomId: string }` | Confirmation of successful unsubscription |
| `room-updated` | `RoomResponse` | Room state has changed |
| `error` | `{ message: string }` | Error occurred (e.g., room not found) |

### Authentication

WebSocket connections authenticate using JWT tokens passed during the handshake:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

If authentication fails, the connection is rejected with an error.

### Room Update Triggers

The `room-updated` event is emitted when:

- ✅ A participant joins the room
- ✅ A participant is removed from the room
- ✅ A vote is submitted or updated
- ✅ A vote is cancelled
- ✅ Voting session starts
- ✅ Voting session closes
- ✅ Voting session resets
- ✅ Agreed value is set

## Client Integration

### Installation

```bash
npm install socket.io-client
```

### Basic Usage Example

```javascript
import { io } from 'socket.io-client';

// Connect with JWT token
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('jwt_token')
  }
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Subscribe to a room
  const roomId = '01HXYZ987ZYX654WVU321TSR';
  socket.emit('subscribe-room', roomId);
});

// Handle subscription confirmation
socket.on('subscribed', ({ roomId }) => {
  console.log(`Successfully subscribed to room: ${roomId}`);
});

// Handle room updates
socket.on('room-updated', (roomData) => {
  console.log('Room updated:', roomData);
  // Update your UI with the new room state
  updateRoomUI(roomData);
});

// Handle errors
socket.on('error', ({ message }) => {
  console.error('WebSocket error:', message);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

// Unsubscribe when leaving room
function leaveRoom(roomId) {
  socket.emit('unsubscribe-room', roomId);
}

// Clean up on component unmount
function cleanup() {
  socket.disconnect();
}
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface RoomData {
  room_id: string;
  name?: string;
  created_by: {
    id: string;
    name: string;
  };
  participants: Array<{ id: string; name: string }>;
  votes: Record<string, string>;
  votingStatus: 'idle' | 'active' | 'closed';
  votingStartedAt?: string;
  votingClosedAt?: string;
  votingDuration?: string;
  revealed: boolean;
  agreedValue?: string;
}

function useRoomSocket(roomId: string, token: string) {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const newSocket = io('http://localhost:3000', {
      auth: { token }
    });

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      newSocket.emit('subscribe-room', roomId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Room event handlers
    newSocket.on('subscribed', ({ roomId: subscribedRoomId }) => {
      console.log(`Subscribed to room: ${subscribedRoomId}`);
    });

    newSocket.on('room-updated', (data: RoomData) => {
      console.log('Room updated:', data);
      setRoomData(data);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.emit('unsubscribe-room', roomId);
      newSocket.disconnect();
    };
  }, [roomId, token]);

  return { roomData, socket, isConnected };
}

// Usage in component
function RoomPage({ roomId, token }) {
  const { roomData, isConnected } = useRoomSocket(roomId, token);

  if (!isConnected) {
    return <div>Connecting to room...</div>;
  }

  if (!roomData) {
    return <div>Loading room data...</div>;
  }

  return (
    <div>
      <h1>{roomData.name || `Room ${roomData.room_id}`}</h1>
      <p>Status: {roomData.votingStatus}</p>
      <p>Participants: {roomData.participants.length}</p>
      {/* Render rest of room UI */}
    </div>
  );
}
```

### Vue.js Composition API Example

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useRoomSocket(roomId: string, token: string) {
  const roomData = ref(null);
  const isConnected = ref(false);
  let socket = null;

  onMounted(() => {
    socket = io('http://localhost:3000', {
      auth: { token }
    });

    socket.on('connect', () => {
      isConnected.value = true;
      socket.emit('subscribe-room', roomId);
    });

    socket.on('disconnect', () => {
      isConnected.value = false;
    });

    socket.on('room-updated', (data) => {
      roomData.value = data;
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });
  });

  onUnmounted(() => {
    if (socket) {
      socket.emit('unsubscribe-room', roomId);
      socket.disconnect();
    }
  });

  return { roomData, isConnected };
}
```

## Room Response Schema

The `room-updated` event payload follows this schema:

```typescript
{
  room_id: string;              // Unique room identifier
  name?: string;                // Optional room name
  created_by: {
    id: string;
    name: string;
  };
  createdAt: Date;
  participants: Array<{         // List of users in room
    id: string;
    name: string;
  }>;
  votes: Record<string, 'XS' | 'S' | 'M' | 'L'>;  // userId -> vote mapping
  votingStatus: 'idle' | 'active' | 'closed';
  votingStartedAt?: Date;
  votingClosedAt?: Date;
  votingDuration?: string;      // Format: "mm:ss" (e.g., "05:30")
  revealed: boolean;
  agreedValue?: 'XS' | 'S' | 'M' | 'L';
}
```

## Testing WebSocket Connection

### Using Browser Console

```javascript
// Open browser console at http://localhost:3000/api-docs
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => console.log('Connected!'));
socket.on('room-updated', (data) => console.log('Room update:', data));
socket.emit('subscribe-room', 'YOUR_ROOM_ID');
```

### Using Node.js Script

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: process.env.JWT_TOKEN }
});

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('subscribe-room', process.env.ROOM_ID);
});

socket.on('room-updated', (data) => {
  console.log('Room updated:', JSON.stringify(data, null, 2));
});

socket.on('error', (error) => {
  console.error('Error:', error);
});
```

## Security Considerations

1. **Token Validation**: Every WebSocket connection must provide a valid JWT token
2. **Room Verification**: Server validates room existence before allowing subscription
3. **User Context**: Socket connections maintain user context (userId, userName)
4. **Isolated Rooms**: Updates are only sent to clients subscribed to the specific room

## Troubleshooting

### Connection Refused
- Verify server is running
- Check CORS settings match your client origin
- Ensure JWT token is valid and not expired

### Not Receiving Updates
- Verify you've successfully subscribed to the room
- Check that the room ID is correct
- Ensure the room exists in the database

### Authentication Errors
- Check JWT token is being passed in `auth.token`
- Verify token hasn't expired (24-hour validity)
- Confirm token was generated with correct JWT_SECRET

## Architecture Notes

### Server-Side Flow
1. Client connects with JWT token
2. Server validates token via middleware
3. Socket connection established with user context
4. Client emits `subscribe-room` event
5. Server validates room exists
6. Socket joins room channel
7. Any room state change triggers `emitRoomUpdate(roomId)`
8. All subscribed clients receive `room-updated` event

### Client-Side Flow
1. Establish socket connection with JWT
2. Listen for `connect` event
3. Emit `subscribe-room` with room ID
4. Listen for `room-updated` events
5. Update UI based on room state
6. Emit `unsubscribe-room` when leaving
7. Disconnect socket on cleanup

## Next Steps

- Implement reconnection logic with exponential backoff
- Add heartbeat/ping-pong for connection monitoring
- Consider implementing optimistic UI updates
- Add typing indicators for active users
- Implement presence (who's currently viewing the room)

