import { useSessionStore } from "../../store/sessionStore";

function Welcome() {
  const session = useSessionStore((s) => s.session);

  return (
    <div>
      <h1>Welcome, {session?.user.name}</h1>
    </div>
  );
}

export default Welcome;
