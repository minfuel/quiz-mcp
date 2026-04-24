import { z } from 'zod';
import { DropdownAnswerSchema } from '../answers/dropdown.js';
import type { DropdownQuestion } from '../questions/dropdown.js';
import { raiseIssue } from './issue.js';

export function buildDropdownAnswerSchema(q: DropdownQuestion) {
  const optionIds = new Set(q.options.map((o) => o.id));

  return DropdownAnswerSchema.extend({
    questionId: z.literal(q.id),
  }).superRefine((ans, ctx) => {
    const sels = ans.selections;

    if (new Set(sels).size !== sels.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('invalid_selection'),
        path: ['selections'],
      });
    }

    if (q.required && sels.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('required'),
        path: ['selections'],
      });
    }

    if (q.mode === 'single' && sels.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: raiseIssue('invalid_selection'),
        path: ['selections'],
      });
    }

    if (q.mode !== 'tags') {
      sels.forEach((s, i) => {
        if (!optionIds.has(s)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: raiseIssue('invalid_option', { optionId: s }),
            path: ['selections', i],
          });
        }
      });
    }
  });
}
