import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const here = path.dirname(fileURLToPath(import.meta.url));
const runnerUiDist = path.resolve(here, "../../packages/runner-ui/dist");

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  outDir: "dist",
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  dts: false,
  splitting: false,
  shims: false,
  noExternal: [/^@quiz-mcp\//],
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "hono/jsx";
  },
  async onSuccess() {
    const dst = path.resolve(here, "dist/ui");
    if (!fs.existsSync(runnerUiDist)) {
      throw new Error(
        `tsup postbuild: expected ${runnerUiDist} to exist. Run \`pnpm --filter @quiz-mcp/runner-ui build\` first.`,
      );
    }
    fs.rmSync(dst, { recursive: true, force: true });
    fs.cpSync(runnerUiDist, dst, { recursive: true });
  },
});
