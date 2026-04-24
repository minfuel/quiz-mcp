import { z } from 'zod';
import { SortingAnswerSchema } from '../answers/sorting.js';
import type { SortingQuestion } from '../questions/sorting.js';
import { raiseIssue } from './issue.js';

export function buildSortingAnswerSchema(q: SortingQuestion) {
  const itemIds = new Set(q.items.map((i) => i.id));

  return SortingAnswerSchema.extend({
    questionId: z.literal(q.id),
  }).superRefine((ans, ctx) => {
    const ids = ans.orderedIds;

    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('invalid_selection'),
        path: ['orderedIds'],
      });
    }

    ids.forEach((id, i) => {
      if (!itemIds.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('invalid_option', { itemId: id }),
          path: ['orderedIds', i],
        });
      }
    });

    if (q.required && ids.length !== q.items.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('required', { required: q.items.length }),
        path: ['orderedIds'],
      });
    }
  });
}
