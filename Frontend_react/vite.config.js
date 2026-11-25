import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8001";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // Bibliotecas pesadas em arquivos próprios: o navegador as guarda em cache entre versões.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          gsap: ["gsap", "@gsap/react"],
          motion: ["motion"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": apiProxyTarget,
    },
  },
});
