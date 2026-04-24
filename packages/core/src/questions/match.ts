import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import { AttachmentSchema } from '../shared/attachment.js';
import { BaseQuestionFields } from './_base.js';

export const MatchOptionSchema = z.object({
  id: IdSchema,
  text: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
});
export type MatchOption = z.infer<typeof MatchOptionSchema>;

export const MatchQuestionSchema = z.object({
  _kind: z.literal('match'),
  ...BaseQuestionFields,
  pairs: z.tuple([
    z.array(MatchOptionSchema).min(1),
    z.array(MatchOptionSchema).min(1),
  ]),
});
export type MatchQuestion = z.infer<typeof MatchQuestionSchema>;
