import type { AnswersReport } from "@quiz-mcp/runner-api";

export async function sendWebhook(url: string, report: AnswersReport): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!res.ok) {
    throw new Error(`webhook POST ${url} failed: ${res.status} ${res.statusText}`);
  }
}
