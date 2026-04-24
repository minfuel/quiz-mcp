import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnswersReport } from "@quiz-mcp/runner-api";
import { sendWebhook } from "./webhook.js";

const REPORT: AnswersReport = {
  quizId: "q1",
  title: "T",
  finished: true,
  items: [],
};

describe("sendWebhook", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("POSTs JSON body with content-type and resolves on 2xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendWebhook("https://example.com/hook", REPORT);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://example.com/hook");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body as string)).toEqual(REPORT);
  });

  it("rejects on non-2xx with status in message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 500, statusText: "Internal Server Error" })),
    );

    await expect(sendWebhook("https://x/hook", REPORT)).rejects.toThrow(
      /500.*internal server error/i,
    );
  });

  it("rejects on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    await expect(sendWebhook("https://x/hook", REPORT)).rejects.toThrow(/ECONNREFUSED/);
  });
});
