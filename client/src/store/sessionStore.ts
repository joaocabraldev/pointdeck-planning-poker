import { create } from "zustand";
import { session, user } from "../model";
import { storage } from "../storage";
import { apiClient } from "../api/client";
import { socketManager } from "../api/socket";

interface SessionState {
  session: session | null;
  isLoading: boolean;
  error: string | null;
  lastRoomId: string | null;
  loadSession: () => Promise<void>;
  signup: (name: string) => Promise<void>;
  logout: () => void;
  setLastRoom: (roomId: string) => void;
}

const useSessionStore = create<SessionState>((set) => ({
  session: null,
  isLoading: false,
  error: null,
  lastRoomId: storage.getItem<string>("lastRoomId"),

  loadSession: async () => {
    const stored = storage.getItem<session>("session");
    if (stored && stored.token) {
      apiClient.setToken(stored.token);
      try {
        await apiClient.getMe();
        const newSession = new session(
          new user(stored.user.id, stored.user.name),
          stored.id,
          stored.token
        );
        set({ session: newSession });
      } catch {
        // User no longer exists on server (e.g. server restarted) — clear stale session
        storage.removeItem("session");
        apiClient.clearToken();
      }
    }
  },

  signup: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.createSession(name);
      const newUser = new user(response.user.id, response.user.name);
      const newSession = new session(newUser, response.user.id, response.token);
      storage.setItem("session", newSession);
      apiClient.setToken(response.token);
      set({ session: newSession, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    storage.removeItem("session");
    storage.removeItem("lastRoomId");
    apiClient.clearToken();
    socketManager.disconnect();
    set({ session: null, lastRoomId: null });
  },

  setLastRoom: (roomId: string) => {
    storage.setItem("lastRoomId", roomId);
    set({ lastRoomId: roomId });
  },
}));

export { useSessionStore };
