import { io, Socket } from 'socket.io-client';
import type { RoomResponse } from './client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketManager {
  private socket: Socket | null = null;
  private roomId: string | null = null;

  connect(token: string): Socket {
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
    if (!this.socket) throw new Error('Socket not connected');
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

  onRoomUpdate(callback: (data: RoomResponse) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('room-updated', callback);
  }

  offRoomUpdate(callback: (data: RoomResponse) => void) {
    if (!this.socket) return;
    this.socket.off('room-updated', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();
