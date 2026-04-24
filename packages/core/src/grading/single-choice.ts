import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { SingleChoiceQuestion } from '../questions/single-choice.js';
import type { SingleChoiceAnswer } from '../answers/single-choice.js';
import type { Grader } from './types.js';

export const SingleChoiceKeySchema = z.object({
  _kind: z.literal('single_choice'),
  questionId: IdSchema,
  correctOptionId: IdSchema,
});
export type SingleChoiceKey = z.infer<typeof SingleChoiceKeySchema>;

export const gradeSingleChoice: Grader<SingleChoiceQuestion, SingleChoiceAnswer, SingleChoiceKey> =
  ({ answer, key }) => {
    const correct = answer.optionId === key.correctOptionId;
    return {
      questionId: answer.questionId,
      correct,
      score: correct ? 1 : 0,
      details: { correctOptionId: key.correctOptionId },
    };
  };
