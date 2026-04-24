import { z } from 'zod';
import { ScaleAnswerSchema } from '../answers/scale.js';
import type { ScaleQuestion } from '../questions/scale.js';
import { raiseIssue } from './issue.js';

export function buildScaleAnswerSchema(q: ScaleQuestion) {
  return ScaleAnswerSchema.extend({
    questionId: z.literal(q.id),
    value: z
      .number()
      .min(q.min, raiseIssue('out_of_range', { min: q.min }))
      .max(q.max, raiseIssue('out_of_range', { max: q.max }))
      .refine(
        (v) => {
          const steps = (v - q.min) / q.step;
          return Math.abs(steps - Math.round(steps)) < 1e-9;
        },
        { message: raiseIssue('out_of_range', { step: q.step }) },
      ),
  });
}
