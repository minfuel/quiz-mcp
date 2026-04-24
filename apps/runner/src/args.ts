import { parseArgs } from "node:util";

export type QuizSource =
  | { kind: "url"; url: string }
  | { kind: "file"; path: string }
  | { kind: "json"; raw: string }
  | { kind: "stdin" };

export type Args = {
  source: QuizSource;
  onComplete?: string;
  output?: string;
  port?: number;
  open: boolean;
  help: boolean;
  version: boolean;
};

export class ArgsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArgsError";
  }
}

const OPTIONS = {
  url: { type: "string" as const },
  file: { type: "string" as const },
  json: { type: "string" as const },
  "on-complete": { type: "string" as const },
  output: { type: "string" as const },
  port: { type: "string" as const },
  open: { type: "boolean" as const },
  help: { type: "boolean" as const, short: "h" },
  version: { type: "boolean" as const, short: "v" },
};

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseCliArgs(argv: string[], isStdinTty: boolean): Args {
  let values: Record<string, string | boolean | undefined>;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: OPTIONS,
      strict: true,
      allowPositionals: false,
    }));
  } catch (err) {
    throw new ArgsError((err as Error).message);
  }

  if (values.help) {
    return {
      source: { kind: "stdin" },
      open: false,
      help: true,
      version: false,
    };
  }
  if (values.version) {
    return {
      source: { kind: "stdin" },
      open: false,
      help: false,
      version: true,
    };
  }

  const sources: QuizSource[] = [];
  if (typeof values.url === "string") sources.push({ kind: "url", url: values.url });
  if (typeof values.file === "string") sources.push({ kind: "file", path: values.file });
  if (typeof values.json === "string") sources.push({ kind: "json", raw: values.json });
  if (!isStdinTty) sources.push({ kind: "stdin" });

  if (sources.length !== 1) {
    throw new ArgsError(
      "exactly one source required (--url, --file, --json, or piped stdin)",
    );
  }
  const source = sources[0]!;

  const onComplete = typeof values["on-complete"] === "string" ? values["on-complete"] : undefined;
  const output = typeof values.output === "string" ? values.output : undefined;

  if (!onComplete && !output) {
    throw new ArgsError("at least one sink required (--on-complete and/or --output)");
  }

  if (onComplete && !isHttpUrl(onComplete)) {
    throw new ArgsError("--on-complete must be an http:// or https:// URL");
  }

  let port: number | undefined;
  if (typeof values.port === "string") {
    const n = Number(values.port);
    if (!Number.isInteger(n) || n < 1 || n > 65535) {
      throw new ArgsError("--port must be an integer in [1, 65535]");
    }
    port = n;
  }

  if (source.kind === "url" && !isHttpUrl(source.url)) {
    throw new ArgsError("--url must be an http:// or https:// URL");
  }

  if (source.kind === "json" && source.raw.trim() === "") {
    throw new ArgsError("--json value cannot be empty");
  }

  return {
    source,
    onComplete,
    output,
    port,
    open: values.open === true,
    help: false,
    version: false,
  };
}

export function renderHelp(): string {
  return [
    "quiz-mcp-runner — run a quiz UI locally and collect answers",
    "",
    "Usage:",
    "  npx @quiz-mcp/runner --url <url>    --on-complete <webhook>",
    "  npx @quiz-mcp/runner --file <path>  --output <path.json>",
    "  cat quiz.json | npx @quiz-mcp/runner --output result.json",
    "",
    "Source (exactly one required):",
    "  --url <url>          Fetch quiz JSON from URL",
    "  --file <path>        Read quiz JSON from file",
    "  --json <string>      Inline quiz JSON",
    "  (stdin)              Piped JSON when stdin is not a TTY",
    "",
    "Sinks (at least one required):",
    "  --on-complete <url>  POST answers report to URL",
    "  --output <path>      Write answers report to JSON file",
    "",
    "Options:",
    "  --port <number>      Override port (default: ephemeral)",
    "  --open               Open the quiz URL in the default browser",
    "  -h, --help           Show help",
    "  -v, --version        Show version",
    ].join("\n");
}
