import { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router";
import "./App.css";
import { useSessionStore } from "../store/sessionStore";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import Room from "./pages/Room";

function App() {
  const session = useSessionStore((s) => s.session);
  const loadSession = useSessionStore((s) => s.loadSession);
  const location = useLocation();
  const intendedDestination = useRef<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Save intended destination when accessing room without auth
  if (!session && location.pathname.startsWith('/rooms/') && !intendedDestination.current) {
    intendedDestination.current = location.pathname;
  }

  // Handle redirect after authentication
  const redirectPath = session && intendedDestination.current ? intendedDestination.current : null;
  if (redirectPath) {
    intendedDestination.current = null;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={session ? <Welcome /> : <Navigate to="/signup" replace />}
      />
      <Route
        path="/signup"
        element={
          session ? (
            redirectPath ? (
              <Navigate to={redirectPath} replace />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <Signup />
          )
        }
      />
      <Route
        path="/rooms/:roomId"
        element={session ? <Room /> : <Navigate to="/signup" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
