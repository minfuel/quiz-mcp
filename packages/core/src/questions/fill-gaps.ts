import { z } from 'zod';
import { IdSchema } from '../shared/primitives.js';
import { BaseQuestionFields } from './_base.js';
import { OptionSchema } from './single-choice.js';

export const TextPartSchema = z.object({
  _kind: z.literal('text'),
  content: z.string(),
});
export type TextPart = z.infer<typeof TextPartSchema>;

export const TextGapPartSchema = z.object({
  _kind: z.literal('text_gap'),
  gapId: IdSchema,
  placeholder: z.string().optional(),
});
export type TextGapPart = z.infer<typeof TextGapPartSchema>;

export const DropdownGapPartSchema = z.object({
  _kind: z.literal('dropdown_gap'),
  gapId: IdSchema,
  options: z.array(OptionSchema).min(2),
});
export type DropdownGapPart = z.infer<typeof DropdownGapPartSchema>;

export const FillGapsPartSchema = z.discriminatedUnion('_kind', [
  TextPartSchema,
  TextGapPartSchema,
  DropdownGapPartSchema,
]);
export type FillGapsPart = z.infer<typeof FillGapsPartSchema>;

export const FillGapsQuestionSchema = z.object({
  _kind: z.literal('fill_gaps'),
  ...BaseQuestionFields,
  parts: z.array(FillGapsPartSchema).min(1),
});
export type FillGapsQuestion = z.infer<typeof FillGapsQuestionSchema>;
