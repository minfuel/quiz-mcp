import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const SortingAnswerSchema = z.object({
  _kind: z.literal('sorting'),
  questionId: IdSchema,
  orderedIds: z.array(IdSchema),
});
export type SortingAnswer = z.infer<typeof SortingAnswerSchema>;
