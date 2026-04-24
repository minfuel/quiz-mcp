import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const MultipleChoiceAnswerSchema = z.object({
  _kind: z.literal('multiple_choice'),
  questionId: IdSchema,
  optionIds: z.array(IdSchema),
});
export type MultipleChoiceAnswer = z.infer<typeof MultipleChoiceAnswerSchema>;
