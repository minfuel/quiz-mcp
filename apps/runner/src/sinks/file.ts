import { writeFile } from "node:fs/promises";
import type { AnswersReport } from "@quiz-mcp/runner-api";

export async function writeReportFile(path: string, report: AnswersReport): Promise<void> {
  await writeFile(path, JSON.stringify(report, null, 2) + "\n", "utf8");
}
