import type { Answer, Quiz } from "@quiz-mcp/core";

export class QuizNotFoundError extends Error {
  readonly quizId: string;
  constructor(quizId: string) {
    super(`Quiz not found: ${quizId}`);
    this.name = "QuizNotFoundError";
    this.quizId = quizId;
  }
}

export type QuizState = {
  finished: boolean;
  answers: Record<string, Answer>;
};

export interface QuizService {
  registerQuiz(quiz: Quiz): Promise<void>;
  quizExists(quizId: string): Promise<boolean>;
  getQuiz(quizId: string): Promise<Quiz>;
  saveAnswer(quizId: string, answer: Answer): Promise<void>;
  finishQuiz(quizId: string, answers: Record<string, Answer>): Promise<void>;
  getState(quizId: string): Promise<QuizState>;
}
