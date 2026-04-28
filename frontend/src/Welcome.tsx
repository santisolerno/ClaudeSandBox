interface WelcomeProps {
  message: string;
  onLogout: () => void;
}

function Welcome({ message, onLogout }: WelcomeProps) {
  return (
    <section className="welcome">
      <h1>{message}</h1>
      <p>El backend respondió correctamente al login.</p>
      <button type="button" onClick={onLogout}>
        Cerrar sesión
      </button>
    </section>
  );
}

export default Welcome;
