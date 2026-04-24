import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AnswersReport } from "@quiz-mcp/runner-api";
import { writeReportFile } from "./file.js";

const REPORT: AnswersReport = {
  quizId: "q1",
  title: "T",
  finished: true,
  items: [],
};

describe("writeReportFile", () => {
  let tmp: string;
  beforeAll(() => { tmp = mkdtempSync(join(tmpdir(), "file-sink-")); });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it("writes pretty-printed JSON", async () => {
    const path = join(tmp, "out.json");
    await writeReportFile(path, REPORT);
    const content = readFileSync(path, "utf8");
    expect(JSON.parse(content)).toEqual(REPORT);
    expect(content).toContain("\n  "); // pretty-printed
  });

  it("overwrites existing file", async () => {
    const path = join(tmp, "overwrite.json");
    writeFileSync(path, "old content");
    await writeReportFile(path, REPORT);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(REPORT);
  });
});
