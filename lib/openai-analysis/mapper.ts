import type { AnalysisRequest, AnalysisResult, EvidenceSource, Risk, StructuredAnalysisOutput } from "@/lib/types";

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function mapRisks(risks: StructuredAnalysisOutput["risks"]): Risk[] {
  return risks.map((risk) => ({
    label: risk.label,
    suggestion: `${risk.reason} ${risk.suggestion}`.trim()
  }));
}

function mapMemo(output: StructuredAnalysisOutput, sources: EvidenceSource[]) {
  const focusText = output.evidenceFocus.length
    ? output.evidenceFocus.map((focus) => `- ${focus}`).join("\n")
    : "- 追加の根拠確認ポイントは提示されませんでした。";

  const sourceText = sources.map((source) => `- ${source.owner}: ${source.name}`).join("\n");

  return `${output.memo}\n\n根拠確認ポイント:\n${focusText}\n\n関連根拠候補:\n${sourceText}\n\n注記: 最終的な編集判断は人間が行ってください。`;
}

export function mapToAnalysisResult(
  request: AnalysisRequest,
  output: StructuredAnalysisOutput,
  sources: EvidenceSource[]
): AnalysisResult {
  const claims = uniqueStrings(output.claims).slice(0, 5);
  const risks = mapRisks(output.risks);
  const memo = mapMemo(output, sources);

  return {
    ...request,
    claims,
    risks,
    sources,
    memo
  };
}
