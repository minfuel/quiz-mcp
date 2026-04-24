export const DEFAULT_I18N = {
  // Shell (SSR)
  "shell.live_badge": "Quiz · Live",

  // Buttons
  "button.back": "Back",
  "button.next": "Next",
  "button.complete": "Complete",
  "button.add_tag": "Add",
  "button.remove_tag_aria": "Remove tag",
  "button.open_file": "Open",
  "button.remove_file": "Remove",
  "button.move_up_aria": "Move up",
  "button.move_down_aria": "Move down",

  // Completion screen
  "complete.title": "Quiz submitted",
  "complete.text": "Your answers have been recorded. Thanks for taking “{title}”.",

  // Validation alert
  "validation.title": "Please review your answers",
  "validation.text_one": "{count} question needs attention before you can finish.",
  "validation.text_other": "{count} questions need attention before you can finish.",

  // Core validation issue codes (mirror packages/core/src/validation/issue.ts::IssueCode)
  "validation.issue.required": "This question is required.",
  "validation.issue.min_length": "Please enter at least {min} characters.",
  "validation.issue.max_length": "Please enter at most {max} characters.",
  "validation.issue.min_selections": "Select at least {min} options.",
  "validation.issue.max_selections": "Select at most {max} options.",
  "validation.issue.out_of_range": "Value is out of the allowed range.",
  "validation.issue.invalid_option": "Please choose a valid option.",
  "validation.issue.invalid_selection": "Please review your selection.",
  "validation.issue.incomplete_pairs": "All pairs must be matched.",
  "validation.issue.upload_missing": "Please upload at least one file.",
  "validation.issue.max_files": "At most {max} files allowed.",
  "validation.issue.file_too_large": "File is too large (max {max} bytes).",
  "validation.issue.invalid_file_type": "File type is not allowed.",

  // Client-side UI error (not a core Issue code) — used by Upload.svelte pre-upload size guard
  "validation.issue.file_too_large_named": "File “{name}” exceeds {size}.",

  // Question-level UI
  "question.required_mark": "*",
  "question.shorttext.character_count": "{current}/{max}",
  "question.longtext.character_count": "{current}/{max}",
  "question.longtext.character_count_no_max": "{current}",
  "question.longtext.min_hint": "Minimum {min} characters.",
  "question.longtext.min_label": "Min {min}",
  "question.dropdown.placeholder": "Select…",
  "question.dropdown.multiselect_hint": "Ctrl/Cmd + click to select multiple.",
  "question.dropdown.custom_tag_placeholder": "Add custom tag…",
  "question.multiplechoice.range_hint": "Pick {min}–{max}.",
  "question.multiplechoice.min_hint": "Pick at least {min}.",
  "question.multiplechoice.max_hint": "Pick at most {max}.",
  "question.upload.accepts_label": "Accepts: {kinds}",
  "question.upload.max_files_label": "Max files: {max}",
  "question.upload.max_size_label": "Max size: {size}",
  "question.upload.uploading": "Uploading…",
  "question.upload.upload_failed": "Upload failed",
  "question.fillgaps.gap_placeholder": "…",
  "question.match.unset_label": "— not set —",
} as const;

export type I18nKey = keyof typeof DEFAULT_I18N;
export type I18nDict = Partial<Record<I18nKey, string>>;
export type TranslateParams = Record<string, string | number> & { count?: number };
export type Translate = (key: I18nKey, params?: TranslateParams) => string;

export function makeTranslator(dict: I18nDict): Translate {
  const resolve = (key: string): string =>
    (dict as Record<string, string>)[key] ??
    (DEFAULT_I18N as Record<string, string>)[key] ??
    key;

  return (key, params) => {
    let effectiveKey: string = key;
    if (params && typeof params.count === "number" && !Number.isNaN(params.count)) {
      const suffix = params.count === 1 ? "_one" : "_other";
      const pluralKey = `${key}${suffix}`;
      if (pluralKey in DEFAULT_I18N) effectiveKey = pluralKey;
    }
    const template = resolve(effectiveKey);
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, name) =>
      params[name] != null ? String(params[name]) : "",
    );
  };
}
