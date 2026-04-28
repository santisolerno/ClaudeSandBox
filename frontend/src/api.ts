const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function login(
  username: string,
  password: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Credenciales inválidas");
    }
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}
