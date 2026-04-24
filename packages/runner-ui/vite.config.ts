import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const isWatch = process.argv.includes("--watch");

export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "hono/jsx/dom",
  },
  build: {
    outDir: "dist",
    emptyOutDir: !isWatch,
    manifest: true,
    sourcemap: true,
    rollupOptions: {
      input: "src/main.tsx",
    },
  },
});
