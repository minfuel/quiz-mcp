import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createQuizMcpServer } from "@quiz-mcp/mcp";
import { createInMemoryQuizService } from "@quiz-mcp/runner-api/in-memory";
import { createRunnerServer } from "@quiz-mcp/runner-api/server";
import { HostedService } from "./hosted-service.js";
import { RunnerHost } from "./runner-host.js";
import { registerStopRunner } from "./stop-runner-tool.js";
import { resolveBundledUiDir } from "./ui-assets.js";

export async function runMcpStdio(): Promise<void> {
  const inner = createInMemoryQuizService([]);
  const uiAssetsDir = resolveBundledUiDir();
  const host = new RunnerHost(() => createRunnerServer({ service: inner, uiAssetsDir }));
  const hosted = new HostedService(inner, host);

  const server = createQuizMcpServer(hosted, () => host.url);
  registerStopRunner(server, host);

  const shutdown = async (): Promise<void> => {
    await host.stop();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  process.stdin.once("close", shutdown);

  await server.connect(new StdioServerTransport());
}
