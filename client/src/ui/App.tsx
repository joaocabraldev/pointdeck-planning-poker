import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import './App.css';
import { useSessionStore } from '../store/sessionStore';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';
import Room from './pages/Room';

function App() {
  const session = useSessionStore((s) => s.session);
  const loadSession = useSessionStore((s) => s.loadSession);
  const location = useLocation();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Read the intended destination from navigation state (set when redirecting to /signup)
  const from = (location.state as { from?: string })?.from;

  return (
    <Routes>
      <Route
        path="/"
        element={session ? <Welcome /> : <Navigate to="/signup" replace />}
      />
      <Route
        path="/signup"
        element={session ? <Navigate to={from || '/'} replace /> : <Signup />}
      />
      <Route
        path="/rooms/:roomId"
        element={
          session ? (
            <Room />
          ) : (
            <Navigate
              to="/signup"
              state={{ from: location.pathname }}
              replace
            />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
