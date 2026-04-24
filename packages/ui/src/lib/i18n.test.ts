import { describe, expect, it } from "vitest";
import { DEFAULT_I18N, makeTranslator } from "./i18n.js";

describe("makeTranslator", () => {
  it("returns DEFAULT_I18N value when dict has no override", () => {
    const t = makeTranslator({});
    expect(t("button.back")).toBe(DEFAULT_I18N["button.back"]);
  });

  it("prefers caller override over DEFAULT_I18N", () => {
    const t = makeTranslator({ "button.back": "Назад" });
    expect(t("button.back")).toBe("Назад");
  });

  it("falls back to key literal when key is missing everywhere", () => {
    const t = makeTranslator({});
    // @ts-expect-error — simulate unknown key at runtime
    expect(t("unknown.key")).toBe("unknown.key");
  });

  it("interpolates {placeholder} tokens", () => {
    const t = makeTranslator({ "complete.text": "Hi {name}, thanks for {title}." });
    expect(t("complete.text", { name: "Ann", title: "quiz" })).toBe("Hi Ann, thanks for quiz.");
  });

  it("replaces missing placeholder with empty string", () => {
    const t = makeTranslator({ "complete.text": "Hi {name}" });
    expect(t("complete.text", {})).toBe("Hi ");
  });

  it("picks _one suffix when params.count === 1", () => {
    const t = makeTranslator({});
    // @ts-expect-error — "validation.text" is a plural base, not in I18nKey; test exercises runtime auto-plural behavior.
    expect(t("validation.text", { count: 1 })).toBe(DEFAULT_I18N["validation.text_one"].replace("{count}", "1"));
  });

  it("picks _other suffix when params.count !== 1", () => {
    const t = makeTranslator({});
    // @ts-expect-error — "validation.text" is a plural base, not in I18nKey; test exercises runtime auto-plural behavior.
    expect(t("validation.text", { count: 5 })).toBe(DEFAULT_I18N["validation.text_other"].replace("{count}", "5"));
  });

  it("uses key as-is when no _one/_other suffix exists", () => {
    const t = makeTranslator({});
    expect(t("button.back", { count: 3 })).toBe(DEFAULT_I18N["button.back"]);
  });

  it("ignores NaN count — no plural resolution, no interpolation of 'NaN'", () => {
    const t = makeTranslator({});
    // With NaN, the plural lookup is skipped, and the raw key is returned unchanged.
    // @ts-expect-error — "validation.text" is a plural base, not in I18nKey; test exercises runtime auto-plural behavior.
    expect(t("validation.text", { count: NaN })).toBe("validation.text");
  });
});
