import type { Answer } from "@quiz-mcp/core";
import { Hono } from "hono";
import { QuizNotFoundError, type QuizService } from "./service.js";

export {
  CompactQuestionSchema,
  AnswersReportSchema,
  toAnswersReport,
  type CompactQuestion,
  type AnswersReport,
} from "./report.js";
export { QuizNotFoundError } from "./service.js";
export type { QuizService, QuizState } from "./service.js";

const isAnswerLike = (x: unknown): x is Answer =>
  !!x &&
  typeof x === "object" &&
  typeof (x as { questionId?: unknown }).questionId === "string";

export const createRunnerApi = (service: QuizService) =>
  new Hono()
    .onError((err, c) => {
      if (err instanceof QuizNotFoundError) return c.notFound();
      throw err;
    })
    .get("/:quizId/quiz.json", async (c) => {
      const quiz = await service.getQuiz(c.req.param("quizId"));
      return c.json(quiz);
    })
    .post("/:quizId/answer", async (c) => {
      const quizId = c.req.param("quizId");
      let payload: unknown;
      try {
        payload = await c.req.json();
      } catch {
        return c.json({ error: "Invalid JSON" }, 400);
      }
      if (!isAnswerLike(payload)) {
        return c.json({ error: "answer.questionId required" }, 400);
      }
      await service.saveAnswer(quizId, payload);
      return c.body(null, 204);
    })
    .post("/:quizId/finish", async (c) => {
      const quizId = c.req.param("quizId");
      let payload: unknown;
      try {
        payload = await c.req.json();
      } catch {
        return c.json({ error: "Invalid JSON" }, 400);
      }
      const answers = (payload as { answers?: unknown })?.answers;
      if (!answers || typeof answers !== "object") {
        return c.json({ error: "answers record required" }, 400);
      }
      const cleaned: Record<string, Answer> = {};
      for (const [qid, a] of Object.entries(answers as Record<string, unknown>)) {
        if (isAnswerLike(a)) cleaned[qid] = a;
      }
      await service.finishQuiz(quizId, cleaned);
      return c.body(null, 204);
    })
    .get("/:quizId/answer", async (c) => {
      const state = await service.getState(c.req.param("quizId"));
      return c.json(state, 200, { "Cache-Control": "no-store" });
    });

export type RunnerApi = ReturnType<typeof createRunnerApi>;
