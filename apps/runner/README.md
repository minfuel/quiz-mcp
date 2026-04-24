# @quiz-mcp/runner

<!-- TODO(you): 3–6 lines about what this package is and why it exists.
     Context: this is a CLI wrapper, typically spawned by the MCP server
     (`packages/mcp`) to show a quiz to the user in the browser and
     collect their answers. Describe in your own words where runner
     fits in quiz-mcp and which problem it solves. -->

## Installation

The package is published to npm and is designed for one-off runs via `npx`:

```bash
npx @quiz-mcp/runner --file ./quiz.json --output ./answers.json
```

Or as a dependency inside the monorepo:

```bash
pnpm add @quiz-mcp/runner
```

Requires Node.js ≥ 20.

## What the CLI does

1. Loads a quiz definition from a single source (URL, file, inline JSON, or stdin).
2. Validates it against `QuizSchema` from `@quiz-mcp/core`.
3. Starts a local Hono server with the bundled UI and prints a URL like `http://localhost:<port>`.
4. Waits while the user completes the quiz in the browser.
5. On completion, delivers the report to one or both sinks: an HTTP webhook (`POST`) and/or a JSON file.
6. Exits with a meaningful status code (see below).

## Usage

```
quiz-mcp-runner [source] [sink …] [options]
```

### Quiz source (exactly one required)

| Flag             | Description                                   |
| ---------------- | --------------------------------------------- |
| `--url <url>`    | Fetch JSON over HTTP/HTTPS                    |
| `--file <path>`  | Read JSON from a file                         |
| `--json <str>`   | Pass JSON as a string                         |
| *(stdin)*        | If stdin is not a TTY, reads JSON from pipe   |

### Report sink (at least one required)

| Flag                  | Description                                   |
| --------------------- | --------------------------------------------- |
| `--on-complete <url>` | `POST` the report to the given HTTP/HTTPS URL |
| `--output <path>`     | Write the report to a JSON file               |

### Other options

| Flag              | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `--port <n>`      | Fixed port (defaults to an ephemeral port)                |
| `--open`          | Open the URL in the system browser                        |
| `-h, --help`      | Show help                                                 |
| `-v, --version`   | Show version                                              |

## Examples

File → webhook, open the browser automatically:

```bash
npx @quiz-mcp/runner \
  --file ./quiz.json \
  --on-complete https://example.com/quiz-hooks/123 \
  --open
```

URL → local file:

```bash
npx @quiz-mcp/runner \
  --url https://example.com/quiz.json \
  --output ./answers.json
```

Pipe from stdin, two sinks at once:

```bash
cat quiz.json | npx @quiz-mcp/runner \
  --on-complete https://example.com/hook \
  --output ./answers.json
```

## Report format

The report is built via `toAnswersReport` from `@quiz-mcp/runner-api` and is identical across both sinks. For the exact shape, see the `AnswersReport` type in `@quiz-mcp/runner-api`.

## Exit codes

| Code  | Meaning                                                         |
| ----- | --------------------------------------------------------------- |
| `0`   | Quiz completed, all sinks succeeded                             |
| `1`   | CLI argument error, quiz load failure, or validation error      |
| `2`   | Quiz completed, but at least one sink failed (webhook 5xx, I/O, etc.) |
| `130` | Interrupted via `SIGINT` (Ctrl+C)                               |

After the quiz finishes, the runner gives itself ~1.5 s to flush logs before shutting down; if it doesn't finish in time, it force-exits after 3 s.

## Development

Inside the `quiz-mcp` monorepo the package is built with `tsup`, and the UI (`@quiz-mcp/runner-ui`) is copied into `dist/ui` as a post-build step.

```bash
# dev mode: parallel watch of the UI + server with MOCK_QUIZ
pnpm --filter @quiz-mcp/runner dev

# production build (requires runner-ui to be built first)
pnpm --filter @quiz-mcp/runner-ui build
pnpm --filter @quiz-mcp/runner build

# tests
pnpm --filter @quiz-mcp/runner test
```

The dev server (`src/index.ts`) listens on `PORT` from the environment (defaults to `3000`) and serves a built-in `MOCK_QUIZ` — this is a separate mode for UI debugging and is **not** part of the CLI flow.

## Architecture

```
cli.ts ──► run.ts ──► parseCliArgs ─┐
                     loadQuiz ──────┤
                     createRunnerServer (Hono) ──► UI (dist/ui/*)
                                                   └─► API from @quiz-mcp/runner-api
                     withFinishHook ──► sinks/webhook.ts
                                        sinks/file.ts
```

- `src/args.ts` — flag parsing and validation; `ArgsError` for user-facing errors.
- `src/load-quiz.ts` — single entry point for fetching JSON + Zod validation.
- `src/observable-service.ts` — wraps `QuizService` and emits `onFinish` when a run completes.
- `src/sinks/*` — independent sinks, dispatched in parallel via `Promise.all`.
- `src/ui-assets.ts` — resolves the path to the bundled UI in `dist/ui`.
