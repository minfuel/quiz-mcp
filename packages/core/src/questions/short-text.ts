import { z } from 'zod';
import { BaseQuestionFields } from './_base.js';

export const ShortTextQuestionSchema = z.object({
  _kind: z.literal('short_text'),
  ...BaseQuestionFields,
  placeholder: z.string().optional(),
  maxLength: z.number().int().min(1).optional(),
});
export type ShortTextQuestion = z.infer<typeof ShortTextQuestionSchema>;
