import { useState } from "react";
import { useSessionStore } from "../../store/sessionStore";

function Signup() {
  const [name, setName] = useState("");
  const signup = useSessionStore((s) => s.signup);
  const isLoading = useSessionStore((s) => s.isLoading);
  const error = useSessionStore((s) => s.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      try {
        await signup(name.trim());
      } catch (error) {
        console.error('Signup failed:', error);
      }
    }
  };

  return (
    <div className="app-shell">
      <div className="page-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            background: 'var(--accent)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem',
          }}>
            <span style={{ color: 'white' }}>&#9830;</span>
          </div>
          <h1>Poker Planning</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Enter your name to join
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!name.trim() || isLoading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
          >
            {isLoading ? 'Joining...' : 'Continue'}
          </button>
          {error && <p className="toast toast-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Signup;
