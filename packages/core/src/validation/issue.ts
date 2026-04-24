export type IssueCode =
  | "required"
  | "min_length"
  | "max_length"
  | "min_selections"
  | "max_selections"
  | "out_of_range"
  | "invalid_option"
  | "invalid_selection"
  | "incomplete_pairs"
  | "upload_missing"
  | "max_files"
  | "file_too_large"
  | "invalid_file_type";

export type IssueParams = Record<string, string | number>;

export type Issue = {
  code: IssueCode;
  params?: IssueParams;
};

const PREFIX = "quiz-issue:";

/**
 * Encode an Issue into a Zod-compatible message string so it round-trips through
 * z.ZodIssueCode.custom without requiring a separate validator contract.
 */
export function raiseIssue(code: IssueCode, params?: IssueParams): string {
  return PREFIX + JSON.stringify(params ? { code, params } : { code });
}

export function parseIssueFromZodMessage(message: string): Issue | null {
  if (!message.startsWith(PREFIX)) return null;
  try {
    const parsed = JSON.parse(message.slice(PREFIX.length)) as Issue;
    if (typeof parsed?.code !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
