import { User } from './user.model.js';
import { PokerPlanningRoom } from './pokerPlanningRoom.model.js';

class Store {
  private users: Map<string, User> = new Map();
  private rooms: Map<string, PokerPlanningRoom> = new Map();

  // User methods
  createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  // Room methods
  createRoom(room: PokerPlanningRoom): PokerPlanningRoom {
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(id: string): PokerPlanningRoom | undefined {
    return this.rooms.get(id);
  }

  updateRoom(
    id: string,
    updates: Partial<PokerPlanningRoom>,
  ): PokerPlanningRoom | undefined {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  // Utility methods for testing
  clear(): void {
    this.users.clear();
    this.rooms.clear();
  }
}

// Singleton instance
export const store = new Store();
