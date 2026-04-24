import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const ShortTextAnswerSchema = z.object({
  _kind: z.literal('short_text'),
  questionId: IdSchema,
  text: z.string(),
});
export type ShortTextAnswer = z.infer<typeof ShortTextAnswerSchema>;
