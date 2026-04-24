import { z } from "zod";
import { IdSchema, QuizSchema, type Quiz } from "@quiz-mcp/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { QuizService } from "@quiz-mcp/runner-api";
import type { OpenBrowser } from "../open-browser.js";

export type ServerUrlSource = string | (() => string);

export type StartQuizDeps = {
  service: QuizService;
  serverUrl: ServerUrlSource;
  openBrowser: OpenBrowser;
};

const inputSchema = z.object({
  quiz: QuizSchema,
  open: z.boolean().default(true),
});

const outputSchema = z.object({
  quizId: IdSchema,
  url: z.string().url(),
  opened: z.boolean(),
});

export const startQuizConfig = {
  title: "Start Quiz",
  description:
    "Registers a quiz in the runner and (optionally) opens it in the user's " +
    "default browser. Returns the quiz URL and id. The quiz must match the " +
    "schema returned by get_quiz_format.",
  inputSchema,
  outputSchema,
} as const;

const trimSlash = (s: string): string => s.replace(/\/+$/, "");

const resolveServerUrl = (source: ServerUrlSource): string =>
  typeof source === "function" ? source() : source;

export function makeStartQuizHandler(deps: StartQuizDeps) {
  return async ({ quiz, open }: { quiz: Quiz; open: boolean }): Promise<CallToolResult> => {
    await deps.service.registerQuiz(quiz);
    const url = `${trimSlash(resolveServerUrl(deps.serverUrl))}/${quiz.id}`;
    let opened = false;
    if (open) {
      try {
        await deps.openBrowser(url);
        opened = true;
      } catch {
        opened = false;
      }
    }
    return {
      content: [
        {
          type: "text" as const,
          text: `Quiz ${quiz.id} started. URL: ${url} (opened=${opened})`,
        },
      ],
      structuredContent: { quizId: quiz.id, url, opened },
    };
  };
}

export function registerStartQuiz(server: McpServer, deps: StartQuizDeps): void {
  server.registerTool("start_quiz", startQuizConfig, makeStartQuizHandler(deps));
}
