import { render } from "hono/jsx/dom";
import "@quiz-mcp/web-components";
import "./styles.css";
import { QuizHost } from "./quiz-host";

const mount = document.getElementById("quiz-host");
if (!(mount instanceof HTMLElement)) {
  throw new Error("runner-ui: missing #quiz-host mount point");
}

const quizId = mount.dataset.quizId;
if (!quizId) {
  throw new Error("runner-ui: #quiz-host is missing data-quiz-id");
}

const dataNode = document.getElementById("quiz-data");
if (!dataNode || !dataNode.textContent) {
  throw new Error("runner-ui: missing #quiz-data JSON payload");
}

const quiz = JSON.parse(dataNode.textContent);

render(<QuizHost quizId={quizId} quiz={quiz} />, mount);
