import { QuizSchema } from '@quiz-mcp/core';
import { zodToJsonSchema } from 'zod-to-json-schema';

const JSON_SCHEMA_DRAFT = 'http://json-schema.org/draft-07/schema#';
const SCHEMA_ID = 'https://raw.githubusercontent.com/karerckor/quiz-mcp/main/schema/quiz.schema.json';

// Reused sub-schemas (BaseQuestionFields, Option, Attachment) get factored
// into `definitions` via positional `$ref`s like `#/.../anyOf/0/properties/...`.
// Reordering types in `QuestionSchema`'s discriminated union changes those refs
// silently. Always run `pnpm schema:gen` after touching questions/index.ts so
// external consumers of the JSON Schema pick up the new structure.
export function buildQuizJsonSchema(): Record<string, unknown> {
  const generated = zodToJsonSchema(QuizSchema, {
    name: 'Quiz',
    target: 'jsonSchema7',
    $refStrategy: 'root',
  });

  return {
    $schema: JSON_SCHEMA_DRAFT,
    $id: SCHEMA_ID,
    title: 'Quiz',
    ...generated,
  };
}
