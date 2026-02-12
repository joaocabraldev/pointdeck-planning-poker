# Frontend Integration Guide

## Overview

This guide will help you integrate the Poker Planning API into your frontend application. The application uses a combination of REST API calls for actions and WebSocket connections for real-time updates.

## Architecture

```
Frontend App
    ↓
[HTTP Client] ←→ REST API (http://localhost:3000)
    ↓
[WebSocket Client] ←→ WebSocket Server (ws://localhost:3000)
```

## Step-by-Step Integration

### 1. Setup & Dependencies

Install required dependencies:

```bash
npm install socket.io-client
```

### 2. API Client Setup

Create an API client to handle HTTP requests:

```typescript
// src/api/client.ts
const API_BASE_URL = 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('poker_jwt', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('poker_jwt');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('poker_jwt');
  }

  private async request(method: string, path: string, body?: any) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    // Some endpoints return no content
    if (response.status === 200 && response.headers.get('content-length') === '0') {
      return null;
    }

    return response.json();
  }

  // Auth
  async createSession(name: string) {
    const data = await this.request('POST', '/session', { name });
    this.setToken(data.token);
    return data;
  }

  // Rooms
  async createRoom(name?: string) {
    return this.request('POST', '/rooms', { name });
  }

  async getRoom(roomId: string) {
    return this.request('GET', `/rooms/${roomId}`);
  }

  async joinRoom(roomId: string) {
    return this.request('POST', `/rooms/${roomId}/join`);
  }

  async removeParticipant(roomId: string, participantId: string) {
    return this.request('DELETE', `/rooms/${roomId}/participants/${participantId}`);
  }

  // Voting
  async startVoting(roomId: string) {
    return this.request('POST', `/rooms/${roomId}/voting/start`);
  }

  async submitVote(roomId: string, vote: 'XS' | 'S' | 'M' | 'L') {
    return this.request('POST', `/rooms/${roomId}/votes`, { vote });
  }

  async cancelVote(roomId: string) {
    return this.request('DELETE', `/rooms/${roomId}/votes`);
  }

  async closeVoting(roomId: string) {
    return this.request('POST', `/rooms/${roomId}/voting/close`);
  }

  async resetVoting(roomId: string) {
    return this.request('POST', `/rooms/${roomId}/voting/reset`);
  }

  async setAgreedValue(roomId: string, value: 'XS' | 'S' | 'M' | 'L') {
    return this.request('POST', `/rooms/${roomId}/agreed-value`, { value });
  }
}

export const apiClient = new ApiClient();
```

### 3. WebSocket Manager

Create a WebSocket manager for real-time updates:

```typescript
// src/api/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class SocketManager {
  private socket: Socket | null = null;
  private roomId: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      // Resubscribe to room if we were in one
      if (this.roomId) {
        this.subscribeToRoom(this.roomId);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return this.socket;
  }

  subscribeToRoom(roomId: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.roomId = roomId;
    this.socket.emit('subscribe-room', roomId);
  }

  unsubscribeFromRoom(roomId: string) {
    if (!this.socket) return;

    this.socket.emit('unsubscribe-room', roomId);
    if (this.roomId === roomId) {
      this.roomId = null;
    }
  }

  onRoomUpdate(callback: (data: any) => void) {
    this.socket?.on('room-updated', callback);
  }

  onSubscribed(callback: (data: { roomId: string }) => void) {
    this.socket?.on('subscribed', callback);
  }

  onError(callback: (data: { message: string }) => void) {
    this.socket?.on('error', callback);
  }

  disconnect() {
    if (this.socket) {
      if (this.roomId) {
        this.unsubscribeFromRoom(this.roomId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketManager = new SocketManager();
```

### 4. TypeScript Type Definitions

```typescript
// src/types/room.ts
export type VoteValue = 'XS' | 'S' | 'M' | 'L';
export type VotingStatus = 'idle' | 'active' | 'closed';

export interface User {
  id: string;
  name: string;
}

export interface Participant {
  id: string;
  name: string;
}

export interface RoomData {
  room_id: string;
  name?: string;
  created_by: {
    id: string;
    name: string;
  };
  createdAt: string;
  participants: Participant[];
  votes: Record<string, VoteValue>;
  votingStatus: VotingStatus;
  votingStartedAt?: string;
  votingClosedAt?: string;
  votingDuration?: string;
  revealed: boolean;
  agreedValue?: VoteValue;
}
```

### 5. React Integration

#### Authentication Hook

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { socketManager } from '../api/socket';
import { User } from '../types/room';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      socketManager.connect(token);
    }
    setLoading(false);
  }, []);

  const login = async (name: string) => {
    const response = await apiClient.createSession(name);
    setUser(response.user);
    socketManager.connect(response.token);
    return response;
  };

  const logout = () => {
    apiClient.clearToken();
    socketManager.disconnect();
    setUser(null);
  };

  return { user, loading, login, logout };
}
```

#### Room Hook

```typescript
// src/hooks/useRoom.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { socketManager } from '../api/socket';
import { RoomData } from '../types/room';

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRoom = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getRoom(roomId);
        if (mounted) {
          setRoom(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load room');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRoom();

    // Subscribe to real-time updates
    socketManager.subscribeToRoom(roomId);

    const handleRoomUpdate = (data: RoomData) => {
      if (data.room_id === roomId && mounted) {
        setRoom(data);
      }
    };

    socketManager.onRoomUpdate(handleRoomUpdate);

    return () => {
      mounted = false;
      socketManager.unsubscribeFromRoom(roomId);
    };
  }, [roomId]);

  return { room, loading, error };
}
```

#### Room Page Component Example

```typescript
// src/pages/RoomPage.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { apiClient } from '../api/client';
import { VoteValue } from '../types/room';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, loading, error } = useRoom(roomId!);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div>Loading room...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!room) return <div>Room not found</div>;

  const userId = 'YOUR_USER_ID'; // Get from auth context
  const isOwner = room.created_by.id === userId;
  const myVote = room.votes[userId];

  const handleVote = async (vote: VoteValue) => {
    try {
      setSubmitting(true);
      await apiClient.submitVote(roomId!, vote);
    } catch (err) {
      console.error('Failed to submit vote:', err);
      alert('Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartVoting = async () => {
    try {
      await apiClient.startVoting(roomId!);
    } catch (err) {
      console.error('Failed to start voting:', err);
      alert('Failed to start voting');
    }
  };

  const handleCloseVoting = async () => {
    try {
      await apiClient.closeVoting(roomId!);
    } catch (err) {
      console.error('Failed to close voting:', err);
    }
  };

  const handleSetAgreedValue = async (value: VoteValue) => {
    try {
      await apiClient.setAgreedValue(roomId!, value);
    } catch (err) {
      console.error('Failed to set agreed value:', err);
    }
  };

  return (
    <div className="room-page">
      <h1>{room.name || `Room ${room.room_id}`}</h1>
      
      {/* Participants */}
      <div className="participants">
        <h2>Participants ({room.participants.length})</h2>
        <ul>
          {room.participants.map(p => (
            <li key={p.id}>
              {p.name}
              {room.votingStatus === 'active' && room.votes[p.id] && ' ✓'}
            </li>
          ))}
        </ul>
      </div>

      {/* Voting Status */}
      <div className="voting-status">
        <p>Status: {room.votingStatus}</p>
        {room.votingDuration && <p>Duration: {room.votingDuration}</p>}
        {room.agreedValue && <p>Agreed Value: {room.agreedValue}</p>}
      </div>

      {/* Owner Controls */}
      {isOwner && (
        <div className="owner-controls">
          {room.votingStatus === 'idle' && (
            <button onClick={handleStartVoting}>Start Voting</button>
          )}
          {room.votingStatus === 'active' && (
            <button onClick={handleCloseVoting}>Close Voting</button>
          )}
          {room.votingStatus === 'closed' && !room.agreedValue && (
            <div>
              <p>Set agreed value:</p>
              {(['XS', 'S', 'M', 'L'] as const).map(value => (
                <button key={value} onClick={() => handleSetAgreedValue(value)}>
                  {value}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Voting Cards */}
      {room.votingStatus === 'active' && (
        <div className="voting-cards">
          <h3>Cast your vote:</h3>
          {(['XS', 'S', 'M', 'L'] as const).map(vote => (
            <button
              key={vote}
              onClick={() => handleVote(vote)}
              disabled={submitting}
              className={myVote === vote ? 'selected' : ''}
            >
              {vote}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {room.revealed && (
        <div className="results">
          <h3>Votes:</h3>
          {Object.entries(room.votes).map(([userId, vote]) => {
            const participant = room.participants.find(p => p.id === userId);
            return (
              <div key={userId}>
                {participant?.name}: {vote}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### 6. Vue.js Integration (Alternative)

#### Composable for Room

```typescript
// composables/useRoom.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { apiClient } from '../api/client';
import { socketManager } from '../api/socket';
import type { RoomData } from '../types/room';

export function useRoom(roomId: string) {
  const room = ref<RoomData | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const loadRoom = async () => {
    try {
      loading.value = true;
      const data = await apiClient.getRoom(roomId);
      room.value = data;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load room';
    } finally {
      loading.value = false;
    }
  };

  const handleRoomUpdate = (data: RoomData) => {
    if (data.room_id === roomId) {
      room.value = data;
    }
  };

  onMounted(async () => {
    await loadRoom();
    socketManager.subscribeToRoom(roomId);
    socketManager.onRoomUpdate(handleRoomUpdate);
  });

  onUnmounted(() => {
    socketManager.unsubscribeFromRoom(roomId);
  });

  return { room, loading, error };
}
```

## Common Pitfalls & Solutions

### 1. Token Not Sent
**Problem:** 401 Unauthorized errors
**Solution:** Ensure Authorization header is included in all API requests
```typescript
headers: { 'Authorization': `Bearer ${token}` }
```

### 2. WebSocket Reconnection
**Problem:** WebSocket disconnects and doesn't reconnect
**Solution:** Implement proper reconnection logic and resubscribe to room
```typescript
socket.on('connect', () => {
  if (this.roomId) {
    this.subscribeToRoom(this.roomId);
  }
});
```

### 3. Vote Privacy
**Problem:** Showing votes before they should be revealed
**Solution:** Only display votes when `revealed === true`
```typescript
{room.revealed && <VotesList votes={room.votes} />}
```

### 4. Room Owner Check
**Problem:** Non-owners seeing owner controls
**Solution:** Check user ID matches room creator
```typescript
const isOwner = room.created_by.id === currentUser.id;
```

### 5. State Synchronization
**Problem:** UI out of sync with server
**Solution:** Always use WebSocket updates as source of truth
```typescript
// Don't rely on local state, use WebSocket updates
socketManager.onRoomUpdate((data) => {
  setRoom(data); // Update from server
});
```

## UI/UX Recommendations

### Voting Cards Design
- Make cards large and tappable (minimum 80x120px)
- Use distinct colors for each size
- Show clear selected state
- Disable cards when voting is not active
- Add hover effects

### Real-time Feedback
- Show "Connecting..." state while WebSocket connects
- Indicate when someone joins/leaves with notifications
- Show checkmarks (✓) for participants who voted
- Animate card flips when revealing votes
- Display connection status indicator

### Owner Features
- Clearly badge the owner in participant list
- Show owner-only buttons with distinct styling
- Confirm destructive actions (reset, remove participant)
- Disable owner actions when not applicable

### Error Handling
- Show toast/snackbar for errors
- Handle token expiration gracefully (redirect to login)
- Provide retry mechanism for failed actions
- Show meaningful error messages

### Loading States
- Show skeleton loaders for room data
- Disable buttons during submission
- Show loading spinner for async actions

## Testing Checklist

### Manual Testing

- [ ] Can create session and receive token
- [ ] Token is stored in localStorage
- [ ] Can create room
- [ ] Can join existing room
- [ ] Participant appears in list (real-time)
- [ ] Owner can start voting
- [ ] Participants can vote
- [ ] Can change vote
- [ ] Can cancel vote
- [ ] Non-voters show as not voted
- [ ] Owner can close voting
- [ ] Votes are revealed correctly
- [ ] Owner can set agreed value
- [ ] Owner can reset voting
- [ ] WebSocket reconnects properly
- [ ] Multiple users see same state

## Performance Tips

1. **Use React.memo** for components that don't need frequent re-renders
2. **Debounce** rapid vote changes
3. **Lazy load** room data
4. **Cache** user session in context
5. **Optimize** re-renders with proper dependency arrays

## Security Considerations

1. **Token Storage:** Use localStorage (or httpOnly cookies for production)
2. **Token Expiration:** Handle 401 errors and redirect to login
3. **Input Validation:** Validate vote values client-side
4. **XSS Protection:** Sanitize user names if rendering as HTML
5. **HTTPS:** Use HTTPS in production

## Next Steps

1. Implement authentication flow
2. Create room creation UI
3. Build room page with voting cards
4. Add WebSocket integration
5. Style components
6. Add loading and error states
7. Test with multiple users
8. Deploy!

## Example Project Structure

```
src/
├── api/
│   ├── client.ts          # API client
│   └── socket.ts          # WebSocket manager
├── hooks/
│   ├── useAuth.ts         # Authentication hook
│   └── useRoom.ts         # Room hook
├── pages/
│   ├── LoginPage.tsx      # Login/signup
│   ├── HomePage.tsx       # Create/join room
│   └── RoomPage.tsx       # Main voting interface
├── components/
│   ├── ParticipantsList.tsx
│   ├── VotingCards.tsx
│   ├── VotingStatus.tsx
│   ├── VoteResults.tsx
│   └── OwnerControls.tsx
├── types/
│   └── room.ts            # TypeScript types
└── App.tsx
```

Good luck with your implementation! 🚀

