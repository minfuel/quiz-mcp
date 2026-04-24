import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { ScaleQuestion } from '../questions/scale.js';
import type { ScaleAnswer } from '../answers/scale.js';
import type { Grader } from './types.js';

export const ScaleKeySchema = z.object({
  _kind: z.literal('scale'),
  questionId: IdSchema,
  correctValue: z.number(),
  /** Допустимое отклонение ± от correctValue. 0 = строгое равенство. */
  tolerance: z.number().min(0).default(0),
});
export type ScaleKey = z.infer<typeof ScaleKeySchema>;

export const gradeScale: Grader<ScaleQuestion, ScaleAnswer, ScaleKey> =
  ({ answer, key }) => {
    const delta = Math.abs(answer.value - key.correctValue);
    const correct = delta <= key.tolerance;
    return {
      questionId: answer.questionId,
      correct,
      score: correct ? 1 : 0,
      details: { delta, correctValue: key.correctValue, tolerance: key.tolerance },
    };
  };
