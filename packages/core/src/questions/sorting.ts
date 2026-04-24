import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import { AttachmentSchema } from '../shared/attachment.js';
import { BaseQuestionFields } from './_base.js';

export const SortItemSchema = z.object({
  id: IdSchema,
  text: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
});
export type SortItem = z.infer<typeof SortItemSchema>;

export const SortingQuestionSchema = z.object({
  _kind: z.literal('sorting'),
  ...BaseQuestionFields,
  items: z.array(SortItemSchema).min(2),
});
export type SortingQuestion = z.infer<typeof SortingQuestionSchema>;
