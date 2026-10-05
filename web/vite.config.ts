import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Default `npm run dev` is plain HTTP — localhost is a secure context, so
// geolocation works without a certificate (and the in-app browser is happy).
// `npm run dev:host` adds HTTPS for phone testing over the LAN, where the
// origin is a plain IP and browsers require a secure context for geolocation.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === "https" ? [basicSsl()] : [])],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // ATLAS backend lives on 8777 — port 8000 collides with another project
      "/api": { target: "http://localhost:8777", changeOrigin: true },
      "/uploads": { target: "http://localhost:8777", changeOrigin: true },
    },
  },
}));
