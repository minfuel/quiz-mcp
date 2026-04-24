import type { Issue, IssueCode } from "@quiz-mcp/core/validation";
import type { I18nKey, Translate } from "@quiz-mcp/ui/i18n";

export const ISSUE_TO_KEY: Record<IssueCode, I18nKey> = {
  required: "validation.issue.required",
  min_length: "validation.issue.min_length",
  max_length: "validation.issue.max_length",
  min_selections: "validation.issue.min_selections",
  max_selections: "validation.issue.max_selections",
  out_of_range: "validation.issue.out_of_range",
  invalid_option: "validation.issue.invalid_option",
  invalid_selection: "validation.issue.invalid_selection",
  incomplete_pairs: "validation.issue.incomplete_pairs",
  upload_missing: "validation.issue.upload_missing",
  max_files: "validation.issue.max_files",
  file_too_large: "validation.issue.file_too_large",
  invalid_file_type: "validation.issue.invalid_file_type",
};

export function formatIssue(issue: Issue, t: Translate): string {
  const key = ISSUE_TO_KEY[issue.code];
  if (!key) return issue.code;
  const params = (issue.params ?? {}) as Record<string, string | number>;
  return t(key, params);
}
