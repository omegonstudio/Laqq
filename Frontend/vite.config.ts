import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  optimizeDeps: {
    force: true,
  },
  server: {
    host: "::",
    port: 8080,
    force: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode !== "production",
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "react";
          }
          if (
            id.includes("/node_modules/@reduxjs/") ||
            id.includes("/node_modules/react-redux/") ||
            id.includes("/node_modules/redux-persist/")
          ) {
            return "redux";
          }
          if (id.includes("/node_modules/@radix-ui/")) {
            return "radix";
          }
          if (id.includes("/node_modules/lucide-react/")) {
            return "icons";
          }
          if (id.includes("/node_modules/@tanstack/")) {
            return "query";
          }
          if (
            id.includes("/node_modules/@tiptap/") ||
            id.includes("/node_modules/prosemirror")
          ) {
            return "editor";
          }
          if (
            id.includes("/node_modules/recharts/") ||
            id.includes("/node_modules/d3-")
          ) {
            return "charts";
          }
          if (
            id.includes("/node_modules/@react-pdf/") ||
            id.includes("/node_modules/pdfmake/")
          ) {
            return "pdf";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    clearMocks: true,
  },
}));
