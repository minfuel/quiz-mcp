import { z } from 'zod';
import { BaseQuestionFields } from './_base.js';

export const LongTextQuestionSchema = z.object({
  _kind: z.literal('long_text'),
  ...BaseQuestionFields,
  placeholder: z.string().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  rows: z.number().int().min(1).optional(),
});
export type LongTextQuestion = z.infer<typeof LongTextQuestionSchema>;
