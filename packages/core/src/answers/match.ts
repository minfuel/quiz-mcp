import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

export const MatchPairSchema = z.object({
  leftId: IdSchema,
  rightId: IdSchema,
});
export type MatchPair = z.infer<typeof MatchPairSchema>;

export const MatchAnswerSchema = z.object({
  _kind: z.literal('match'),
  questionId: IdSchema,
  matches: z.array(MatchPairSchema),
});
export type MatchAnswer = z.infer<typeof MatchAnswerSchema>;
