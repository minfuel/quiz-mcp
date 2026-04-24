import { z } from 'zod';
import { SingleChoiceAnswerSchema } from './single-choice.js';
import { MultipleChoiceAnswerSchema } from './multiple-choice.js';
import { ShortTextAnswerSchema } from './short-text.js';
import { LongTextAnswerSchema } from './long-text.js';
import { DropdownAnswerSchema } from './dropdown.js';
import { FillGapsAnswerSchema } from './fill-gaps.js';
import { MatchAnswerSchema } from './match.js';
import { ScaleAnswerSchema } from './scale.js';
import { SortingAnswerSchema } from './sorting.js';
import { UploadAnswerSchema } from './upload.js';

export const AnswerSchema = z.discriminatedUnion('_kind', [
  SingleChoiceAnswerSchema,
  MultipleChoiceAnswerSchema,
  ShortTextAnswerSchema,
  LongTextAnswerSchema,
  DropdownAnswerSchema,
  FillGapsAnswerSchema,
  MatchAnswerSchema,
  ScaleAnswerSchema,
  SortingAnswerSchema,
  UploadAnswerSchema,
]);
export type Answer = z.infer<typeof AnswerSchema>;

export * from './single-choice.js';
export * from './multiple-choice.js';
export * from './short-text.js';
export * from './long-text.js';
export * from './dropdown.js';
export * from './fill-gaps.js';
export * from './match.js';
export * from './scale.js';
export * from './sorting.js';
export * from './upload.js';
