import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expone en 0.0.0.0 para que el container sea accesible desde el host
    port: 5173,
    watch: {
      // Necesario para que Vite detecte cambios en bind mounts (Win + Mac)
      usePolling: true,
    },
  },
});
