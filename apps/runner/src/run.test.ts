import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { run } from "./run.js";

const QUIZ = {
  id: "q1",
  title: "Demo",
  questions: [{ _kind: "short_text", id: "s1", text: "Name?", required: false }],
};

describe("run (integration)", () => {
  let tmp: string;
  beforeAll(() => { tmp = mkdtempSync(join(tmpdir(), "run-")); });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it("loads quiz, serves it, captures finish via HTTP, writes JSON file, exits 0", async () => {
    const quizPath = join(tmp, "q.json");
    const outPath = join(tmp, "r.json");
    writeFileSync(quizPath, JSON.stringify(QUIZ));

    const runPromise = run({
      argv: ["--file", quizPath, "--output", outPath],
      stdin: Readable.from([]),
      isStdinTty: true,
      onReady: async ({ url }) => {
        const res = await fetch(`${url}/q1/finish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: {
              s1: { _kind: "short_text", questionId: "s1", text: "Ada" },
            },
          }),
        });
        expect(res.status).toBe(204);
      },
    });

    const code = await runPromise;
    expect(code).toBe(0);

    const written = JSON.parse(readFileSync(outPath, "utf8"));
    expect(written).toMatchObject({
      quizId: "q1",
      title: "Demo",
      finished: true,
      items: [
        {
          question: { _kind: "short_text", id: "s1", text: "Name?" },
          answer: { _kind: "short_text", questionId: "s1", text: "Ada" },
        },
      ],
    });
  });

  it("returns exit code 1 on invalid args", async () => {
    const code = await run({
      argv: ["--wat"],
      stdin: Readable.from([]),
      isStdinTty: true,
    });
    expect(code).toBe(1);
  });

  it("returns exit code 1 on invalid quiz JSON", async () => {
    const code = await run({
      argv: ["--json", "{not json", "--output", join(tmp, "never.json")],
      stdin: Readable.from([]),
      isStdinTty: true,
    });
    expect(code).toBe(1);
  });
});
