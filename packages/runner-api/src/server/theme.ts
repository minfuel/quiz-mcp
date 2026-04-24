export type SemanticTheme = {
  primary?: string; primaryContent?: string;
  secondary?: string; secondaryContent?: string;
  accent?: string; accentContent?: string;
  neutral?: string; neutralContent?: string;
  base100?: string; base200?: string; base300?: string; baseContent?: string;
  info?: string; infoContent?: string;
  success?: string; successContent?: string;
  warning?: string; warningContent?: string;
  error?: string; errorContent?: string;
  radiusSelector?: string; radiusField?: string; radiusBox?: string;
  sizeSelector?: string; sizeField?: string;
  border?: string;
  depth?: string; noise?: string;
};

const TOKEN_MAP: Record<keyof SemanticTheme, string> = {
  primary: "--color-primary",
  primaryContent: "--color-primary-content",
  secondary: "--color-secondary",
  secondaryContent: "--color-secondary-content",
  accent: "--color-accent",
  accentContent: "--color-accent-content",
  neutral: "--color-neutral",
  neutralContent: "--color-neutral-content",
  base100: "--color-base-100",
  base200: "--color-base-200",
  base300: "--color-base-300",
  baseContent: "--color-base-content",
  info: "--color-info",
  infoContent: "--color-info-content",
  success: "--color-success",
  successContent: "--color-success-content",
  warning: "--color-warning",
  warningContent: "--color-warning-content",
  error: "--color-error",
  errorContent: "--color-error-content",
  radiusSelector: "--radius-selector",
  radiusField: "--radius-field",
  radiusBox: "--radius-box",
  sizeSelector: "--size-selector",
  sizeField: "--size-field",
  border: "--border",
  depth: "--depth",
  noise: "--noise",
};

/**
 * Baked-in default palette applied when the caller does not pass `theme` to
 * `createRunnerServer`. A warm amber-on-cream light palette.
 * Callers can cherry-pick overrides by spreading: `theme: { ...DEFAULT_THEME, primary: "#ff00aa" }`.
 * Pass `theme: {}` to opt out entirely and fall through to DaisyUI defaults.
 */
export const DEFAULT_THEME: SemanticTheme = {
  primary: "#6366f1",
  primaryContent: "#ffffff",
  secondary: "#64748b",
  secondaryContent: "#ffffff",
  accent: "#22d3ee",
  accentContent: "#0f172a",
  neutral: "#1f2937",
  neutralContent: "#f3f4f6",
  base100: "#0b0b10",
  base200: "#17171d",
  base300: "#22222a",
  baseContent: "#e5e7eb",
  info: "#0ea5e9",
  infoContent: "#ffffff",
  success: "#10b981",
  successContent: "#ffffff",
  warning: "#f59e0b",
  warningContent: "#1f1f1f",
  error: "#ef4444",
  errorContent: "#ffffff",
};

export function themeToCssVars(theme: SemanticTheme | undefined): Record<string, string> {
  if (!theme) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (value == null) continue;
    const cssVar = TOKEN_MAP[key as keyof SemanticTheme];
    if (cssVar) out[cssVar] = value;
  }
  return out;
}

export function renderThemeStyleCss(vars: Record<string, string>): string {
  const entries = Object.entries(vars);
  if (entries.length === 0) return "";
  return `:root{${entries.map(([k, v]) => `${k}:${v};`).join("")}}`;
}
