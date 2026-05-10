import type { StructuredAnalysisOutput } from "@/lib/types";

export const structuredAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["claims", "risks", "evidenceFocus", "memo"],
  properties: {
    claims: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 5
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "reason", "suggestion"],
        properties: {
          label: { type: "string" },
          reason: { type: "string" },
          suggestion: { type: "string" }
        }
      }
    },
    evidenceFocus: {
      type: "array",
      items: { type: "string" }
    },
    memo: { type: "string" }
  }
} as const;

function isRisk(value: unknown): value is StructuredAnalysisOutput["risks"][number] {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.label === "string" &&
    typeof candidate.reason === "string" &&
    typeof candidate.suggestion === "string"
  );
}

export function parseStructuredOutput(input: unknown): StructuredAnalysisOutput | null {
  if (typeof input !== "object" || input === null) return null;
  const candidate = input as Record<string, unknown>;

  if (!Array.isArray(candidate.claims) || !Array.isArray(candidate.risks) || !Array.isArray(candidate.evidenceFocus)) {
    return null;
  }
  if (typeof candidate.memo !== "string") return null;

  const claims = candidate.claims.filter((item): item is string => typeof item === "string").slice(0, 5);
  const risks = candidate.risks.filter(isRisk);
  const evidenceFocus = candidate.evidenceFocus.filter((item): item is string => typeof item === "string");

  return {
    claims,
    risks,
    evidenceFocus,
    memo: candidate.memo
  };
}
