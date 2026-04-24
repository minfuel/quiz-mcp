import { z } from "zod";
import {
  AnswerSchema,
  FileKindSchema,
  FillGapsPartSchema,
  IdSchema,
  type Question,
  type Quiz,
} from "@quiz-mcp/core";
import type { QuizState } from "./service.js";

const CompactOptionSchema = z.object({
  id: IdSchema,
  label: z.string(),
});

const CompactMatchOptionSchema = z.object({
  id: IdSchema,
  text: z.string().optional(),
});

const CompactSortItemSchema = z.object({
  id: IdSchema,
  text: z.string().optional(),
});

const CompactBaseFields = {
  id: IdSchema,
  title: z.string().optional(),
  text: z.string(),
} as const;

export const CompactQuestionSchema = z.discriminatedUnion("_kind", [
  z.object({ _kind: z.literal("single_choice"), ...CompactBaseFields, options: z.array(CompactOptionSchema) }),
  z.object({ _kind: z.literal("multiple_choice"), ...CompactBaseFields, options: z.array(CompactOptionSchema) }),
  z.object({ _kind: z.literal("dropdown"), ...CompactBaseFields, options: z.array(CompactOptionSchema) }),
  z.object({ _kind: z.literal("short_text"), ...CompactBaseFields }),
  z.object({ _kind: z.literal("long_text"), ...CompactBaseFields }),
  z.object({ _kind: z.literal("fill_gaps"), ...CompactBaseFields, parts: z.array(FillGapsPartSchema) }),
  z.object({
    _kind: z.literal("match"),
    ...CompactBaseFields,
    pairs: z.tuple([z.array(CompactMatchOptionSchema), z.array(CompactMatchOptionSchema)]),
  }),
  z.object({
    _kind: z.literal("scale"),
    ...CompactBaseFields,
    min: z.number(),
    max: z.number(),
    step: z.number(),
  }),
  z.object({ _kind: z.literal("sorting"), ...CompactBaseFields, items: z.array(CompactSortItemSchema) }),
  z.object({
    _kind: z.literal("upload"),
    ...CompactBaseFields,
    accept: z.array(FileKindSchema).min(1),
  }),
]);

export type CompactQuestion = z.infer<typeof CompactQuestionSchema>;

export const AnswersReportSchema = z.object({
  quizId: IdSchema,
  title: z.string(),
  finished: z.boolean(),
  items: z.array(
    z.object({
      question: CompactQuestionSchema,
      answer: AnswerSchema.nullable(),
    }),
  ),
});

export type AnswersReport = z.infer<typeof AnswersReportSchema>;

function toCompactQuestion(q: Question): CompactQuestion {
  switch (q._kind) {
    case "single_choice":
    case "multiple_choice":
    case "dropdown":
      return {
        _kind: q._kind,
        id: q.id,
        title: q.title,
        text: q.text,
        options: q.options.map(({ id, label }) => ({ id, label })),
      };
    case "short_text":
    case "long_text":
      return { _kind: q._kind, id: q.id, title: q.title, text: q.text };
    case "fill_gaps":
      return { _kind: q._kind, id: q.id, title: q.title, text: q.text, parts: q.parts };
    case "match":
      return {
        _kind: q._kind,
        id: q.id,
        title: q.title,
        text: q.text,
        pairs: [
          q.pairs[0].map(({ id, text }) => ({ id, text })),
          q.pairs[1].map(({ id, text }) => ({ id, text })),
        ],
      };
    case "scale":
      return {
        _kind: q._kind,
        id: q.id,
        title: q.title,
        text: q.text,
        min: q.min,
        max: q.max,
        step: q.step,
      };
    case "sorting":
      return {
        _kind: q._kind,
        id: q.id,
        title: q.title,
        text: q.text,
        items: q.items.map(({ id, text }) => ({ id, text })),
      };
    case "upload":
      return {
        _kind: q._kind,
        id: q.id,
        title: q.title,
        text: q.text,
        accept: q.accept,
      };
  }
}

export function toAnswersReport(quiz: Quiz, state: QuizState): AnswersReport {
  return {
    quizId: quiz.id,
    title: quiz.title,
    finished: state.finished,
    items: quiz.questions.map((q) => ({
      question: toCompactQuestion(q),
      answer: state.answers[q.id] ?? null,
    })),
  };
}
