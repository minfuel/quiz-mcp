import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const LongTextAnswerSchema = z.object({
  _kind: z.literal('long_text'),
  questionId: IdSchema,
  text: z.string(),
});
export type LongTextAnswer = z.infer<typeof LongTextAnswerSchema>;
