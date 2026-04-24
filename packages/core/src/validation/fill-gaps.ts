import { z } from 'zod';
import { FillGapsAnswerSchema } from '../answers/fill-gaps.js';
import type { FillGapsQuestion } from '../questions/fill-gaps.js';
import { raiseIssue } from './issue.js';

export function buildFillGapsAnswerSchema(q: FillGapsQuestion) {
  const gaps = q.parts.filter(
    (p): p is Exclude<(typeof q.parts)[number], { _kind: 'text' }> =>
      p._kind !== 'text',
  );
  const gapIds = new Set(gaps.map((g) => g.gapId));
  const dropdownOptionsByGapId: Record<string, Set<string>> = {};
  for (const g of gaps) {
    if (g._kind === 'dropdown_gap') {
      dropdownOptionsByGapId[g.gapId] = new Set(g.options.map((o) => o.id));
    }
  }

  return FillGapsAnswerSchema.extend({
    questionId: z.literal(q.id),
  }).superRefine((ans, ctx) => {
    const fills = ans.fills;

    for (const gapId of Object.keys(fills)) {
      if (!gapIds.has(gapId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('invalid_option', { gapId }),
          path: ['fills', gapId],
        });
        continue;
      }
      const opts = dropdownOptionsByGapId[gapId];
      const value = fills[gapId];
      if (opts && value !== '' && !opts.has(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('invalid_option', { gapId }),
          path: ['fills', gapId],
        });
      }
    }

    if (q.required) {
      for (const g of gaps) {
        const v = fills[g.gapId];
        if (v === undefined || v === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: raiseIssue('required', { gapId: g.gapId }),
            path: ['fills', g.gapId],
          });
        }
      }
    }
  });
}
