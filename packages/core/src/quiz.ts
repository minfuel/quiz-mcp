import { z } from 'zod';
import { IdSchema } from './shared/primitives.js';
import { QuestionSchema } from './questions/index.js';

export const QuizSchema = z.object({
  $schema: z.string().optional(),
  id: IdSchema,
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(QuestionSchema),
});
export type Quiz = z.infer<typeof QuizSchema>;
