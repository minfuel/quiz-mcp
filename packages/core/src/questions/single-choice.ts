import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import { AttachmentSchema } from '../shared/attachment.js';
import { BaseQuestionFields } from './_base.js';

export const OptionSchema = z.object({
  id: IdSchema,
  label: z.string(),
  attachment: AttachmentSchema.optional(),
});
export type Option = z.infer<typeof OptionSchema>;

export const SingleChoiceQuestionSchema = z.object({
  _kind: z.literal('single_choice'),
  ...BaseQuestionFields,
  mode: z.enum(['list', 'grid']).default('list'),
  options: z.array(OptionSchema).min(2),
});
export type SingleChoiceQuestion = z.infer<typeof SingleChoiceQuestionSchema>;
