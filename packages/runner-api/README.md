# @quiz-mcp/runner-api

HTTP server and SSR shell for the quiz runtime. Built on [Hono](https://hono.dev/). Exposes REST endpoints for answers, server-side renders the quiz page, and serves static assets from [`@quiz-mcp/runner-ui`](../runner-ui).

## Installation

This package is internal to the `quiz-mcp` monorepo and is not published. Use it as a workspace dependency:

```json
{
  "dependencies": {
    "@quiz-mcp/runner-api": "workspace:*"
  }
}
```

## Entry points

| Export | What's inside |
| --- | --- |
| `@quiz-mcp/runner-api` | `createRunnerApi`, `QuizService`, `QuizState`, `QuizNotFoundError`, `toAnswersReport`, `AnswersReport`, `CompactQuestion`, and their Zod schemas |
| `@quiz-mcp/runner-api/server` | `createRunnerServer` (SSR + static assets), `DEFAULT_THEME`, `SemanticTheme`, i18n helpers |
| `@quiz-mcp/runner-api/in-memory` | `createInMemoryQuizService` — reference in-memory `QuizService` implementation |
| `@quiz-mcp/runner-api/client` | Only the `RunnerApi` type, for typed client-side fetch |

## Quick start

```ts
import { serve } from "@hono/node-server";
import { createRunnerServer } from "@quiz-mcp/runner-api/server";
import { createInMemoryQuizService } from "@quiz-mcp/runner-api/in-memory";
import type { Quiz } from "@quiz-mcp/core";

const quiz: Quiz = /* ... */;

const app = createRunnerServer({
  service: createInMemoryQuizService([quiz]),
  config: { defaultQuizId: quiz.id },
});

serve({ fetch: app.fetch, port: 3000 });
```

For a real-world setup, see `apps/runner/src/server.ts`.

## Architecture

`runner-api` is organized into three layers that can be used independently:

### 1. REST API — `createRunnerApi(service)`

A plain Hono router with no SSR. Mount it on any existing Hono app via `app.route("/", createRunnerApi(service))`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/:quizId/quiz.json` | Full `Quiz` object |
| `POST` | `/:quizId/answer` | Save a single answer (`Answer` in body) |
| `POST` | `/:quizId/finish` | Finalize the quiz (`{ answers }` in body) |
| `GET` | `/:quizId/answer` | Current `QuizState` (answers + `finished` flag), with `Cache-Control: no-store` |

Missing quizzes raise `QuizNotFoundError`, which is converted to a `404`.

### 2. SSR server — `createRunnerServer(options)`

Returns a complete Hono app: the SSR page, static runner-ui assets, and the REST API. Options:

- `service: QuizService` — data source (required).
- `config.defaultQuizId` — when set, `GET /` redirects to `/{defaultQuizId}` (302). Existence is checked lazily.
- `theme?: SemanticTheme` — semantic theme applied to both the SSR `:root` and the `<quiz-player>` shadow root. Behavior:
  - `undefined` → uses `DEFAULT_THEME`;
  - `{}` → skip injection entirely and fall through to DaisyUI defaults;
  - partial object → overrides specific tokens (typically `{ ...DEFAULT_THEME, primary: "#ff00aa" }`).
- `i18n?: I18nDict` — localization dictionary for both SSR and the client.
- `uiAssetsDir?: string` — absolute path to the runner-ui build. When omitted, it is resolved via `require.resolve("@quiz-mcp/runner-ui/...")` (works in a pnpm workspace). Bundled publishable apps should pass a path to their shipped copy of the assets — see `apps/runner/src/ui-assets.ts`.

### 3. The `QuizService` interface

The extension point for storage. Any implementation must provide:

```ts
interface QuizService {
  registerQuiz(quiz: Quiz): Promise<void>;
  quizExists(quizId: string): Promise<boolean>;
  getQuiz(quizId: string): Promise<Quiz>;
  saveAnswer(quizId: string, answer: Answer): Promise<void>;
  finishQuiz(quizId: string, answers: Record<string, Answer>): Promise<void>;
  getState(quizId: string): Promise<QuizState>;
}
```

`createInMemoryQuizService` is the reference implementation for tests, demos, and single-process apps. For persistence, write your own implementation on top of a database.

## `toAnswersReport` — bridge to MCP

`toAnswersReport(quiz, state)` builds a compact `AnswersReport` from a `Quiz` and a `QuizState`: questions are trimmed to the minimally required fields (`CompactQuestion`) and answers are keyed by `questionId`. This is the format consumed by `@quiz-mcp/mcp` in the `get_answers` tool call — use it too if you're writing your own MCP client or export pipeline.

Both structures have matching Zod schemas: `CompactQuestionSchema`, `AnswersReportSchema`.

## Theming

`SemanticTheme` is a flat object of DaisyUI-compatible tokens (`primary`, `base100`, `radiusBox`, etc.). `createRunnerServer` converts it to CSS variables and injects them in two places:

1. `<style id="quiz-theme">` on the SSR page `:root`;
2. An adopted stylesheet in the `<quiz-player>` shadow root with `!important`, in order to override DaisyUI 5's `@layer base`.

For the details and the motivation behind `!important`, see `src/server/theme.ts` and `packages/runner-ui/src/quiz-host.tsx`.

## Scripts

```bash
pnpm build       # tsc → dist/
pnpm dev         # tsc --watch
pnpm test        # vitest run
pnpm typecheck   # tsc --noEmit
```

## Related packages

- [`@quiz-mcp/core`](../core) — domain types (`Quiz`, `Answer`, Zod schemas).
- [`@quiz-mcp/runner-ui`](../runner-ui) — the client bundle this server ships.
- [`@quiz-mcp/web-components`](../web-components) — the `<quiz-player>` web component.
- [`@quiz-mcp/ui`](../ui) — i18n dictionary and translator.
- [`apps/runner`](../../apps/runner) — standalone app that wires everything together.
