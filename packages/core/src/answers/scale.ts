import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const ScaleAnswerSchema = z.object({
  _kind: z.literal('scale'),
  questionId: IdSchema,
  value: z.number(),
});
export type ScaleAnswer = z.infer<typeof ScaleAnswerSchema>;
