import { spawn } from "node:child_process";

export function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" :
    process.platform === "win32"  ? "start" :
                                     "xdg-open";
  const args = process.platform === "win32" ? ["", url] : [url];
  try {
    const child = spawn(cmd, args, {
      stdio: "ignore",
      detached: true,
      shell: process.platform === "win32",
    });
    child.once("error", (err) => {
      console.error(`failed to open browser: ${err.message}`);
    });
    child.unref();
  } catch (err) {
    console.error(`failed to open browser: ${(err as Error).message}`);
  }
}
