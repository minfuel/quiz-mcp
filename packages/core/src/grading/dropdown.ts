import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { DropdownQuestion } from '../questions/dropdown.js';
import type { DropdownAnswer } from '../answers/dropdown.js';
import type { Grader } from './types.js';

export const DropdownKeySchema = z.object({
  _kind: z.literal('dropdown'),
  questionId: IdSchema,
  /** Набор корректных значений (optionId или произвольная строка для tags-режима). */
  correctSelections: z.array(z.string()),
  /** Должен ли порядок в selections иметь значение. По умолчанию — нет. */
  ordered: z.boolean().default(false),
  /** Регистрочувствительность для tags-режима. По умолчанию — нет. */
  caseSensitive: z.boolean().default(false),
});
export type DropdownKey = z.infer<typeof DropdownKeySchema>;

export const gradeDropdown: Grader<DropdownQuestion, DropdownAnswer, DropdownKey> =
  ({ answer, key }) => {
    const norm = (v: string) => (key.caseSensitive ? v : v.toLowerCase());
    const picked = answer.selections.map(norm);
    const expected = key.correctSelections.map(norm);

    let correct: boolean;
    if (key.ordered) {
      correct = picked.length === expected.length && picked.every((v, i) => v === expected[i]);
    } else {
      const pickedSet = new Set(picked);
      const expectedSet = new Set(expected);
      correct =
        pickedSet.size === expectedSet.size &&
        [...pickedSet].every((v) => expectedSet.has(v));
    }

    return {
      questionId: answer.questionId,
      correct,
      score: correct ? 1 : 0,
      details: { picked: answer.selections, expected: key.correctSelections },
    };
  };
