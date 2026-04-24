import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { MatchQuestion } from '../questions/match.js';
import type { MatchAnswer } from '../answers/match.js';
import { MatchPairSchema } from '../answers/match.js';
import type { Grader } from './types.js';

export const MatchKeySchema = z.object({
  _kind: z.literal('match'),
  questionId: IdSchema,
  correctMatches: z.array(MatchPairSchema).min(1),
});
export type MatchKey = z.infer<typeof MatchKeySchema>;

export const gradeMatch: Grader<MatchQuestion, MatchAnswer, MatchKey> =
  ({ answer, key }) => {
    const expected = new Set(key.correctMatches.map((p) => `${p.leftId}:${p.rightId}`));
    const submitted = new Set(answer.matches.map((p) => `${p.leftId}:${p.rightId}`));
    const matched = [...submitted].filter((p) => expected.has(p)).length;
    const total = expected.size;
    const score = total === 0 ? 1 : matched / total;
    const correct = matched === total && submitted.size === expected.size;
    return {
      questionId: answer.questionId,
      correct,
      score,
      details: { matched, total, submitted: answer.matches, expected: key.correctMatches },
    };
  };
