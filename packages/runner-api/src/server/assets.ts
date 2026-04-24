import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

type ViteManifestEntry = {
  file: string;
  css?: string[];
  isEntry?: boolean;
};
type ViteManifest = Record<string, ViteManifestEntry>;

export type Assets = { js: string; css: string };

export type AssetsResolver = {
  getAssets: () => Assets;
  getRunnerUiDistDir: () => string;
};

const require_ = createRequire(import.meta.url);
const ENTRY_KEY = "src/main.tsx";
const IS_PROD = process.env.NODE_ENV === "production";

const resolveManifestPath = (uiAssetsDir?: string): string =>
  uiAssetsDir
    ? path.join(uiAssetsDir, ".vite/manifest.json")
    : require_.resolve("@quiz-mcp/runner-ui/manifest");

const resolveRunnerUiDistDir = (uiAssetsDir?: string): string =>
  uiAssetsDir ??
  path.join(
    path.dirname(require_.resolve("@quiz-mcp/runner-ui/package.json")),
    "dist",
  );

const readManifest = (manifestPath: string): Assets => {
  const raw = fs.readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(raw) as ViteManifest;
  const entry = manifest[ENTRY_KEY];
  if (!entry) throw new Error(`assets: manifest has no entry for "${ENTRY_KEY}" at ${manifestPath}`);
  const css = entry.css?.[0];
  if (!css) throw new Error(`assets: manifest entry "${ENTRY_KEY}" has no CSS asset`);
  return {
    js: `/assets/${path.basename(entry.file)}`,
    css: `/assets/${path.basename(css)}`,
  };
};

export function createAssetsResolver(uiAssetsDir?: string): AssetsResolver {
  const manifestPath = resolveManifestPath(uiAssetsDir);
  const distDir = resolveRunnerUiDistDir(uiAssetsDir);
  let cached: Assets | null = null;

  return {
    getAssets: () => {
      if (IS_PROD) {
        if (!cached) cached = readManifest(manifestPath);
        return cached;
      }
      return readManifest(manifestPath);
    },
    getRunnerUiDistDir: () => distDir,
  };
}
