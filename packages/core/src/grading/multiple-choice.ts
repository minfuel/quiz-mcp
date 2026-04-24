import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { MultipleChoiceQuestion } from '../questions/multiple-choice.js';
import type { MultipleChoiceAnswer } from '../answers/multiple-choice.js';
import type { Grader } from './types.js';

export const MultipleChoiceKeySchema = z.object({
  _kind: z.literal('multiple_choice'),
  questionId: IdSchema,
  correctOptionIds: z.array(IdSchema).min(1),
});
export type MultipleChoiceKey = z.infer<typeof MultipleChoiceKeySchema>;

/**
 * MVP: exact-set match. Partial credit is intentionally deferred.
 */
export const gradeMultipleChoice: Grader<
  MultipleChoiceQuestion,
  MultipleChoiceAnswer,
  MultipleChoiceKey
> = ({ answer, key }) => {
  const picked = new Set(answer.optionIds);
  const correctSet = new Set(key.correctOptionIds);
  const sameSize = picked.size === correctSet.size;
  const sameMembers = sameSize && [...picked].every((id) => correctSet.has(id));
  const correct = sameMembers;
  return {
    questionId: answer.questionId,
    correct,
    score: correct ? 1 : 0,
    details: {
      correctOptionIds: key.correctOptionIds,
      picked: answer.optionIds,
    },
  };
};
