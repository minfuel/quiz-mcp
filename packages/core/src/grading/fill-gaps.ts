import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { FillGapsQuestion } from '../questions/fill-gaps.js';
import type { FillGapsAnswer } from '../answers/fill-gaps.js';
import type { Grader } from './types.js';

export const FillGapsKeySchema = z.object({
  _kind: z.literal('fill_gaps'),
  questionId: IdSchema,
  /** Для каждого gapId — массив принимаемых значений (синонимы / optionId'ы). */
  correctFills: z.record(IdSchema, z.array(z.string()).min(1)),
  caseSensitive: z.boolean().default(false),
  trim: z.boolean().default(true),
});
export type FillGapsKey = z.infer<typeof FillGapsKeySchema>;

const normalize = (s: string, caseSensitive: boolean, trim: boolean): string => {
  let out = s;
  if (trim) out = out.trim();
  if (!caseSensitive) out = out.toLowerCase();
  return out;
};

export const gradeFillGaps: Grader<FillGapsQuestion, FillGapsAnswer, FillGapsKey> =
  ({ answer, key }) => {
    const gapIds = Object.keys(key.correctFills);
    const perGap = gapIds.map((gapId) => {
      const submitted = normalize(answer.fills[gapId] ?? '', key.caseSensitive, key.trim);
      const accepted = key.correctFills[gapId]!.map((v) =>
        normalize(v, key.caseSensitive, key.trim),
      );
      return { gapId, correct: accepted.includes(submitted) };
    });
    const correctCount = perGap.filter((g) => g.correct).length;
    const total = gapIds.length;
    const score = total === 0 ? 1 : correctCount / total;
    return {
      questionId: answer.questionId,
      correct: correctCount === total,
      score,
      details: { perGap, correctCount, total },
    };
  };
