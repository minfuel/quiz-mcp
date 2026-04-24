import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { QuizSchema } from '@quiz-mcp/core';
import { buildQuizJsonSchema } from './_build-quiz-schema.mjs';

const SCHEMA_PATH = 'schema/quiz.schema.json';
const FIXTURE_PATH = 'scripts/fixtures/sample-quiz.json';
const DIFF_CONTEXT_LINES = 30;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function checkFreshness(): string {
  const expected = JSON.stringify(buildQuizJsonSchema(), null, 2) + '\n';
  let actual: string;
  try {
    actual = readFileSync(SCHEMA_PATH, 'utf8');
  } catch {
    fail(`${SCHEMA_PATH} is missing — run \`pnpm schema:gen\` and commit.`);
  }
  if (actual !== expected) {
    const expectedLines = expected.split('\n');
    const actualLines = actual.split('\n');
    const max = Math.max(expectedLines.length, actualLines.length);
    let shown = 0;
    console.error(`${SCHEMA_PATH} differs from freshly generated output:`);
    for (let i = 0; i < max && shown < DIFF_CONTEXT_LINES; i++) {
      if (expectedLines[i] !== actualLines[i]) {
        console.error(`  line ${i + 1}:`);
        console.error(`    - ${actualLines[i] ?? '<EOF>'}`);
        console.error(`    + ${expectedLines[i] ?? '<EOF>'}`);
        shown++;
      }
    }
    fail(`\nquiz.schema.json is stale — run \`pnpm schema:gen\` and commit.`);
  }
  return actual;
}

function checkRoundTrip(schemaText: string): void {
  const sample = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));

  try {
    QuizSchema.parse(sample);
  } catch (err) {
    fail(`Fixture ${FIXTURE_PATH} failed Zod validation:\n${String(err)}`);
  }

  const ajv = new Ajv({ strict: false });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(schemaText));
  if (!validate(sample)) {
    fail(
      `Fixture ${FIXTURE_PATH} failed ajv validation against ${SCHEMA_PATH}:\n` +
        JSON.stringify(validate.errors, null, 2),
    );
  }
}

function main() {
  const schemaText = checkFreshness();
  checkRoundTrip(schemaText);
  console.log('schema OK: fresh + round-trip passed');
}

main();
