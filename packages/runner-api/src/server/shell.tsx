import type { Quiz } from "@quiz-mcp/core";
import { raw } from "hono/html";
import type { Translate } from "@quiz-mcp/ui/i18n";
import type { Assets } from "./assets.js";

export type ShellProps = {
  quiz: Quiz;
  quizId: string;
  assets: Assets;
  themeCss: string;
  themeVarsJson: string;
  i18nJson: string;
  t: Translate;
};

const jsonSafe = (s: string): string => s.replace(/</g, "\\u003c");

export const Shell = ({ quiz, quizId, assets, themeCss, themeVarsJson, i18nJson, t }: ShellProps) => {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`Quiz runner — ${quiz.title}`}</title>
        <link rel="stylesheet" href={assets.css} />
        {themeCss && <style id="quiz-theme">{raw(themeCss)}</style>}
      </head>
      <body class="min-h-screen bg-base-100 text-base-content antialiased">
        <main class="mx-auto w-full max-w-2xl px-6 py-16 md:py-20 space-y-12">
          <header>
            <div class="flex items-center gap-3">
              <span class="inline-block h-1.5 w-10 bg-primary" />
              <span class="text-xs uppercase tracking-widest font-semibold text-primary">
                {t("shell.live_badge")}
              </span>
            </div>
            <h1 class="mt-4 text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p class="mt-4 text-base-content/60">{quiz.description}</p>
            )}
          </header>

          <section id="quiz-host" data-quiz-id={quizId} class="flex flex-col gap-6" />

          <script type="application/json" id="quiz-data">
            {raw(jsonSafe(JSON.stringify(quiz)))}
          </script>
          <script type="application/json" id="quiz-i18n">
            {raw(jsonSafe(i18nJson))}
          </script>
          <script type="application/json" id="quiz-theme-vars">
            {raw(jsonSafe(themeVarsJson))}
          </script>
          <script type="module" src={assets.js} />
        </main>
      </body>
    </html>
  );
};
