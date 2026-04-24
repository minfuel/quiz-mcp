import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RunnerHost } from "./runner-host.js";

const inputSchema = z.object({});
const outputSchema = z.object({ wasRunning: z.boolean() });

export const stopRunnerConfig = {
  title: "Stop Runner",
  description:
    "Forcibly shuts down the HTTP runner-api server. Use this to explicitly " +
    "end a quiz session before all quizzes are finished and read. No-op if " +
    "the runner is already stopped.",
  inputSchema,
  outputSchema,
  annotations: { idempotentHint: true },
} as const;

export function makeStopRunnerHandler(host: Pick<RunnerHost, "stop">) {
  return async (): Promise<CallToolResult> => {
    const wasRunning = await host.stop();
    return {
      content: [
        { type: "text" as const, text: `Runner stopped (wasRunning=${wasRunning})` },
      ],
      structuredContent: { wasRunning },
    };
  };
}

export function registerStopRunner(server: McpServer, host: RunnerHost): void {
  server.registerTool("stop_runner", stopRunnerConfig, makeStopRunnerHandler(host));
}
