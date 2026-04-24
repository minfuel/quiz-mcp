import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { SortingQuestion } from '../questions/sorting.js';
import type { SortingAnswer } from '../answers/sorting.js';
import type { Grader } from './types.js';

export const SortingKeySchema = z.object({
  _kind: z.literal('sorting'),
  questionId: IdSchema,
  correctOrder: z.array(IdSchema).min(2),
});
export type SortingKey = z.infer<typeof SortingKeySchema>;

export const gradeSorting: Grader<SortingQuestion, SortingAnswer, SortingKey> =
  ({ answer, key }) => {
    const total = key.correctOrder.length;
    const positionMatches = answer.orderedIds.reduce(
      (acc, id, i) => acc + (id === key.correctOrder[i] ? 1 : 0),
      0,
    );
    const exact =
      answer.orderedIds.length === total &&
      answer.orderedIds.every((id, i) => id === key.correctOrder[i]);
    const score = total === 0 ? 1 : positionMatches / total;
    return {
      questionId: answer.questionId,
      correct: exact,
      score,
      details: { positionMatches, total, submitted: answer.orderedIds, expected: key.correctOrder },
    };
  };
