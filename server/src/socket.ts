import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth.middleware.js';
import { store } from './store.js';
import { RoomResponse } from './pokerPlanningRoom.model.js';

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

export function initializeSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  // Middleware to authenticate WebSocket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        name: string;
      };
      socket.userId = decoded.id;
      socket.userName = decoded.name;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(
      `User connected: ${socket.userName} (${socket.userId}) - Socket: ${socket.id}`,
    );

    // Handle room subscription
    socket.on('subscribe-room', (roomId: string) => {
      // Verify room exists
      const room = store.getRoom(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Join the room
      socket.join(roomId);
      console.log(`User ${socket.userName} subscribed to room ${roomId}`);

      // Notify user of successful subscription
      socket.emit('subscribed', { roomId });
    });

    // Handle unsubscribe from room
    socket.on('unsubscribe-room', (roomId: string) => {
      socket.leave(roomId);
      console.log(`User ${socket.userName} unsubscribed from room ${roomId}`);
      socket.emit('unsubscribed', { roomId });
    });

    socket.on('disconnect', () => {
      console.log(
        `User disconnected: ${socket.userName} (${socket.userId}) - Socket: ${socket.id}`,
      );
    });
  });

  // Monitor connected clients (only in non-test mode)
  if (process.env.NODE_ENV === 'test') {
    setInterval(() => {
      io.fetchSockets()
        .then((sockets) => {
          console.log(`Number of connected clients: ${sockets.length}`);
        })
        .catch((err) => {
          console.error('Error fetching sockets:', err);
        });
    }, 30_000);
  }

  return io;
}

// Function to emit room updates to all subscribed clients
export function emitRoomUpdate(roomId: string) {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  const room = store.getRoom(roomId);
  if (!room) {
    console.error(`Room ${roomId} not found`);
    return;
  }

  // Get room response with full details
  const owner = store.getUser(room.owner);
  const participantDetails = room.participants.map((participantId: string) => {
    const user = store.getUser(participantId);
    return {
      id: participantId,
      name: user?.name || 'Unknown',
    };
  });

  const votingDuration = room.votingStartedAt
    ? calculateVotingDuration(room.votingStartedAt, room.votingClosedAt)
    : undefined;

  const roomResponse = {
    room_id: room.id,
    name: room.name,
    created_by: {
      id: room.owner,
      name: owner?.name || 'Unknown',
    },
    createdAt: room.createdAt,
    participants: participantDetails,
    votes: room.votes,
    votingStatus: room.votingStatus,
    votingStartedAt: room.votingStartedAt,
    votingClosedAt: room.votingClosedAt,
    votingDuration,
    revealed: room.revealed,
    agreedValue: room.agreedValue,
  } as RoomResponse;

  // Emit to all clients subscribed to this room
  io.to(roomId).emit('room-updated', roomResponse);
  console.log(`Emitted room-updated event for room ${roomId}`);
}

// Helper function to calculate voting duration
function calculateVotingDuration(
  startedAt: Date,
  closedAt?: Date,
): string | undefined {
  if (!startedAt) return undefined;
  const endTime = closedAt || new Date();
  const durationMs = endTime.getTime() - startedAt.getTime();
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
