import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveBundledUiDir(): string | undefined {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.join(here, "ui");
  return fs.existsSync(path.join(candidate, ".vite/manifest.json")) ? candidate : undefined;
}
