import { IdSchema, type Quiz } from "@quiz-mcp/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  AnswersReportSchema,
  QuizNotFoundError,
  toAnswersReport,
  type QuizService,
  type QuizState,
} from "@quiz-mcp/runner-api";
import { z } from "zod";

const inputSchema = z.object({ quizId: IdSchema });

export const getAnswersConfig = {
  title: "Get Quiz Answers",
  description:
    "Returns a compact pairing of each question with its submitted answer " +
    "(or null if unanswered). Each question is projected to a minimal form: " +
    "id, _kind, title, text, and the type-specific data needed to interpret " +
    "the answer (options for choice types, pairs for match, items for " +
    "sorting, min/max for scale, parts for fill_gaps, accept for upload). " +
    "Use after the user has completed or partially completed a quiz started " +
    "via start_quiz.",
  inputSchema,
  outputSchema: AnswersReportSchema.shape,
  annotations: { readOnlyHint: true },
} as const;

function formatSummary(quiz: Quiz, state: QuizState): string {
  const total = quiz.questions.length;
  const answered = Object.keys(state.answers).length;
  return `Quiz ${quiz.id}: finished=${state.finished}, answered ${answered}/${total}`;
}

export function makeGetAnswersHandler(service: QuizService) {
  return async ({ quizId }: { quizId: string }): Promise<CallToolResult> => {
    try {
      const [quiz, state] = await Promise.all([
        service.getQuiz(quizId),
        service.getState(quizId),
      ]);
      const structuredContent = toAnswersReport(quiz, state);
      const text =
        `${formatSummary(quiz, state)}\n\n` +
        JSON.stringify(structuredContent, null, 2);
      return {
        content: [{ type: "text" as const, text }],
        structuredContent,
      };
    } catch (err) {
      if (err instanceof QuizNotFoundError) {
        return {
          content: [{ type: "text" as const, text: `Quiz ${quizId} not found` }],
          isError: true,
        };
      }
      throw err;
    }
  };
}

export function registerGetAnswers(server: McpServer, service: QuizService): void {
  server.registerTool("get_answers", getAnswersConfig, makeGetAnswersHandler(service));
}
