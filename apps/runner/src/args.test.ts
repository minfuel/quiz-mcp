import { describe, expect, it } from "vitest";
import { parseCliArgs, ArgsError } from "./args.js";

describe("parseCliArgs", () => {
  it("parses --file + --output", () => {
    const args = parseCliArgs(["--file", "quiz.json", "--output", "r.json"], true);
    expect(args.source).toEqual({ kind: "file", path: "quiz.json" });
    expect(args.output).toBe("r.json");
    expect(args.onComplete).toBeUndefined();
    expect(args.open).toBe(false);
  });

  it("parses --url + --on-complete", () => {
    const args = parseCliArgs(
      ["--url", "https://x/q.json", "--on-complete", "https://x/hook"],
      true,
    );
    expect(args.source).toEqual({ kind: "url", url: "https://x/q.json" });
    expect(args.onComplete).toBe("https://x/hook");
  });

  it("parses --json inline source", () => {
    const args = parseCliArgs(
      ["--json", '{"id":"a","title":"b","questions":[]}', "--output", "r.json"],
      true,
    );
    expect(args.source).toEqual({
      kind: "json",
      raw: '{"id":"a","title":"b","questions":[]}',
    });
  });

  it("detects stdin source when stdin is not a TTY and no source flag is given", () => {
    const args = parseCliArgs(["--output", "r.json"], false);
    expect(args.source).toEqual({ kind: "stdin" });
  });

  it("rejects zero sources (stdin is a TTY, no flags)", () => {
    expect(() => parseCliArgs(["--output", "r.json"], true)).toThrow(ArgsError);
    expect(() => parseCliArgs(["--output", "r.json"], true)).toThrow(
      /exactly one source/i,
    );
  });

  it("rejects two sources", () => {
    expect(() =>
      parseCliArgs(
        ["--file", "q.json", "--url", "https://x", "--output", "r.json"],
        true,
      ),
    ).toThrow(/exactly one source/i);
  });

  it("rejects stdin source plus a flag source", () => {
    expect(() =>
      parseCliArgs(["--file", "q.json", "--output", "r.json"], false),
    ).toThrow(/exactly one source/i);
  });

  it("rejects zero sinks", () => {
    expect(() => parseCliArgs(["--file", "q.json"], true)).toThrow(
      /at least one sink/i,
    );
  });

  it("accepts both sinks at once", () => {
    const args = parseCliArgs(
      ["--file", "q.json", "--output", "r.json", "--on-complete", "https://x/hook"],
      true,
    );
    expect(args.output).toBe("r.json");
    expect(args.onComplete).toBe("https://x/hook");
  });

  it("parses --port as integer", () => {
    const args = parseCliArgs(
      ["--file", "q.json", "--output", "r.json", "--port", "4000"],
      true,
    );
    expect(args.port).toBe(4000);
  });

  it("rejects non-numeric --port", () => {
    expect(() =>
      parseCliArgs(["--file", "q.json", "--output", "r.json", "--port", "abc"], true),
    ).toThrow(/port/i);
  });

  it("rejects --port out of range", () => {
    expect(() =>
      parseCliArgs(["--file", "q.json", "--output", "r.json", "--port", "70000"], true),
    ).toThrow(/port/i);
  });

  it("rejects non-http(s) --on-complete", () => {
    expect(() =>
      parseCliArgs(["--file", "q.json", "--on-complete", "ftp://x"], true),
    ).toThrow(/on-complete/i);
  });

  it("parses --open flag", () => {
    const args = parseCliArgs(["--file", "q.json", "--output", "r.json", "--open"], true);
    expect(args.open).toBe(true);
  });

  it("rejects unknown flags", () => {
    expect(() =>
      parseCliArgs(["--file", "q.json", "--output", "r.json", "--wat"], true),
    ).toThrow();
  });

  it("returns help:true when -h is passed (skipping other validation)", () => {
    const args = parseCliArgs(["-h"], true);
    expect(args.help).toBe(true);
  });

  it("returns version:true when -v is passed", () => {
    const args = parseCliArgs(["-v"], true);
    expect(args.version).toBe(true);
  });
});
