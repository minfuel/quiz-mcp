import { z } from 'zod';
import { SingleChoiceAnswerSchema } from '../answers/single-choice.js';
import type { SingleChoiceQuestion } from '../questions/single-choice.js';
import { raiseIssue } from './issue.js';

export function buildSingleChoiceAnswerSchema(q: SingleChoiceQuestion) {
  const optionIds = new Set(q.options.map((o) => o.id));
  return SingleChoiceAnswerSchema.extend({
    questionId: z.literal(q.id),
    optionId: z.string().refine((id) => optionIds.has(id), {
      message: raiseIssue('invalid_option'),
    }),
  });
}
