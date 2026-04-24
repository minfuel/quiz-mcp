import { z } from 'zod';
import { MatchAnswerSchema } from '../answers/match.js';
import type { MatchQuestion } from '../questions/match.js';
import { raiseIssue } from './issue.js';

export function buildMatchAnswerSchema(q: MatchQuestion) {
  const [leftSide, rightSide] = q.pairs;
  const leftIds = new Set(leftSide.map((o) => o.id));
  const rightIds = new Set(rightSide.map((o) => o.id));

  return MatchAnswerSchema.extend({
    questionId: z.literal(q.id),
  }).superRefine((ans, ctx) => {
    const m = ans.matches;
    const seenLeft = new Set<string>();
    const seenRight = new Set<string>();

    m.forEach((pair, i) => {
      if (!leftIds.has(pair.leftId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('invalid_option', { leftId: pair.leftId }),
          path: ['matches', i, 'leftId'],
        });
      }
      if (!rightIds.has(pair.rightId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('invalid_option', { rightId: pair.rightId }),
          path: ['matches', i, 'rightId'],
        });
      }
      if (seenLeft.has(pair.leftId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('invalid_selection', { leftId: pair.leftId }),
          path: ['matches', i, 'leftId'],
        });
      }
      if (seenRight.has(pair.rightId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: raiseIssue('invalid_selection', { rightId: pair.rightId }),
          path: ['matches', i, 'rightId'],
        });
      }
      seenLeft.add(pair.leftId);
      seenRight.add(pair.rightId);
    });

    if (q.required) {
      for (const l of leftSide) {
        if (!seenLeft.has(l.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: raiseIssue('incomplete_pairs', { leftId: l.id }),
            path: ['matches'],
          });
        }
      }
    }
  });
}
