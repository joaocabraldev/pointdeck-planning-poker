import { create } from "zustand";
import { session, user } from "../model";
import { storage } from "../storage";

interface SessionState {
  session: session | null;
  loadSession: () => void;
  signup: (name: string) => void;
  logout: () => void;
}

const useSessionStore = create<SessionState>((set) => ({
  session: null,

  loadSession: () => {
    const stored = storage.getItem<session>("session");
    if (stored) {
      set({
        session: new session(
          new user(stored.user.id, stored.user.name),
          stored.id,
          stored.token
        ),
      });
    }
  },

  signup: (name: string) => {
    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const newUser = new user(id, name);
    const newSession = new session(newUser, id, token);
    storage.setItem("session", newSession);
    set({ session: newSession });
  },

  logout: () => {
    storage.removeItem("session");
    set({ session: null });
  },
}));

export { useSessionStore };
