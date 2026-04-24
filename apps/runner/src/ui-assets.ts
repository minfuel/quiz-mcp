import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// When the app is bundled for publishing, tsup's postbuild copies
// @quiz-mcp/runner-ui's Vite output to `dist/ui/`. Detect that layout at
// runtime so dev builds (where UI lives in the workspace) keep using the
// runner-api fallback via require.resolve.
export function resolveBundledUiDir(): string | undefined {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.join(here, "ui");
  return fs.existsSync(path.join(candidate, ".vite/manifest.json")) ? candidate : undefined;
}
