import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    watch: {
      usePolling: false, // Use polling if file changes aren't detected
    },
    port: process.env.PORT || 8000, // Heroku provides the PORT environment variable
    hmr: true, // Ensure HMR is enabled
  },
  optimizeDeps: {
    include: ["nostr-tools"], // Pre-bundle nostr-tools
  },
});
