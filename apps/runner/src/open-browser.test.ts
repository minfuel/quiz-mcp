import { beforeEach, describe, expect, it, vi } from "vitest";

const spawnMock = vi.fn();

vi.mock("node:child_process", () => ({
  spawn: spawnMock,
}));

describe("openBrowser", () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  it("registers an error handler so missing browser tools do not crash", async () => {
    const onceMock = vi.fn();
    const unrefMock = vi.fn();
    spawnMock.mockReturnValue({ once: onceMock, unref: unrefMock });

    const { openBrowser } = await import("./open-browser.js");
    openBrowser("http://localhost:3000");

    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(onceMock).toHaveBeenCalledTimes(1);
    expect(onceMock).toHaveBeenCalledWith("error", expect.any(Function));
    expect(unrefMock).toHaveBeenCalledTimes(1);
  });
});