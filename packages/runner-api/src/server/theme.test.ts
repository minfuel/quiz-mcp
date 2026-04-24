import { describe, expect, it } from "vitest";
import { themeToCssVars, renderThemeStyleCss } from "./theme.js";

describe("themeToCssVars", () => {
  it("returns empty object when theme is undefined", () => {
    expect(themeToCssVars(undefined)).toEqual({});
  });

  it("returns empty object when theme is empty", () => {
    expect(themeToCssVars({})).toEqual({});
  });

  it("maps known semantic tokens to DaisyUI CSS variables", () => {
    expect(themeToCssVars({ primary: "#0af", baseContent: "#222" })).toEqual({
      "--color-primary": "#0af",
      "--color-base-content": "#222",
    });
  });

  it("skips null/undefined values but keeps empty strings", () => {
    expect(themeToCssVars({ primary: undefined, baseContent: "" })).toEqual({
      "--color-base-content": "",
    });
  });

  it("covers every field of SemanticTheme", () => {
    const allFields: Required<import("./theme.js").SemanticTheme> = {
      primary: "a", primaryContent: "b",
      secondary: "c", secondaryContent: "d",
      accent: "e", accentContent: "f",
      neutral: "g", neutralContent: "h",
      base100: "i", base200: "j", base300: "k", baseContent: "l",
      info: "m", infoContent: "n",
      success: "o", successContent: "p",
      warning: "q", warningContent: "r",
      error: "s", errorContent: "t",
      radiusSelector: "u", radiusField: "v", radiusBox: "w",
      sizeSelector: "x", sizeField: "y",
      border: "z", depth: "A", noise: "B",
    };
    const mapped = themeToCssVars(allFields);
    expect(Object.keys(mapped).length).toBe(Object.keys(allFields).length);
    for (const v of Object.values(mapped)) expect(v).toMatch(/^[a-zA-Z]$/);
  });
});

describe("renderThemeStyleCss", () => {
  it("returns empty string for empty vars", () => {
    expect(renderThemeStyleCss({})).toBe("");
  });

  it("renders :root block with semicolon-separated declarations", () => {
    expect(renderThemeStyleCss({ "--color-primary": "#0af" })).toBe(":root{--color-primary:#0af;}");
  });
});
