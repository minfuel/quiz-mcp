import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import type { ShortTextQuestion } from '../questions/short-text.js';
import type { ShortTextAnswer } from '../answers/short-text.js';
import type { Grader } from './types.js';

export const ShortTextKeySchema = z.object({
  _kind: z.literal('short_text'),
  questionId: IdSchema,
  acceptedAnswers: z.array(z.string()).min(1),
  caseSensitive: z.boolean().default(false),
  trim: z.boolean().default(true),
});
export type ShortTextKey = z.infer<typeof ShortTextKeySchema>;

const normalize = (s: string, caseSensitive: boolean, trim: boolean): string => {
  let out = s;
  if (trim) out = out.trim();
  if (!caseSensitive) out = out.toLowerCase();
  return out;
};

export const gradeShortText: Grader<ShortTextQuestion, ShortTextAnswer, ShortTextKey> =
  ({ answer, key }) => {
    const submitted = normalize(answer.text, key.caseSensitive, key.trim);
    const accepted = key.acceptedAnswers.map((a) => normalize(a, key.caseSensitive, key.trim));
    const correct = accepted.includes(submitted);
    return {
      questionId: answer.questionId,
      correct,
      score: correct ? 1 : 0,
      details: { submitted, acceptedAnswers: key.acceptedAnswers },
    };
  };
