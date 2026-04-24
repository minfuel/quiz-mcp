import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const GradeResultSchema = z.object({
  questionId: IdSchema,
  correct: z.boolean(),
  score: z.number().min(0).max(1),
  details: z.unknown().optional(),
});
export type GradeResult = z.infer<typeof GradeResultSchema>;

export type Grader<Q, A, K> = (args: {
  question: Q;
  answer: A;
  key: K;
}) => GradeResult;
