import { useState } from "react";
import { useSessionStore } from "../../store/sessionStore";

function Signup() {
  const [name, setName] = useState("");
  const signup = useSessionStore((s) => s.signup);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (name.trim()) {
      signup(name.trim());
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
        />
        <button type="submit" disabled={!name.trim()}>
          Continue
        </button>
      </form>
    </div>
  );
}

export default Signup;
