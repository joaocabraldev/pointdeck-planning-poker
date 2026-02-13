import { useState } from "react";
import { useNavigate } from "react-router";
import { useSessionStore } from "../../store/sessionStore";
import { apiClient } from "../../api/client";

const AVATAR_COLORS = ['#4f6ef7', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Welcome() {
  const session = useSessionStore((s) => s.session);
  const logout = useSessionStore((s) => s.logout);
  const lastRoomId = useSessionStore((s) => s.lastRoomId);
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userName = session?.user.name || '';
  const initial = userName.charAt(0).toUpperCase();

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await apiClient.createRoom();
      navigate(`/rooms/${response.room_id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
      setIsCreating(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="page-card" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="avatar"
              style={{
                background: getAvatarColor(userName),
                width: '2.5rem',
                height: '2.5rem',
                fontSize: '1rem',
              }}
            >
              {initial}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{userName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Online</div>
            </div>
          </div>
          <button className="btn-ghost" onClick={logout}>Logout</button>
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            background: 'var(--accent-light)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            fontSize: '1.75rem',
          }}>
            <span style={{ color: 'var(--accent)' }}>&#9830;</span>
          </div>
          <h1 style={{ marginBottom: '0.5rem' }}>Planning Poker</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Create a room and invite your team to start estimating
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn-primary"
              onClick={handleCreateRoom}
              disabled={isCreating}
              style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}
            >
              {isCreating ? 'Creating...' : '+ Create New Room'}
            </button>

            {lastRoomId && (
              <button
                className="btn-outline"
                onClick={() => navigate(`/rooms/${lastRoomId}`)}
                style={{ padding: '0.625rem 1.5rem', fontSize: '0.9rem' }}
              >
                Return to Last Room
              </button>
            )}
          </div>

          {error && <p className="toast toast-error" style={{ marginTop: '1rem' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default Welcome;
