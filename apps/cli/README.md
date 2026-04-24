# @quiz-mcp/cli

Command-line entry point for **quiz-mcp** — an MCP server that lets a model hand off
interactive quizzes to a human through a local browser UI.

The CLI ships a single binary, `quiz-mcp`, which an MCP client (Claude Desktop,
Cursor, Claude Code, etc.) launches over stdio.

## Install

```bash
npm install -g @quiz-mcp/cli
# or run on demand without installing
npx @quiz-mcp/cli
```

## Commands

### `quiz-mcp mcp` (default)

Starts the MCP server on stdio. Invoked with no arguments, `quiz-mcp` is
equivalent to `quiz-mcp mcp`.

The HTTP **runner-api** (the browser UI backend) is **not** started immediately.
It lazy-starts on a random localhost port the first time the model calls
`start_quiz`, and shuts down automatically once every registered quiz has been
finished *and* its result read back via `get_answers`.

Registered MCP tools:

| Tool             | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `start_quiz`     | Register a quiz; returns the runner URL to open in browser. |
| `get_answers`    | Poll for the user's answers once the quiz is submitted.     |
| `get_quiz_format`| Returns the expected quiz JSON schema.                      |
| `stop_runner`    | Force-shutdown the HTTP runner before auto-stop kicks in.   |

### `quiz-mcp create <title> [output]`

Scaffolding helper. Writes a minimal valid quiz document (fresh `id`, empty
`questions` array, `$schema` pointing at the canonical JSON Schema) to a file.
Useful as a starting point when authoring quizzes by hand.

If `[output]` is omitted, the file is written as `<slug>.quiz.json` in the
current directory, where `<slug>` is a lowercased, hyphenated form of the title.
Refuses to overwrite an existing file unless `--force` is passed.

```bash
# writes ./sample-quiz.quiz.json
npx @quiz-mcp/cli create "Sample quiz"

# explicit path
npx @quiz-mcp/cli create "Sample quiz" ./quizzes/sample.json

# overwrite if the file already exists
npx @quiz-mcp/cli create "Sample quiz" ./quizzes/sample.json --force
```

The generated file starts with a `$schema` entry so editors (VS Code, JetBrains)
can offer autocomplete and validation out of the box:

```json
{
  "$schema": "https://raw.githubusercontent.com/karerckor/quiz-mcp/main/schema/quiz.schema.json",
  "id": "...",
  "title": "Sample quiz",
  "questions": []
}
```

## Usage with MCP clients

<!-- TODO(author): add concrete config snippets for the clients you want to support.
     Suggested: Claude Desktop (claude_desktop_config.json), Cursor (~/.cursor/mcp.json),
     Claude Code (.mcp.json). Each one takes a command + args pair pointing at `quiz-mcp`. -->

## Lifecycle behaviour

- **Lazy start.** No HTTP port is opened until a quiz is registered. This keeps
  the server silent when an MCP client connects just to list tools.
- **Auto-stop.** The runner shuts down once every active quiz has been finished
  by the user *and* read by the model. This releases the port without requiring
  an explicit `stop_runner` call.
- **Explicit stop.** Call the `stop_runner` tool to terminate the runner early
  (e.g. to abandon an in-flight quiz). It is a no-op when the runner is already
  stopped.
- **Signal handling.** `SIGINT`, `SIGTERM`, and stdin close all trigger a clean
  shutdown of the runner before the process exits.

## Development

This package lives in the [`quiz-mcp`](../../) monorepo (pnpm + Turborepo).

```bash
# from the repo root
pnpm install
pnpm --filter @quiz-mcp/cli build      # produces dist/
pnpm --filter @quiz-mcp/cli test       # vitest
pnpm --filter @quiz-mcp/cli typecheck
```

The build bundles the runner UI assets into `dist/ui/` so the published package
can serve the browser UI without any extra install step. At runtime
`resolveBundledUiDir()` looks for `dist/ui/.vite/manifest.json` — if it is
missing (e.g. in local dev), the runner falls back to its default asset
resolution.

## Package layout

```
src/
  index.ts             Commander entry point (bin: quiz-mcp)
  mcp-command.ts       Wires runner-api, HostedService, RunnerHost, MCP server
  hosted-service.ts    QuizService wrapper that drives lazy-start + auto-stop
  runner-host.ts       Owns the Hono/node-server lifecycle
  stop-runner-tool.ts  Registers the `stop_runner` MCP tool
  ui-assets.ts         Locates the bundled UI directory in dist/
```

## License

See the repository root.
