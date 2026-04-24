import { z } from 'zod';
import { SingleChoiceQuestionSchema } from './single-choice.js';
import { MultipleChoiceQuestionSchema } from './multiple-choice.js';
import { ShortTextQuestionSchema } from './short-text.js';
import { LongTextQuestionSchema } from './long-text.js';
import { DropdownQuestionSchema } from './dropdown.js';
import { FillGapsQuestionSchema } from './fill-gaps.js';
import { MatchQuestionSchema } from './match.js';
import { ScaleQuestionSchema } from './scale.js';
import { SortingQuestionSchema } from './sorting.js';
import { UploadQuestionSchema } from './upload.js';

export const QuestionSchema = z.discriminatedUnion('_kind', [
  SingleChoiceQuestionSchema,
  MultipleChoiceQuestionSchema,
  ShortTextQuestionSchema,
  LongTextQuestionSchema,
  DropdownQuestionSchema,
  FillGapsQuestionSchema,
  MatchQuestionSchema,
  ScaleQuestionSchema,
  SortingQuestionSchema,
  UploadQuestionSchema,
]);
export type Question = z.infer<typeof QuestionSchema>;

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
