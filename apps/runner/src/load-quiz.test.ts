import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadQuiz } from "./load-quiz.js";

const VALID_QUIZ = {
  id: "q1",
  title: "T",
  questions: [],
};

describe("loadQuiz", () => {
  const tmp = mkdtempSync(join(tmpdir(), "runner-test-"));
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads a quiz from a file", async () => {
    const path = join(tmp, "q.json");
    writeFileSync(path, JSON.stringify(VALID_QUIZ));
    const quiz = await loadQuiz({ kind: "file", path }, Readable.from([]));
    expect(quiz).toEqual(VALID_QUIZ);
  });

  it("loads a quiz from inline --json", async () => {
    const quiz = await loadQuiz(
      { kind: "json", raw: JSON.stringify(VALID_QUIZ) },
      Readable.from([]),
    );
    expect(quiz).toEqual(VALID_QUIZ);
  });

  it("loads a quiz from a URL via fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(VALID_QUIZ), { status: 200 }),
      ),
    );
    const quiz = await loadQuiz(
      { kind: "url", url: "https://example.com/q.json" },
      Readable.from([]),
    );
    expect(quiz).toEqual(VALID_QUIZ);
  });

  it("throws when --url fetch returns non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );
    await expect(
      loadQuiz({ kind: "url", url: "https://example.com/q.json" }, Readable.from([])),
    ).rejects.toThrow(/failed to fetch.*404/i);
  });

  it("loads a quiz from stdin", async () => {
    const stdin = Readable.from([JSON.stringify(VALID_QUIZ)]);
    const quiz = await loadQuiz({ kind: "stdin" }, stdin);
    expect(quiz).toEqual(VALID_QUIZ);
  });

  it("throws on invalid JSON", async () => {
    await expect(
      loadQuiz({ kind: "json", raw: "not-json" }, Readable.from([])),
    ).rejects.toThrow(/invalid json/i);
  });

  it("throws on a quiz that fails schema validation", async () => {
    await expect(
      loadQuiz({ kind: "json", raw: '{"id":"x"}' }, Readable.from([])),
    ).rejects.toThrow(/invalid quiz/i);
  });

  afterEach(() => {
    // keep temp dir across tests; cleanup at end
  });

  // final cleanup
  it.sequential("cleanup", () => {
    rmSync(tmp, { recursive: true, force: true });
  });
});
