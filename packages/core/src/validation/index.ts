import { z } from 'zod';
import type { Question } from '../questions/index.js';
import type { Answer } from '../answers/index.js';
import type { Quiz } from '../quiz.js';
import { parseIssueFromZodMessage, raiseIssue, type Issue } from './issue.js';

import { buildSingleChoiceAnswerSchema } from './single-choice.js';
import { buildMultipleChoiceAnswerSchema } from './multiple-choice.js';
import { buildShortTextAnswerSchema } from './short-text.js';
import { buildLongTextAnswerSchema } from './long-text.js';
import { buildDropdownAnswerSchema } from './dropdown.js';
import { buildFillGapsAnswerSchema } from './fill-gaps.js';
import { buildMatchAnswerSchema } from './match.js';
import { buildScaleAnswerSchema } from './scale.js';
import { buildSortingAnswerSchema } from './sorting.js';
import { buildUploadAnswerSchema } from './upload.js';

export * from './single-choice.js';
export * from './multiple-choice.js';
export * from './short-text.js';
export * from './long-text.js';
export * from './dropdown.js';
export * from './fill-gaps.js';
export * from './match.js';
export * from './scale.js';
export * from './sorting.js';
export * from './upload.js';

/**
 * Zod-схема ответа, привязанная к настройкам конкретного вопроса.
 * Required-семантика вшита в схему: для required-вопроса «пустой» ответ
 * (пустой текст, 0 выборов, недозаполненные gap-ы и т.п.) даёт ошибку.
 */
export function buildAnswerSchema(q: Question): z.ZodType<Answer> {
  switch (q._kind) {
    case 'single_choice':
      return buildSingleChoiceAnswerSchema(q) as unknown as z.ZodType<Answer>;
    case 'multiple_choice':
      return buildMultipleChoiceAnswerSchema(q) as unknown as z.ZodType<Answer>;
    case 'short_text':
      return buildShortTextAnswerSchema(q) as unknown as z.ZodType<Answer>;
    case 'long_text':
      return buildLongTextAnswerSchema(q) as unknown as z.ZodType<Answer>;
    case 'dropdown':
      return buildDropdownAnswerSchema(q) as unknown as z.ZodType<Answer>;
    case 'fill_gaps':
      return buildFillGapsAnswerSchema(q) as unknown as z.ZodType<Answer>;
    case 'match':
      return buildMatchAnswerSchema(q) as unknown as z.ZodType<Answer>;
    case 'scale':
      return buildScaleAnswerSchema(q) as unknown as z.ZodType<Answer>;
    case 'sorting':
      return buildSortingAnswerSchema(q) as unknown as z.ZodType<Answer>;
    case 'upload':
      return buildUploadAnswerSchema(q) as unknown as z.ZodType<Answer>;
    default: {
      const _exhaustive: never = q;
      throw new Error(
        `validation: unknown question kind: ${(_exhaustive as { _kind: string })._kind}`,
      );
    }
  }
}

/**
 * Валидирует ответ в контексте вопроса.
 * - Если ответ отсутствует (undefined/null) и вопрос required → ошибка.
 * - Если ответ отсутствует и вопрос опциональный → success с data=undefined.
 * - Если ответ есть — проверяем через buildAnswerSchema (форма + бизнес-правила).
 */
export function validateAnswer(
  question: Question,
  answer: unknown,
): z.SafeParseReturnType<unknown, Answer | undefined> {
  if (answer === undefined || answer === null) {
    if (question.required) {
      return {
        success: false,
        error: new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            message: raiseIssue('required'),
            path: [],
          },
        ]),
      };
    }
    return { success: true, data: undefined };
  }
  return buildAnswerSchema(question).safeParse(answer) as z.SafeParseReturnType<
    unknown,
    Answer | undefined
  >;
}

export interface ValidateQuizResult {
  ok: boolean;
  byQuestion: Record<
    string,
    z.SafeParseReturnType<unknown, Answer | undefined>
  >;
}

export function validateQuiz(
  quiz: Quiz,
  answers: Record<string, Answer | undefined>,
): ValidateQuizResult {
  const byQuestion: ValidateQuizResult['byQuestion'] = {};
  let ok = true;
  for (const q of quiz.questions) {
    const res = validateAnswer(q, answers[q.id]);
    byQuestion[q.id] = res;
    if (!res.success) ok = false;
  }
  return { ok, byQuestion };
}

// Public helper for consumers (runner-ui) to decode Issue[] out of a Zod result.
export function extractIssues<T extends z.SafeParseReturnType<unknown, any>>(
  result: T,
): Issue[] {
  if (result.success) return [];
  return result.error.issues.map((zi) => {
    const parsed = parseIssueFromZodMessage(zi.message);
    if (parsed) return parsed;
    // Fallback for unstructured Zod messages (should not happen in practice — every
    // validator wraps messages via raiseIssue). If it does, surface as a generic
    // invalid_selection so the UI renders *something* rather than a blank alert.
    return { code: 'invalid_selection' as const, params: { message: zi.message } };
  });
}

export type { Issue, IssueCode, IssueParams } from './issue.js';
