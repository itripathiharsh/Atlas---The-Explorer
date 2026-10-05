import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// --host exposes the dev server on the LAN so a phone can open it.
// basicSsl gives HTTPS so the browser allows geolocation over LAN.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === "development" ? [basicSsl()] : [])],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      "/uploads": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
}));
