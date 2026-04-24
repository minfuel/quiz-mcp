import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { QuizService } from "@quiz-mcp/runner-api";
import { defaultOpenBrowser, type OpenBrowser } from "./open-browser.js";
import { registerGetQuizFormat } from "./tools/get-quiz-format.js";
import { registerStartQuiz } from "./tools/start-quiz.js";
import type { ServerUrlSource } from "./tools/start-quiz.js";
import { registerGetAnswers } from "./tools/get-answers.js";

export type { ServerUrlSource } from "./tools/start-quiz.js";

export type CreateQuizMcpServerDeps = {
  openBrowser?: OpenBrowser;
};

export function createQuizMcpServer(
  service: QuizService,
  serverUrl: ServerUrlSource,
  deps: CreateQuizMcpServerDeps = {},
): McpServer {
  const openBrowser = deps.openBrowser ?? defaultOpenBrowser;
  const server = new McpServer({ name: "quiz-mcp", version: "0.0.0" });

  registerGetQuizFormat(server);
  registerStartQuiz(server, { service, serverUrl, openBrowser });
  registerGetAnswers(server, service);

  return server;
}

export async function startMcpServer(
  service: QuizService,
  serverUrl: ServerUrlSource,
): Promise<void> {
  const server = createQuizMcpServer(service, serverUrl);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
