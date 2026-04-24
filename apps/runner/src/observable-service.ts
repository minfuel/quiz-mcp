import type { Quiz } from "@quiz-mcp/core";
import type { QuizService, QuizState } from "@quiz-mcp/runner-api";

export type FinishHookCtx = {
  quizId: string;
  quiz: Quiz;
  state: QuizState;
};

export type FinishHook = (ctx: FinishHookCtx) => Promise<void>;

export function withFinishHook(inner: QuizService, onFinish: FinishHook): QuizService {
  return {
    ...inner,
    async finishQuiz(quizId, answers) {
      await inner.finishQuiz(quizId, answers);
      const [quiz, state] = await Promise.all([
        inner.getQuiz(quizId),
        inner.getState(quizId),
      ]);
      queueMicrotask(() => {
        onFinish({ quizId, quiz, state }).catch((err) => {
          console.error("onFinish hook failed:", err);
        });
      });
    },
  };
}
