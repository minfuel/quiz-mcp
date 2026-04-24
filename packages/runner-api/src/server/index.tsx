import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { createRunnerApi } from "../index.js";
import { QuizNotFoundError } from "../service.js";
import type { QuizService } from "../service.js";
import { makeTranslator, type I18nDict } from "@quiz-mcp/ui/i18n";
import { createAssetsResolver } from "./assets.js";
import { Shell } from "./shell.js";
import {
  DEFAULT_THEME,
  renderThemeStyleCss,
  themeToCssVars,
  type SemanticTheme,
} from "./theme.js";

export type { SemanticTheme } from "./theme.js";
export { DEFAULT_THEME } from "./theme.js";
export { DEFAULT_I18N, makeTranslator } from "@quiz-mcp/ui/i18n";
export type { I18nDict, I18nKey, Translate } from "@quiz-mcp/ui/i18n";

export type RunnerServerOptions = {
  service: QuizService;
  config?: {
    /**
     * When set, GET / redirects to `/${defaultQuizId}`. No existence check is
     * performed at construction time; a missing quiz yields a 404 on the redirect.
     */
    defaultQuizId?: string;
  };
  /**
   * Semantic theme applied to both SSR `:root` and the `<quiz-player>` shadow.
   * - Omit (or `undefined`) to use the baked-in {@link DEFAULT_THEME}.
   * - Pass `{}` to skip injection entirely and fall through to DaisyUI defaults.
   * - Pass a partial object (spread from `DEFAULT_THEME` if you want a tweak) to override specific tokens.
   */
  theme?: SemanticTheme;
  i18n?: I18nDict;
  /**
   * Optional absolute path to the runner-ui Vite build output (the directory
   * that contains `.vite/manifest.json` and `assets/`). When omitted, the
   * server resolves it at runtime via `require.resolve("@quiz-mcp/runner-ui/...")`,
   * which works when this module is consumed from a pnpm workspace. Bundled
   * publishable apps should pass the path to their shipped copy of the UI
   * assets.
   */
  uiAssetsDir?: string;
};

export function createRunnerServer(options: RunnerServerOptions): Hono {
  const { service, config, theme, i18n, uiAssetsDir } = options;
  const effectiveTheme = theme ?? DEFAULT_THEME;
  const themeVars = themeToCssVars(effectiveTheme);
  const themeCss = renderThemeStyleCss(themeVars);
  const themeVarsJson = JSON.stringify(themeVars);
  const i18nJson = JSON.stringify(i18n ?? {});
  const t = makeTranslator(i18n ?? {});

  const assets = createAssetsResolver(uiAssetsDir);

  // Fail-fast: surface a "manifest missing" error at factory construction time
  // rather than on the first real request. In prod the result is cached; in dev
  // the handler below re-reads the manifest anyway to pick up fresh asset hashes.
  assets.getAssets();

  const app = new Hono();

  app.use(
    "/assets/*",
    serveStatic({
      root: assets.getRunnerUiDistDir(),
      onFound: (_p, c) => {
        c.header("Cache-Control", "public, max-age=31536000, immutable");
      },
    }),
  );

  if (config?.defaultQuizId) {
    const fallback = config.defaultQuizId;
    app.get("/", (c) => c.redirect(`/${fallback}`, 302));
  }

  app.get("/:quizId", async (c) => {
    const quizId = c.req.param("quizId");
    if (!(await service.quizExists(quizId))) return c.notFound();
    // Defensive: quizExists passed, but getQuiz may still throw if the quiz was
    // concurrently deleted between the two calls.
    try {
      const quiz = await service.getQuiz(quizId);
      return c.html(
        <Shell
          quiz={quiz}
          quizId={quizId}
          assets={assets.getAssets()}
          themeCss={themeCss}
          themeVarsJson={themeVarsJson}
          i18nJson={i18nJson}
          t={t}
        />,
      );
    } catch (e) {
      if (e instanceof QuizNotFoundError) return c.notFound();
      throw e;
    }
  });

  app.route("/", createRunnerApi(service));

  return app;
}
