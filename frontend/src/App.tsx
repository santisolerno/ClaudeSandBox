import { useState } from "react";
import Login from "./Login";
import Welcome from "./Welcome";

function App() {
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  return (
    <main>
      {welcomeMessage === null ? (
        <Login onSuccess={setWelcomeMessage} />
      ) : (
        <Welcome
          message={welcomeMessage}
          onLogout={() => setWelcomeMessage(null)}
        />
      )}
    </main>
  );
}

export default App;
