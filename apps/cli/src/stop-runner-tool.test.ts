import { describe, expect, it, vi } from "vitest";
import { makeStopRunnerHandler } from "./stop-runner-tool.js";

describe("stop_runner handler", () => {
  it("returns wasRunning=true when host.stop() returns true", async () => {
    const host = { stop: vi.fn().mockResolvedValue(true) };
    const handler = makeStopRunnerHandler(host);
    const result = await handler();

    expect(host.stop).toHaveBeenCalledTimes(1);
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ wasRunning: true });
    expect(result.content).toHaveLength(1);
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toContain("wasRunning=true");
  });

  it("returns wasRunning=false when host.stop() returns false", async () => {
    const host = { stop: vi.fn().mockResolvedValue(false) };
    const handler = makeStopRunnerHandler(host);
    const result = await handler();

    expect(result.structuredContent).toEqual({ wasRunning: false });
    const text = (result.content[0] as { type: "text"; text: string }).text;
    expect(text).toContain("wasRunning=false");
  });
});
