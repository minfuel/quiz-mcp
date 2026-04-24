# @quiz-mcp/core

The foundation of the `quiz-mcp` monorepo: types, Zod schemas, and pure domain logic for quizzes. The package knows nothing about UI, transport, or storage — only the data model, validation, and grading.

It is consumed by all other packages (`runner-api`, `runner-ui`, `ui`, `web-components`, `mcp`) as the single source of truth for the quiz format.

## Installation

The package is private and consumed as a workspace dependency:

```jsonc
// package.json
{
  "dependencies": {
    "@quiz-mcp/core": "workspace:^"
  }
}
```

ESM-only (`"type": "module"`). The only runtime dependency is `zod` v3.

## Architecture: three parallel unions

The domain is built around three discriminated unions linked by the `_kind` field:

| Union        | What it describes                                   | Location         |
| ------------ | --------------------------------------------------- | ---------------- |
| `Question`   | The question itself: text, parameters, options      | `questions/`     |
| `Answer`     | The user's answer                                   | `answers/`       |
| `AnswerKey`  | The key (correct answer) — stored separately        | `grading/`       |

Supported types (`_kind`):

`single_choice`, `multiple_choice`, `short_text`, `long_text`, `dropdown`, `fill_gaps`, `match`, `scale`, `sorting`, `upload`.

Keeping `Question` and `AnswerKey` separate makes it possible to publish a quiz to a client without leaking the correct answers: keys stay on the server and are only used for grading.

## Export entry points

The package exposes three subpath exports:

```ts
import { QuizSchema, QuestionSchema, AnswerSchema } from '@quiz-mcp/core';
import { grade, createGraduator, AnswerKeySchema } from '@quiz-mcp/core/grading';
import { validateAnswer, validateQuiz, extractIssues } from '@quiz-mcp/core/validation';
```

- `@quiz-mcp/core` — domain schemas and types (`Quiz`, `Question`, `Answer`, attachments, utilities).
- `@quiz-mcp/core/grading` — answer keys, the `grade` function, the `createGraduator` factory.
- `@quiz-mcp/core/validation` — building per-question Zod schemas, `Issue` codes for UI.

## Quiz: the root entity

```ts
import { QuizSchema, type Quiz } from '@quiz-mcp/core';

const quiz: Quiz = QuizSchema.parse({
  id: 'quiz-1',
  title: 'JavaScript basics',
  description: 'Warm-up quiz',
  questions: [/* … */],
});
```

Question fields from `BaseQuestionFields`: `id`, `text`, `title?`, `required` (default `false`), `score?` (weight in the total score), `attachments?` (2D array — rows/columns of attachments).

## Grading

### Single call: `grade`

```ts
import { grade } from '@quiz-mcp/core/grading';

const result = grade({ question, answer, key });
// → { questionId, correct, score: 0..1, details? }
```

`grade` requires `question._kind === answer._kind === key._kind` — otherwise it throws. Dispatch is fully exhaustive: adding a new question type forces you to extend the `switch`, or TypeScript won't compile.

### Batch: `createGraduator`

For grading an entire quiz with a report, use the factory:

```ts
import { createGraduator } from '@quiz-mcp/core/grading';

const graduator = createGraduator(quiz, keys, { passThreshold: 0.7 });

// Single answer
const single = graduator.grade(answer);

// Whole quiz
const { results, summary } = graduator.gradeQuiz(answers);
// summary: { total, answered, correctCount, totalScore, maxScore, percentage, passed? }
```

`keys` is a `Record<questionId, KeyBody>`, where `KeyBody` is the key body without `_kind` and `questionId` (the factory injects them). The factory:

- validates the `quiz` itself via `QuizSchema`;
- requires a key for every question and rejects extra keys;
- rejects duplicate `questionId`s;
- validates each key against its Zod schema at construction time;
- guards against duplicate and unknown `answer.questionId` in `gradeQuiz`;
- weights each question's score by `question.score ?? 1` in the total;
- marks unanswered questions with `details.missing = true`.

Example `keys` shape:

```ts
const keys = {
  'q1': { correctOptionId: 'opt-b' },              // single_choice
  'q2': { correctOptionIds: ['opt-a', 'opt-c'] },  // multiple_choice
  // …
};
```

## Answer validation

Validation covers not only the shape of an answer but also the business rules of a specific question (`required`, `min/max` selections, gap completeness, etc.). The Zod schema is built dynamically from the question object:

```ts
import { buildAnswerSchema, validateAnswer, validateQuiz, extractIssues } from '@quiz-mcp/core/validation';

// A Zod schema bound to a specific question
const schema = buildAnswerSchema(question);

// Single answer, with required/empty handling
const result = validateAnswer(question, maybeAnswer);
if (!result.success) {
  const issues = extractIssues(result); // Issue[] with structured codes
}

// Validate every answer in a quiz at once
const report = validateQuiz(quiz, answersById);
// { ok, byQuestion: { [questionId]: SafeParseReturnType } }
```

### Issue codes

Instead of string messages, validation returns structured codes suitable for UI localization:

```
required, min_length, max_length, min_selections, max_selections,
out_of_range, invalid_option, invalid_selection, incomplete_pairs,
upload_missing, max_files, file_too_large, invalid_file_type
```

Internally they are encoded into `z.ZodIssueCode.custom` with a `quiz-issue:` prefix so they flow through the standard Zod interface, and they are unpacked on the client side via `extractIssues()`.

## Utilities

- `newId()` — generates a UUID v4 via `crypto.randomUUID()`.
- `IdSchema` — a non-empty string identifier.
- `AttachmentSchema` — a union of `FileAttachment` (video/audio/image/file) and `CodeAttachment`.

## Scripts

```bash
pnpm --filter @quiz-mcp/core build       # tsc → dist/
pnpm --filter @quiz-mcp/core dev         # tsc --watch
pnpm --filter @quiz-mcp/core test        # vitest
pnpm --filter @quiz-mcp/core typecheck   # tsc --noEmit
pnpm --filter @quiz-mcp/core clean       # rm -rf dist *.tsbuildinfo
```

A JSON Schema for the root `Quiz` is generated from the Zod schemas at the monorepo level (`pnpm schema:gen` / `schema:check` at the root).

## Adding a new question type

1. Create schemas in `src/questions/<kind>.ts` (question), `src/answers/<kind>.ts` (answer), `src/grading/<kind>.ts` (key + grader), `src/validation/<kind>.ts` (build schema).
2. Add them to the `discriminatedUnion` in the four `index.ts` files (`questions`, `answers`, `grading`, `validation`).
3. Extend the `switch` in `grading/index.ts::grade`, `validation/index.ts::buildAnswerSchema`, and `grading/factory.ts::keySchemaFor`.

TypeScript's `const _exhaustive: never = …` in the `default` branches guarantees that missing any of those sites is caught at compile time.
