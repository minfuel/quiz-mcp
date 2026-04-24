import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';

/**
 * selections — массив значений. Для mode 'single'/'multiple' это optionId'ы.
 * Для mode 'tags' это либо optionId'ы, либо произвольные строки (свободный ввод).
 */
export const DropdownAnswerSchema = z.object({
  _kind: z.literal('dropdown'),
  questionId: IdSchema,
  selections: z.array(z.string()),
});
export type DropdownAnswer = z.infer<typeof DropdownAnswerSchema>;
