import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { LongTextQuestion } from '../questions/long-text.js';
import type { LongTextAnswer } from '../answers/long-text.js';
import type { Grader } from './types.js';

export const LongTextKeySchema = z.object({
  _kind: z.literal('long_text'),
  questionId: IdSchema,
  /** Обязательные ключевые фрагменты, которые должны встретиться в ответе (case-insensitive, trim). */
  requiredKeywords: z.array(z.string()).default([]),
  /** Если >0 — минимальная длина ответа (после trim). */
  minLength: z.number().int().min(0).default(0),
});
export type LongTextKey = z.infer<typeof LongTextKeySchema>;

export const gradeLongText: Grader<LongTextQuestion, LongTextAnswer, LongTextKey> =
  ({ answer, key }) => {
    const body = answer.text.trim();
    const lengthOk = body.length >= key.minLength;
    const haystack = body.toLowerCase();
    const missing = key.requiredKeywords.filter(
      (kw) => !haystack.includes(kw.trim().toLowerCase()),
    );
    const keywordsOk = missing.length === 0;
    const correct = lengthOk && keywordsOk;
    const totalChecks = 1 + key.requiredKeywords.length;
    const passedChecks =
      (lengthOk ? 1 : 0) + (key.requiredKeywords.length - missing.length);
    const score = totalChecks === 0 ? (correct ? 1 : 0) : passedChecks / totalChecks;
    return {
      questionId: answer.questionId,
      correct,
      score,
      details: { lengthOk, missingKeywords: missing },
    };
  };
