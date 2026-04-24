#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { newId, QuizSchema } from "@quiz-mcp/core";
import { runMcpStdio } from "./mcp-command.js";

const SCHEMA_URL =
  "https://raw.githubusercontent.com/karerckor/quiz-mcp/main/schema/quiz.schema.json";

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "quiz";
}

const program = new Command();
program.name("quiz-mcp").description("Quiz MCP CLI").version("0.0.0");

program
  .command("mcp", { isDefault: true })
  .description(
    "Run the MCP server over stdio (lazy-starts runner-api on first start_quiz)",
  )
  .action(async () => {
    await runMcpStdio();
  });

program
  .command("create")
  .description("Scaffold a new quiz JSON file")
  .argument("<title>", "Quiz title")
  .argument("[output]", "Output path (defaults to <slug>.quiz.json)")
  .option("-f, --force", "Overwrite the output file if it already exists", false)
  .action(
    (
      title: string,
      output: string | undefined,
      opts: { force: boolean },
    ) => {
      const quiz = QuizSchema.parse({ id: newId(), title, questions: [] });
      const target = resolve(output ?? `${slugify(title)}.quiz.json`);
      if (existsSync(target) && !opts.force) {
        console.error(
          `refusing to overwrite ${target} (pass --force to replace it)`,
        );
        process.exit(1);
      }
      const payload = { $schema: SCHEMA_URL, ...quiz };
      writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
      console.error(`wrote ${target}`);
    },
  );

program.parse();
