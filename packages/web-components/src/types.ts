import type { Answer } from '@quiz-mcp/core';
import type { ValidateQuizResult } from '@quiz-mcp/core/validation';

export type QuizAnswerEventDetail = Answer;

export interface QuizFinishEventDetail {
  answers: Record<string, Answer>;
}

export interface QuizValidationErrorEventDetail {
  answers: Record<string, Answer>;
  report: ValidateQuizResult;
}

export type QuizAnswerEvent = CustomEvent<QuizAnswerEventDetail>;
export type QuizFinishEvent = CustomEvent<QuizFinishEventDetail>;
export type QuizValidationErrorEvent = CustomEvent<QuizValidationErrorEventDetail>;

declare global {
  interface HTMLElementEventMap {
    'quiz-answer': QuizAnswerEvent;
    'quiz-finish': QuizFinishEvent;
    'quiz-validation-error': QuizValidationErrorEvent;
  }
}
