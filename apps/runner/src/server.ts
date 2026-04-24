import { createRunnerServer } from "@quiz-mcp/runner-api/server";
import { createInMemoryQuizService } from "@quiz-mcp/runner-api/in-memory";
import { MOCK_QUIZ } from "./mock-quiz.js";
import { resolveBundledUiDir } from "./ui-assets.js";

export default createRunnerServer({
  service: createInMemoryQuizService([MOCK_QUIZ]),
  config: { defaultQuizId: MOCK_QUIZ.id },
  uiAssetsDir: resolveBundledUiDir(),
});
