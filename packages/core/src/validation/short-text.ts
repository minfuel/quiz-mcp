import { z } from 'zod';
import { ShortTextAnswerSchema } from '../answers/short-text.js';
import type { ShortTextQuestion } from '../questions/short-text.js';
import { raiseIssue } from './issue.js';

export function buildShortTextAnswerSchema(q: ShortTextQuestion) {
  let text = z.string();
  if (q.required) text = text.min(1, raiseIssue('required'));
  if (q.maxLength != null) text = text.max(q.maxLength, raiseIssue('max_length', { max: q.maxLength }));
  return ShortTextAnswerSchema.extend({
    questionId: z.literal(q.id),
    text,
  });
}
