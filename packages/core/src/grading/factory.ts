import { z } from 'zod';
import type { Id } from '../shared/primitives.js';
import type { Quiz } from '../quiz.js';
import { QuizSchema } from '../quiz.js';
import type { Question } from '../questions/index.js';
import type { Answer } from '../answers/index.js';
import type { GradeResult } from './types.js';
import {
  SingleChoiceKeySchema,
  type SingleChoiceKey,
} from './single-choice.js';
import {
  MultipleChoiceKeySchema,
  type MultipleChoiceKey,
} from './multiple-choice.js';
import {
  ShortTextKeySchema,
  type ShortTextKey,
} from './short-text.js';
import {
  LongTextKeySchema,
  type LongTextKey,
} from './long-text.js';
import {
  DropdownKeySchema,
  type DropdownKey,
} from './dropdown.js';
import {
  FillGapsKeySchema,
  type FillGapsKey,
} from './fill-gaps.js';
import {
  MatchKeySchema,
  type MatchKey,
} from './match.js';
import {
  ScaleKeySchema,
  type ScaleKey,
} from './scale.js';
import {
  SortingKeySchema,
  type SortingKey,
} from './sorting.js';
import {
  UploadKeySchema,
  type UploadKey,
} from './upload.js';
import type { AnswerKey } from './index.js';
import { grade as gradeDispatch } from './index.js';

/** Body of a key per kind — without `_kind` and `questionId` (factory fills those in). */
export type KeyBodyByKind = {
  single_choice:    Omit<SingleChoiceKey,   '_kind' | 'questionId'>;
  multiple_choice:  Omit<MultipleChoiceKey, '_kind' | 'questionId'>;
  short_text:       Omit<ShortTextKey,      '_kind' | 'questionId'>;
  long_text:        Omit<LongTextKey,       '_kind' | 'questionId'>;
  dropdown:         Omit<DropdownKey,       '_kind' | 'questionId'>;
  fill_gaps:        Omit<FillGapsKey,       '_kind' | 'questionId'>;
  match:            Omit<MatchKey,          '_kind' | 'questionId'>;
  scale:            Omit<ScaleKey,          '_kind' | 'questionId'>;
  sorting:          Omit<SortingKey,        '_kind' | 'questionId'>;
  upload:           Omit<UploadKey,         '_kind' | 'questionId'>;
};

export type AnyKeyBody = KeyBodyByKind[keyof KeyBodyByKind];

/** Map from questionId to a key body. */
export type KeysMap = Record<Id, AnyKeyBody>;

export interface GraduatorOptions {
  /** Pass threshold in [0, 1]. If provided, summary.passed = percentage >= threshold. */
  passThreshold?: number;
}

export interface GraduatorSummary {
  total: number;
  answered: number;
  correctCount: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed?: boolean;
}

export interface GraduatorReport {
  results: GradeResult[];
  summary: GraduatorSummary;
}

export interface Graduator {
  grade(answer: Answer): GradeResult;
  gradeQuiz(answers: Answer[]): GraduatorReport;
}

type KeySchemaForKind = {
  single_choice:   typeof SingleChoiceKeySchema;
  multiple_choice: typeof MultipleChoiceKeySchema;
  short_text:      typeof ShortTextKeySchema;
  long_text:       typeof LongTextKeySchema;
  dropdown:        typeof DropdownKeySchema;
  fill_gaps:       typeof FillGapsKeySchema;
  match:           typeof MatchKeySchema;
  scale:           typeof ScaleKeySchema;
  sorting:         typeof SortingKeySchema;
  upload:          typeof UploadKeySchema;
};

function keySchemaFor<K extends Question['_kind']>(
  kind: K,
): KeySchemaForKind[K];
function keySchemaFor(kind: Question['_kind']): z.ZodTypeAny {
  switch (kind) {
    case 'single_choice':   return SingleChoiceKeySchema;
    case 'multiple_choice': return MultipleChoiceKeySchema;
    case 'short_text':      return ShortTextKeySchema;
    case 'long_text':       return LongTextKeySchema;
    case 'dropdown':        return DropdownKeySchema;
    case 'fill_gaps':       return FillGapsKeySchema;
    case 'match':           return MatchKeySchema;
    case 'scale':           return ScaleKeySchema;
    case 'sorting':         return SortingKeySchema;
    case 'upload':          return UploadKeySchema;
    default: {
      const _exhaustive: never = kind;
      throw new Error(
        `keySchemaFor: unknown question kind: ${String(_exhaustive)}`,
      );
    }
  }
}

export function createGraduator(
  quiz: Quiz,
  keys: KeysMap,
  options: GraduatorOptions = {},
): Graduator {
  // 1. Parse quiz (defense against partial / malformed input).
  const parsedQuiz = QuizSchema.parse(quiz);

  // 2. Validate passThreshold.
  const { passThreshold } = options;
  if (passThreshold !== undefined) {
    if (
      !Number.isFinite(passThreshold) ||
      passThreshold < 0 ||
      passThreshold > 1
    ) {
      throw new Error('createGraduator: passThreshold must be in [0,1]');
    }
  }

  // 3. Build questionsById + detect duplicate question ids.
  const questionsById = new Map<Id, Question>();
  for (const q of parsedQuiz.questions) {
    if (questionsById.has(q.id)) {
      throw new Error(`createGraduator: duplicate question id ${q.id}`);
    }
    questionsById.set(q.id, q);
  }

  // 4. Exhaustive key coverage (strict both directions).
  for (const q of parsedQuiz.questions) {
    if (!Object.prototype.hasOwnProperty.call(keys, q.id)) {
      throw new Error(`createGraduator: missing key for question ${q.id}`);
    }
  }
  for (const id of Object.keys(keys)) {
    if (!questionsById.has(id)) {
      throw new Error(`createGraduator: extra key for unknown question ${id}`);
    }
  }

  // 5. Build keysById by injecting _kind + questionId and parsing per-type.
  const keysById = new Map<Id, AnswerKey>();
  for (const q of parsedQuiz.questions) {
    const body = keys[q.id];
    const full = { ...body, _kind: q._kind, questionId: q.id };
    const parsed = keySchemaFor(q._kind).parse(full) as AnswerKey;
    keysById.set(q.id, parsed);
  }

  function gradeOne(answer: Answer): GradeResult {
    const question = questionsById.get(answer.questionId);
    if (!question) {
      throw new Error(
        `grade: answer.questionId ${answer.questionId} not in quiz`,
      );
    }
    const key = keysById.get(answer.questionId);
    if (!key) {
      // Unreachable if construction ran correctly; defensive for bugs in factory.
      throw new Error(`grade: no key for question ${answer.questionId}`);
    }
    return gradeDispatch({ question, answer, key });
  }

  return {
    grade: gradeOne,
    gradeQuiz(answers: Answer[]): GraduatorReport {
      // a. Validate input: strict on unknown questionId and duplicates.
      const answersById = new Map<Id, Answer>();
      for (const a of answers) {
        if (!questionsById.has(a.questionId)) {
          throw new Error(
            `gradeQuiz: answer for unknown question ${a.questionId}`,
          );
        }
        if (answersById.has(a.questionId)) {
          throw new Error(
            `gradeQuiz: duplicate answer for question ${a.questionId}`,
          );
        }
        answersById.set(a.questionId, a);
      }

      // b. Build results in quiz.questions order; synthesize missing as needed.
      const results: GradeResult[] = [];
      for (const q of parsedQuiz.questions) {
        const answer = answersById.get(q.id);
        if (!answer) {
          results.push({
            questionId: q.id,
            correct: false,
            score: 0,
            details: { missing: true },
          });
          continue;
        }
        results.push(gradeOne(answer));
      }

      // c. Build weighted summary.
      let totalScore = 0;
      let maxScore = 0;
      let correctCount = 0;
      let answered = 0;
      for (let i = 0; i < parsedQuiz.questions.length; i++) {
        const q = parsedQuiz.questions[i]!;
        const r = results[i]!;
        const weight = q.score ?? 1;
        maxScore += weight;
        totalScore += r.score * weight;
        if (r.correct) correctCount += 1;
        const isMissing =
          !!r.details &&
          typeof r.details === 'object' &&
          (r.details as { missing?: boolean }).missing === true;
        if (!isMissing) answered += 1;
      }
      const percentage = maxScore === 0 ? 0 : totalScore / maxScore;
      const summary: GraduatorSummary = {
        total: parsedQuiz.questions.length,
        answered,
        correctCount,
        totalScore,
        maxScore,
        percentage,
      };
      if (passThreshold !== undefined) {
        summary.passed = percentage >= passThreshold;
      }
      return { results, summary };
    },
  };
}
