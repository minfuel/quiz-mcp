import { describe, expect, it } from "vitest";
import { raiseIssue, parseIssueFromZodMessage } from "./issue.js";

describe("raiseIssue", () => {
  it("serializes code + params into a Zod-safe custom message", () => {
    const msg = raiseIssue("required");
    const parsed = parseIssueFromZodMessage(msg);
    expect(parsed).toEqual({ code: "required" });
  });

  it("round-trips params", () => {
    const msg = raiseIssue("max_files", { max: 5 });
    const parsed = parseIssueFromZodMessage(msg);
    expect(parsed).toEqual({ code: "max_files", params: { max: 5 } });
  });

  it("parseIssueFromZodMessage returns null for unstructured text", () => {
    expect(parseIssueFromZodMessage("Поле обязательно")).toBeNull();
    expect(parseIssueFromZodMessage("random")).toBeNull();
  });
});
