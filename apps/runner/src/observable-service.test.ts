import { describe, expect, it, vi } from "vitest";
import type { Quiz } from "@quiz-mcp/core";
import { createInMemoryQuizService } from "@quiz-mcp/runner-api/in-memory";
import { withFinishHook } from "./observable-service.js";

const QUIZ: Quiz = {
  id: "q1",
  title: "T",
  questions: [
    { _kind: "short_text", id: "s1", text: "Name?", required: false },
  ],
};

const flush = () => new Promise((r) => setImmediate(r));

describe("withFinishHook", () => {
  it("fires hook after finishQuiz with quiz and final state", async () => {
    const inner = createInMemoryQuizService([QUIZ]);
    const onFinish = vi.fn().mockResolvedValue(undefined);
    const service = withFinishHook(inner, onFinish);

    await service.finishQuiz("q1", {
      s1: { _kind: "short_text", questionId: "s1", text: "Ada" },
    });
    await flush();

    expect(onFinish).toHaveBeenCalledTimes(1);
    const ctx = onFinish.mock.calls[0]![0];
    expect(ctx.quizId).toBe("q1");
    expect(ctx.quiz).toEqual(QUIZ);
    expect(ctx.state.finished).toBe(true);
    expect(ctx.state.answers.s1).toEqual({
      _kind: "short_text",
      questionId: "s1",
      text: "Ada",
    });
  });

  it("does not fire hook on saveAnswer", async () => {
    const inner = createInMemoryQuizService([QUIZ]);
    const onFinish = vi.fn().mockResolvedValue(undefined);
    const service = withFinishHook(inner, onFinish);

    await service.saveAnswer("q1", {
      _kind: "short_text",
      questionId: "s1",
      text: "Ada",
    });
    await flush();

    expect(onFinish).not.toHaveBeenCalled();
  });

  it("swallows hook rejections so the service stays usable", async () => {
    const inner = createInMemoryQuizService([QUIZ]);
    const onFinish = vi.fn().mockRejectedValue(new Error("sink blew up"));
    const service = withFinishHook(inner, onFinish);

    await expect(
      service.finishQuiz("q1", {
        s1: { _kind: "short_text", questionId: "s1", text: "Ada" },
      }),
    ).resolves.toBeUndefined();
    await flush();

    expect(onFinish).toHaveBeenCalled();
    // service still responsive
    const state = await service.getState("q1");
    expect(state.finished).toBe(true);
  });
});
