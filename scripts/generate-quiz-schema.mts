import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildQuizJsonSchema } from './_build-quiz-schema.mjs';

const OUTPUT_PATH = 'schema/quiz.schema.json';

function main() {
  const schema = buildQuizJsonSchema();
  const serialized = JSON.stringify(schema, null, 2) + '\n';
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, serialized);
  console.log(`Wrote ${OUTPUT_PATH} (${serialized.length} bytes)`);
}

main();
