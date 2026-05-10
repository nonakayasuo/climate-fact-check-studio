import type { ResearchLog } from "@/lib/types";

const headers: Array<keyof ResearchLog> = [
  "timestamp",
  "title",
  "media_type",
  "topic",
  "input_text",
  "claims",
  "ai_memo",
  "sources",
  "risks",
  "human_rating_accuracy",
  "human_rating_usefulness",
  "human_rating_trust",
  "human_revision",
  "revision_reason"
];

export function logsToCsv(logs: ResearchLog[]) {
  const rows = logs.map((log) =>
    headers.map((key) => csvCell(Array.isArray(log[key]) ? log[key].join("; ") : log[key]))
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function csvCell(value: unknown = "") {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}
