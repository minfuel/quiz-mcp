import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const SingleChoiceAnswerSchema = z.object({
  _kind: z.literal('single_choice'),
  questionId: IdSchema,
  optionId: IdSchema,
});
export type SingleChoiceAnswer = z.infer<typeof SingleChoiceAnswerSchema>;
