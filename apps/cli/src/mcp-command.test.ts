import { afterEach, describe, expect, it } from "vitest";
import type { Quiz } from "@quiz-mcp/core";
import { createInMemoryQuizService } from "@quiz-mcp/runner-api/in-memory";
import { createRunnerServer } from "@quiz-mcp/runner-api/server";
import { HostedService } from "./hosted-service.js";
import { RunnerHost } from "./runner-host.js";

const TEST_QUIZ: Quiz = {
  id: "test-quiz-1",
  title: "Integration",
  questions: [],
};

describe("mcp-command integration: HostedService + RunnerHost + createRunnerServer", () => {
  let host: RunnerHost;

  afterEach(async () => {
    if (host && host.isRunning()) await host.stop();
  });

  it("registers a quiz via HostedService, serves it over HTTP, auto-stops when finished+read", async () => {
    const inner = createInMemoryQuizService([]);
    host = new RunnerHost(() => createRunnerServer({ service: inner }));
    const hosted = new HostedService(inner, host);

    await hosted.registerQuiz(TEST_QUIZ);
    expect(host.isRunning()).toBe(true);

    const quizRes = await fetch(`${host.url}/${TEST_QUIZ.id}/quiz.json`);
    expect(quizRes.status).toBe(200);
    expect(await quizRes.json()).toEqual(TEST_QUIZ);

    const finishRes = await fetch(`${host.url}/${TEST_QUIZ.id}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: {} }),
    });
    expect(finishRes.status).toBe(204);

    const state = await hosted.getState(TEST_QUIZ.id);
    expect(state.finished).toBe(true);

    // Auto-stop is fire-and-forget; give it a tick.
    await new Promise((r) => setTimeout(r, 50));
    expect(host.isRunning()).toBe(false);
  });
});
