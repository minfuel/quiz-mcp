import { z } from 'zod';
import { BaseQuestionFields } from './_base.js';
import { OptionSchema } from './single-choice.js';

/**
 * mode 'single'   — выбрать один вариант
 * mode 'multiple' — выбрать несколько
 * mode 'tags'     — варианты-подсказки, пользователь может ввести свои
 */
export const DropdownQuestionSchema = z.object({
  _kind: z.literal('dropdown'),
  ...BaseQuestionFields,
  mode: z.enum(['single', 'multiple', 'tags']),
  options: z.array(OptionSchema),
});
export type DropdownQuestion = z.infer<typeof DropdownQuestionSchema>;
