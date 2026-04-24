import { describe, expect, it } from "vitest";
import type { Answer, Quiz } from "@quiz-mcp/core";
import { toAnswersReport, AnswersReportSchema } from "./report.js";
import type { QuizState } from "./service.js";

const SHORT_TEXT_QUIZ: Quiz = {
  id: "q1",
  title: "T",
  questions: [
    { _kind: "short_text", id: "s1", text: "Name?", required: false },
  ],
};

describe("toAnswersReport", () => {
  it("reports an empty unfinished quiz", () => {
    const quiz: Quiz = { id: "q0", title: "Empty", questions: [] };
    const state: QuizState = { finished: false, answers: {} };

    expect(toAnswersReport(quiz, state)).toEqual({
      quizId: "q0",
      title: "Empty",
      finished: false,
      items: [],
    });
  });

  it("pairs each question with its answer and fills null for unanswered", () => {
    const answers: Record<string, Answer> = {
      s1: { _kind: "short_text", questionId: "s1", text: "Ada" },
    };
    const state: QuizState = { finished: true, answers };

    const report = toAnswersReport(SHORT_TEXT_QUIZ, state);

    expect(report).toEqual({
      quizId: "q1",
      title: "T",
      finished: true,
      items: [
        {
          question: { _kind: "short_text", id: "s1", text: "Name?" },
          answer: answers.s1,
        },
      ],
    });
  });

  it("drops UI-only fields from single_choice questions", () => {
    const quiz: Quiz = {
      id: "q2",
      title: "SC",
      questions: [
        {
          _kind: "single_choice",
          id: "sc",
          title: "Pick one",
          text: "Pick:",
          required: true,
          score: 1,
          mode: "list",
          options: [
            { id: "opt-a", label: "A" },
            { id: "opt-b", label: "B" },
          ],
        },
      ],
    };
    const report = toAnswersReport(quiz, { finished: false, answers: {} });

    expect(report.items[0]!.question).toEqual({
      _kind: "single_choice",
      id: "sc",
      title: "Pick one",
      text: "Pick:",
      options: [
        { id: "opt-a", label: "A" },
        { id: "opt-b", label: "B" },
      ],
    });
    expect(report.items[0]!.question).not.toHaveProperty("mode");
    expect(report.items[0]!.question).not.toHaveProperty("required");
    expect(report.items[0]!.question).not.toHaveProperty("score");
    expect(report.items[0]!.answer).toBeNull();
  });

  it("produced output parses with AnswersReportSchema", () => {
    const answers: Record<string, Answer> = {
      s1: { _kind: "short_text", questionId: "s1", text: "Ada" },
    };
    const report = toAnswersReport(SHORT_TEXT_QUIZ, {
      finished: true,
      answers,
    });

    const parsed = AnswersReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
  });
});
