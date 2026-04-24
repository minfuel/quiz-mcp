import { describe, expect, it } from "vitest";
import type { Issue, IssueCode } from "@quiz-mcp/core/validation";
import { makeTranslator } from "@quiz-mcp/ui/i18n";
import { formatIssue, ISSUE_TO_KEY } from "./format-issue";

const t = makeTranslator({});

describe("formatIssue", () => {
  it("maps every IssueCode to a localized string", () => {
    const codes: IssueCode[] = Object.keys(ISSUE_TO_KEY) as IssueCode[];
    for (const code of codes) {
      const out = formatIssue({ code } as Issue, t);
      expect(out).not.toBe("");
      expect(out).not.toContain("{");
    }
  });

  it("interpolates params into the localized template", () => {
    const out = formatIssue({ code: "max_files", params: { max: 3 } }, t);
    expect(out).toContain("3");
  });

  it("falls back to code string when mapping is missing", () => {
    const out = formatIssue({ code: "___bogus___" as IssueCode }, t);
    expect(out).toBe("___bogus___");
  });
});
