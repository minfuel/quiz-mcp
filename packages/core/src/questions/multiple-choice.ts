import { z } from 'zod';
import { BaseQuestionFields } from './_base.js';
import { OptionSchema } from './single-choice.js';

export const MultipleChoiceQuestionSchema = z.object({
  _kind: z.literal('multiple_choice'),
  ...BaseQuestionFields,
  mode: z.enum(['list', 'grid']).default('list'),
  options: z.array(OptionSchema).min(2),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
});
export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;
