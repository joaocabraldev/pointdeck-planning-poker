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
        // Error is handled in the store
        console.error('Signup failed:', error);
      }
    }
  };

  return (
    <div>
      <h1>Join Poker Planning</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          disabled={isLoading}
        />
        <button type="submit" disabled={!name.trim() || isLoading}>
          {isLoading ? 'Joining...' : 'Continue'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default Signup;
