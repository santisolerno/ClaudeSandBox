import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function App() {
  const [message, setMessage] = useState<string>("Cargando...");

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((r) => r.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage(`Error: ${err.message}`));
  }, []);

  return (
    <main>
      <h1>ClaudeSandBox</h1>
      <p>
        Backend dice: <strong>{message}</strong>
      </p>
    </main>
  );
}

export default App;
