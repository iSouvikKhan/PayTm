/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // The API is proxied in development, so the browser only talks to the Vite origin.
      proxy: {
        "/api": { target: env.VITE_PROXY_TARGET || "http://localhost:3000", changeOrigin: true },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.js"],
      css: false,
    },
  };
});
