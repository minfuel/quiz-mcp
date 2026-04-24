# @quiz-mcp/runner-ui

The client bundle for the quiz page. It hydrates the SSR shell served by [`@quiz-mcp/runner-api`](../runner-api) and wires up the `<quiz-player>` web component from [`@quiz-mcp/web-components`](../web-components).

This package **does not export runtime code** — it is consumed as a bundle of static assets plus a Vite manifest. In the vast majority of cases you don't import from this package directly: adding `runner-api` to your workspace is enough and everything else happens automatically.

## Entry points

| Export | Purpose |
| --- | --- |
| `@quiz-mcp/runner-ui/manifest` | Path to `dist/.vite/manifest.json`, which `runner-api` reads to resolve hashed JS/CSS bundle names |
| `@quiz-mcp/runner-ui/package.json` | Used by `require.resolve` to locate `dist/` inside the monorepo |

No other paths are publicly exported.

## What's inside

- **`src/main.tsx`** — the single Vite entry point. Mounts `<QuizHost>` into `#quiz-host`, reading the `quiz` payload from an inline `<script id="quiz-data">`.
- **`src/quiz-host.tsx`** — a `hono/jsx/dom` component. Subscribes to `<quiz-player>` events (`quiz-answer`, `quiz-validation-error`, `quiz-finish`), forwards them to the `runner-api` REST endpoints, and renders both the completion screen and the validation error panel with localized messages.
- **`src/format-issue.ts`** — translates an `Issue` (`@quiz-mcp/core/validation`) into a human-readable string via the i18n dictionary.
- **`src/styles.css`** — Tailwind 4 + DaisyUI 5.

The theme and the i18n dictionary are not delivered via import but through three inline `<script type="application/json">` blocks in the SSR shell (`quiz-data`, `quiz-i18n`, `quiz-theme-vars`). `quiz-host.tsx` parses them and applies the theme to the `<quiz-player>` shadow root via an adopted stylesheet.

## Scripts

```bash
pnpm build       # vite build → dist/ + dist/.vite/manifest.json
pnpm dev         # vite build --watch (not a dev server; runner-api serves the assets)
pnpm test        # vitest run
pnpm typecheck   # tsc --noEmit
pnpm clean       # rm -rf dist *.tsbuildinfo
```

Vite is configured with `manifest: true` and a single entry point, `src/main.tsx` — no HTML plugin, because the HTML shell is rendered by SSR in `runner-api`.

## How it fits together

```
browser request
      │
      ▼
┌─────────────────────────────┐
│  runner-api /:quizId         │  SSR HTML + inline JSON payloads
│  (reads runner-ui/manifest   │
│   and /assets/*)             │
└──────────────┬───────────────┘
               │ <script src="/assets/main-[hash].js">
               ▼
      runner-ui bundle hydrates #quiz-host
               │
               ▼
      <quiz-player> (web-components)
               │ custom events
               ▼
      POST /:quizId/answer  /  /:quizId/finish
```

`runner-api` reads the manifest via `@quiz-mcp/runner-ui/manifest`, resolves the bundle and CSS URLs, and serves them statically under `/assets/*` with `Cache-Control: immutable`. See `packages/runner-api/src/server/assets.ts` for details.

## Custom deployments

If you bundle runner-ui into a publishable app (for example via `tsup`, as `apps/runner` does), copy the contents of `dist/` into a known location and pass the absolute path to `createRunnerServer({ uiAssetsDir })`. See `apps/runner/tsup.config.ts` and `apps/runner/src/ui-assets.ts`.

## Related packages

- [`@quiz-mcp/runner-api`](../runner-api) — the server that ships this bundle.
- [`@quiz-mcp/web-components`](../web-components) — `<quiz-player>`.
- [`@quiz-mcp/core`](../core) — types and validation schemas.
- [`@quiz-mcp/ui`](../ui) — i18n dictionary and translator.
