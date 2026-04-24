import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import { QuizSchema, type Quiz } from "@quiz-mcp/core";
import type { QuizSource } from "./args.js";

async function readAll(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function fetchRaw(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`failed to fetch quiz from ${url}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

async function getRaw(source: QuizSource, stdin: Readable): Promise<string> {
  switch (source.kind) {
    case "url":   return fetchRaw(source.url);
    case "file":  return readFile(source.path, "utf8");
    case "json":  return source.raw;
    case "stdin": return readAll(stdin);
  }
}

export async function loadQuiz(source: QuizSource, stdin: Readable): Promise<Quiz> {
  const raw = await getRaw(source, stdin);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`invalid JSON: ${(err as Error).message}`);
  }

  const result = QuizSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(`invalid quiz: ${issues}`);
  }
  return result.data;
}
