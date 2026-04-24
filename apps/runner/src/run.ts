import type { AddressInfo } from "node:net";
import type { Readable } from "node:stream";
import { serve } from "@hono/node-server";
import { createInMemoryQuizService } from "@quiz-mcp/runner-api/in-memory";
import { createRunnerServer } from "@quiz-mcp/runner-api/server";
import {
  toAnswersReport,
  type AnswersReport,
} from "@quiz-mcp/runner-api";
import { ArgsError, parseCliArgs, renderHelp } from "./args.js";
import { loadQuiz } from "./load-quiz.js";
import { withFinishHook } from "./observable-service.js";
import { openBrowser } from "./open-browser.js";
import { writeReportFile } from "./sinks/file.js";
import { sendWebhook } from "./sinks/webhook.js";
import { resolveBundledUiDir } from "./ui-assets.js";

export type RunOptions = {
  argv: string[];
  stdin: Readable;
  isStdinTty: boolean;
  onReady?: (ctx: { url: string; port: number }) => void | Promise<void>;
};

const GRACE_MS = 1500;
const HARD_SHUTDOWN_MS = 3000;

export async function run(options: RunOptions): Promise<number> {
  let args;
  try {
    args = parseCliArgs(options.argv, options.isStdinTty);
  } catch (err) {
    if (err instanceof ArgsError) {
      console.error(err.message);
      console.error("\n" + renderHelp());
      return 1;
    }
    console.error((err as Error).message);
    return 1;
  }

  if (args.help) {
    console.log(renderHelp());
    return 0;
  }
  if (args.version) {
    console.log("0.0.0");
    return 0;
  }

  let quiz;
  try {
    quiz = await loadQuiz(args.source, options.stdin);
  } catch (err) {
    console.error((err as Error).message);
    return 1;
  }

  return await new Promise<number>((resolve) => {
    const quizParam = quiz;
    let listener: ReturnType<typeof serve>;
    let shuttingDown = false;

    const onSigint = () => shutdown(130);

    const shutdown = (code: number) => {
      if (shuttingDown) return;
      shuttingDown = true;
      process.removeListener("SIGINT", onSigint);
      listener.close(() => resolve(code));
      setTimeout(() => resolve(code), HARD_SHUTDOWN_MS).unref();
    };

    const onFinish = async (ctx: {
      quizId: string;
      quiz: typeof quizParam;
      state: Parameters<typeof toAnswersReport>[1];
    }) => {
      const report: AnswersReport = toAnswersReport(ctx.quiz, ctx.state);
      const tasks: Array<Promise<{ ok: boolean; detail: string }>> = [];

      if (args.onComplete) {
        const url = args.onComplete;
        tasks.push(
          sendWebhook(url, report)
            .then(() => ({ ok: true, detail: `Webhook POST ${url} → 200` }))
            .catch((err) => ({ ok: false, detail: `Webhook POST ${url} → ${(err as Error).message}` })),
        );
      }
      if (args.output) {
        const path = args.output;
        tasks.push(
          writeReportFile(path, report)
            .then(() => ({ ok: true, detail: `Saved to ${path}` }))
            .catch((err) => ({ ok: false, detail: `Write ${path} failed: ${(err as Error).message}` })),
        );
      }

      const results = await Promise.all(tasks);
      const answered = Object.keys(ctx.state.answers).length;
      const total = ctx.quiz.questions.length;
      console.log(`Quiz finished: ${answered}/${total} answered.`);
      for (const r of results) {
        (r.ok ? console.log : console.error).call(console, `  ${r.detail}`);
      }

      const exitCode = results.some((r) => !r.ok) ? 2 : 0;
      setTimeout(() => shutdown(exitCode), GRACE_MS);
    };

    const service = withFinishHook(
      createInMemoryQuizService([quizParam]),
      onFinish as never,
    );
    const app = createRunnerServer({
      service,
      config: { defaultQuizId: quizParam.id },
      uiAssetsDir: resolveBundledUiDir(),
    });

    listener = serve({ fetch: app.fetch, port: args.port ?? 0 });

    process.once("SIGINT", onSigint);

    queueMicrotask(async () => {
      const addr = listener.address() as AddressInfo;
      const port = addr.port;
      const url = `http://localhost:${port}`;
      console.log(`Quiz runner ready: ${url}`);

      if (args.open) openBrowser(url);

      if (options.onReady) {
        try {
          await options.onReady({ url, port });
        } catch (err) {
          console.error("onReady handler failed:", err);
        }
      }
    });
  });
}
