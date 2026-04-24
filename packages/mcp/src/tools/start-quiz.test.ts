import { describe, expect, it, vi } from "vitest";
import type { Answer, Quiz } from "@quiz-mcp/core";
import type { QuizService, QuizState } from "@quiz-mcp/runner-api";
import { makeStartQuizHandler } from "./start-quiz.js";

const QUIZ: Quiz = {
  id: "q1",
  title: "T",
  questions: [],
};

function fakeService() {
  const quizzes = new Map<string, Quiz>();
  const states = new Map<string, QuizState>();
  const service: QuizService = {
    async registerQuiz(q) {
      quizzes.set(q.id, q);
      states.delete(q.id);
    },
    async quizExists(id) { return quizzes.has(id); },
    async getQuiz(id) {
      const q = quizzes.get(id);
      if (!q) throw new Error(`not found: ${id}`);
      return q;
    },
    async saveAnswer() {},
    async finishQuiz(id, answers) { states.set(id, { finished: true, answers }); },
    async getState(id) { return states.get(id) ?? { finished: false, answers: {} as Record<string, Answer> }; },
  };
  return { service, quizzes, states };
}

describe("start_quiz handler", () => {
  it("registers the quiz and opens the browser when open=true", async () => {
    const { service, quizzes } = fakeService();
    const openBrowser = vi.fn().mockResolvedValue(undefined);

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser,
    });

    const result = await handler({ quiz: QUIZ, open: true });

    expect(quizzes.get("q1")).toEqual(QUIZ);
    expect(openBrowser).toHaveBeenCalledTimes(1);
    expect(openBrowser).toHaveBeenCalledWith("http://localhost:3000/q1");
    expect(result.structuredContent).toEqual({
      quizId: "q1",
      url: "http://localhost:3000/q1",
      opened: true,
    });
    expect(result.isError).toBeUndefined();
  });

  it("does not open the browser when open=false", async () => {
    const { service } = fakeService();
    const openBrowser = vi.fn();

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser,
    });

    const result = await handler({ quiz: QUIZ, open: false });

    expect(openBrowser).not.toHaveBeenCalled();
    expect(result.structuredContent).toMatchObject({ opened: false });
  });

  it("records opened=false when openBrowser throws and still succeeds", async () => {
    const { service } = fakeService();
    const openBrowser = vi.fn().mockRejectedValue(new Error("no browser"));

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser,
    });

    const result = await handler({ quiz: QUIZ, open: true });

    expect(openBrowser).toHaveBeenCalledTimes(1);
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({ opened: false });
  });

  it("trims trailing slash from serverUrl", async () => {
    const { service } = fakeService();
    const openBrowser = vi.fn().mockResolvedValue(undefined);

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000/",
      openBrowser,
    });

    const result = await handler({ quiz: QUIZ, open: true });

    expect(openBrowser).toHaveBeenCalledWith("http://localhost:3000/q1");
    expect(result.structuredContent).toMatchObject({
      url: "http://localhost:3000/q1",
    });
  });

  it("upserts a quiz with an existing id and clears state", async () => {
    const { service, quizzes, states } = fakeService();
    states.set("q1", { finished: true, answers: { x: { questionId: "x", _kind: "short_text", text: "old" } } });
    quizzes.set("q1", { ...QUIZ, title: "Old" });

    const handler = makeStartQuizHandler({
      service,
      serverUrl: "http://localhost:3000",
      openBrowser: vi.fn().mockResolvedValue(undefined),
    });

    await handler({ quiz: { ...QUIZ, title: "New" }, open: false });

    expect(quizzes.get("q1")?.title).toBe("New");
    expect(states.has("q1")).toBe(false);
  });

  it("resolves serverUrl from a function on each invocation", async () => {
    const { service } = fakeService();
    const openBrowser = vi.fn().mockResolvedValue(undefined);
    const resolver = vi.fn().mockReturnValue("http://resolved.example");

    const handler = makeStartQuizHandler({
      service,
      serverUrl: resolver,
      openBrowser,
    });

    await handler({ quiz: QUIZ, open: true });
    await handler({ quiz: QUIZ, open: true });

    expect(resolver).toHaveBeenCalledTimes(2);
    expect(openBrowser).toHaveBeenLastCalledWith("http://resolved.example/q1");
  });
});
