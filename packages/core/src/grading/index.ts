import { z } from 'zod';
import type { Question } from '../questions/index.js';
import type { Answer } from '../answers/index.js';
import type { SingleChoiceAnswer } from '../answers/single-choice.js';
import {
  SingleChoiceKeySchema,
  gradeSingleChoice,
  type SingleChoiceKey,
} from './single-choice.js';
import type { MultipleChoiceAnswer } from '../answers/multiple-choice.js';
import {
  MultipleChoiceKeySchema,
  gradeMultipleChoice,
  type MultipleChoiceKey,
} from './multiple-choice.js';
import type { ShortTextAnswer } from '../answers/short-text.js';
import {
  ShortTextKeySchema,
  gradeShortText,
  type ShortTextKey,
} from './short-text.js';
import type { LongTextAnswer } from '../answers/long-text.js';
import {
  LongTextKeySchema,
  gradeLongText,
  type LongTextKey,
} from './long-text.js';
import type { DropdownAnswer } from '../answers/dropdown.js';
import {
  DropdownKeySchema,
  gradeDropdown,
  type DropdownKey,
} from './dropdown.js';
import type { FillGapsAnswer } from '../answers/fill-gaps.js';
import {
  FillGapsKeySchema,
  gradeFillGaps,
  type FillGapsKey,
} from './fill-gaps.js';
import type { MatchAnswer } from '../answers/match.js';
import {
  MatchKeySchema,
  gradeMatch,
  type MatchKey,
} from './match.js';
import type { ScaleAnswer } from '../answers/scale.js';
import {
  ScaleKeySchema,
  gradeScale,
  type ScaleKey,
} from './scale.js';
import type { SortingAnswer } from '../answers/sorting.js';
import {
  SortingKeySchema,
  gradeSorting,
  type SortingKey,
} from './sorting.js';
import type { UploadAnswer } from '../answers/upload.js';
import {
  UploadKeySchema,
  gradeUpload,
  type UploadKey,
} from './upload.js';
import type { GradeResult } from './types.js';

export { GradeResultSchema, type GradeResult, type Grader } from './types.js';
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

export const AnswerKeySchema = z.discriminatedUnion('_kind', [
  SingleChoiceKeySchema,
  MultipleChoiceKeySchema,
  ShortTextKeySchema,
  LongTextKeySchema,
  DropdownKeySchema,
  FillGapsKeySchema,
  MatchKeySchema,
  ScaleKeySchema,
  SortingKeySchema,
  UploadKeySchema,
]);
export type AnswerKey = z.infer<typeof AnswerKeySchema>;

export function grade(args: {
  question: Question;
  answer: Answer;
  key: AnswerKey;
}): GradeResult {
  const { question, answer, key } = args;
  if (question._kind !== answer._kind || question._kind !== key._kind) {
    throw new Error(
      `grading _kind mismatch: q=${question._kind} a=${answer._kind} k=${key._kind}`,
    );
  }
  switch (question._kind) {
    case 'single_choice':
      return gradeSingleChoice({
        question,
        answer: answer as SingleChoiceAnswer,
        key: key as SingleChoiceKey,
      });
    case 'multiple_choice':
      return gradeMultipleChoice({
        question,
        answer: answer as MultipleChoiceAnswer,
        key: key as MultipleChoiceKey,
      });
    case 'short_text':
      return gradeShortText({
        question,
        answer: answer as ShortTextAnswer,
        key: key as ShortTextKey,
      });
    case 'long_text':
      return gradeLongText({
        question,
        answer: answer as LongTextAnswer,
        key: key as LongTextKey,
      });
    case 'dropdown':
      return gradeDropdown({
        question,
        answer: answer as DropdownAnswer,
        key: key as DropdownKey,
      });
    case 'fill_gaps':
      return gradeFillGaps({
        question,
        answer: answer as FillGapsAnswer,
        key: key as FillGapsKey,
      });
    case 'match':
      return gradeMatch({
        question,
        answer: answer as MatchAnswer,
        key: key as MatchKey,
      });
    case 'scale':
      return gradeScale({
        question,
        answer: answer as ScaleAnswer,
        key: key as ScaleKey,
      });
    case 'sorting':
      return gradeSorting({
        question,
        answer: answer as SortingAnswer,
        key: key as SortingKey,
      });
    case 'upload':
      return gradeUpload({
        question,
        answer: answer as UploadAnswer,
        key: key as UploadKey,
      });
    default: {
      const _exhaustive: never = question;
      throw new Error(
        `grading: unknown question kind: ${(_exhaustive as { _kind: string })._kind}`,
      );
    }
  }
}

export {
  createGraduator,
  type Graduator,
  type GraduatorOptions,
  type GraduatorSummary,
  type GraduatorReport,
  type KeyBodyByKind,
  type AnyKeyBody,
  type KeysMap,
} from './factory.js';
