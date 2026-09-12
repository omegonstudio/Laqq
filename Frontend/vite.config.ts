import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import {
  buildRobotsTxt,
  buildSitemapXml,
  DEFAULT_SITE_ORIGIN,
  normalizeSiteOrigin,
} from "./src/config/siteOrigin";

/**
 * Genera robots.txt y sitemap.xml en dist/ con VITE_SITE_ORIGIN.
 * Sobrescribe los estáticos de public/ (que quedan como fallback local).
 */
function seoOriginStaticFiles(siteOrigin: string): Plugin {
  const origin = normalizeSiteOrigin(siteOrigin);
  return {
    name: "seo-origin-static-files",
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir;
      if (!outDir) return;
      fs.writeFileSync(path.join(outDir, "robots.txt"), buildRobotsTxt(origin));
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), buildSitemapXml(origin));
    },
  };
}

/**
 * favicon-dev.ico en desarrollo; favicon.ico en prod.
 * En build de producción elimina favicon-dev.ico de dist/ (no se despliega).
 */
function faviconByMode(mode: string): Plugin {
  const isDev = mode === "development";
  const faviconHref = isDev ? "/favicon-dev.ico" : "/favicon.ico";

  return {
    name: "favicon-by-mode",
    transformIndexHtml(html) {
      return html.replace(
        /(<link\s+rel="icon"\s+href=")\/favicon(?:-dev)?\.ico(")/,
        `$1${faviconHref}$2`
      );
    },
    configureServer(server) {
      // Browsers that auto-request /favicon.ico also get the dev icon.
      server.middlewares.use((req, _res, next) => {
        if (req.url === "/favicon.ico" || req.url?.startsWith("/favicon.ico?")) {
          req.url = "/favicon-dev.ico";
        }
        next();
      });
    },
    writeBundle(outputOptions) {
      if (isDev) return;
      const outDir = outputOptions.dir;
      if (!outDir) return;
      const dest = path.join(outDir, "favicon-dev.ico");
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteOrigin = normalizeSiteOrigin(
    process.env.VITE_SITE_ORIGIN || env.VITE_SITE_ORIGIN || DEFAULT_SITE_ORIGIN
  );
  // Garantiza sustitución en index.html (%VITE_SITE_ORIGIN%) — nunca vacío.
  process.env.VITE_SITE_ORIGIN = siteOrigin;

  return {
    optimizeDeps: {
      force: true,
    },
    server: {
      host: "::",
      port: 8080,
      force: true,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      faviconByMode(mode),
      seoOriginStaticFiles(siteOrigin),
    ].filter(Boolean),
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
  };
});
