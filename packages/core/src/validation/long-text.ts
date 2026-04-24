import { z } from 'zod';
import { LongTextAnswerSchema } from '../answers/long-text.js';
import type { LongTextQuestion } from '../questions/long-text.js';
import { raiseIssue } from './issue.js';

export function buildLongTextAnswerSchema(q: LongTextQuestion) {
  let text = z.string();
  const min = q.required
    ? Math.max(q.minLength ?? 0, 1)
    : (q.minLength ?? 0);
  if (min > 0) {
    // When the field is required with no explicit minLength (or minLength<1), surface
    // the friendlier "required" issue instead of "min_length: 1" for empty submissions.
    // Otherwise emit a proper "min_length" issue carrying the configured minimum.
    const msg = q.required && min === 1 && (q.minLength ?? 0) < 1
      ? raiseIssue('required')
      : raiseIssue('min_length', { min });
    text = text.min(min, msg);
  }
  if (q.maxLength != null) text = text.max(q.maxLength, raiseIssue('max_length', { max: q.maxLength }));
  return LongTextAnswerSchema.extend({
    questionId: z.literal(q.id),
    text,
  });
}
