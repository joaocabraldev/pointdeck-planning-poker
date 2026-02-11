import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import "./App.css";
import { useSessionStore } from "../store/sessionStore";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";

function App() {
  const session = useSessionStore((s) => s.session);
  const loadSession = useSessionStore((s) => s.loadSession);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return (
    <Routes>
      <Route
        path="/"
        element={session ? <Welcome /> : <Navigate to="/signup" replace />}
      />
      <Route
        path="/signup"
        element={session ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
