import { useState, type FormEvent } from "react";
import { login } from "./api";

interface LoginProps {
  onSuccess: (message: string) => void;
}

function Login({ onSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { message } = await login(username, password);
      onSuccess(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h1>Iniciar sesión</h1>
      <label>
        <span>User</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </label>
      <label>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Validando..." : "Ingresar"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

export default Login;
