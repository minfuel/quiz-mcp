import { z } from 'zod';
import { BaseQuestionFields } from './_base.js';

export const ScaleQuestionSchema = z.object({
  _kind: z.literal('scale'),
  ...BaseQuestionFields,
  min: z.number(),
  max: z.number(),
  step: z.number().positive().default(1),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});
export type ScaleQuestion = z.infer<typeof ScaleQuestionSchema>;
