import { z } from 'zod';
import { MultipleChoiceAnswerSchema } from '../answers/multiple-choice.js';
import type { MultipleChoiceQuestion } from '../questions/multiple-choice.js';
import { raiseIssue } from './issue.js';

export function buildMultipleChoiceAnswerSchema(q: MultipleChoiceQuestion) {
  const optionIds = new Set(q.options.map((o) => o.id));
  const effectiveMin = q.required
    ? Math.max(q.minSelections ?? 0, 1)
    : (q.minSelections ?? 0);

  return MultipleChoiceAnswerSchema.extend({
    questionId: z.literal(q.id),
  }).superRefine((ans, ctx) => {
    const ids = ans.optionIds;

    if (ids.length < effectiveMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('min_selections', { min: effectiveMin }),
        path: ['optionIds'],
      });
    }
    if (q.maxSelections != null && ids.length > q.maxSelections) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('max_selections', { max: q.maxSelections }),
        path: ['optionIds'],
      });
    }
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('invalid_selection'),
        path: ['optionIds'],
      });
    }
    ids.forEach((id, i) => {
      if (!optionIds.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('invalid_option', { optionId: id }),
          path: ['optionIds', i],
        });
      }
    });
  });
}
