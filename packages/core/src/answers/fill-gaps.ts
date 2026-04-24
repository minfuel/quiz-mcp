import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const FillGapsAnswerSchema = z.object({
  _kind: z.literal('fill_gaps'),
  questionId: IdSchema,
  /** Ключ — gapId, значение — введённая строка или выбранный optionId. */
  fills: z.record(IdSchema, z.string()),
});
export type FillGapsAnswer = z.infer<typeof FillGapsAnswerSchema>;
