import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Force a known-good PostCSS pipeline shape.
// Note: we intentionally avoid importing autoprefixer directly here because
// it may not be present as a direct dependency; PostCSS/Vite can resolve it.









const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

const basePath = process.env.BASE_PATH ?? "/";

const apiProxyTarget =
  process.env["VITE_API_URL"] ||
  process.env["API_URL"] ||
  "http://127.0.0.1:3000";


export default defineConfig({
  envDir: '../../',
  base: basePath,
  // Let Vite/PostCSS load configuration from postcss.config.js/cjs directly.
  // This avoids mismatched PostCSS plugin shapes causing `postcssConfig?.plugins.slice` crashes.
  // css: {
  //   postcss: postcssConfig,
  // },
  plugins: [
    tailwindcss(),
    react(),

    runtimeErrorOverlay(),

      // Replit plugins removed for local development
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: Number.isNaN(port) || port <= 0 ? 5173 : port,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: Number.isNaN(port) || port <= 0 ? 5173 : port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
