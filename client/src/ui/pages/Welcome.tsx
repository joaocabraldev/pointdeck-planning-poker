import { useState } from "react";
import { useNavigate } from "react-router";
import { useSessionStore } from "../../store/sessionStore";
import { apiClient } from "../../api/client";

function Welcome() {
  const session = useSessionStore((s) => s.session);
  const logout = useSessionStore((s) => s.logout);
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Welcome, {session?.user.name}!</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h2>Poker Planning</h2>
        <p>Create a new planning poker room to start estimating with your team.</p>

        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            marginTop: '2rem',
            cursor: isCreating ? 'not-allowed' : 'pointer'
          }}
        >
          {isCreating ? 'Creating Room...' : 'Create New Room'}
        </button>

        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Welcome;
