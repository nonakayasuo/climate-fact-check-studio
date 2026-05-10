import type {
  AnalysisRequest,
  AnalysisResult,
  ClaimEvidenceLink,
  EvidenceSource,
  GapAlert,
  Risk,
  StructuredAnalysisOutput
} from "@/lib/types";

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

  const sourceText = sources.length
    ? sources.map((source) => `- ${source.owner}: ${source.name}`).join("\n")
    : "- 関連根拠候補なし";

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

export function appendEvidenceSummaryToMemo(
  baseMemo: string,
  links: ClaimEvidenceLink[],
  alerts: GapAlert[]
): string {
  const lines: string[] = [baseMemo.trimEnd()];

  if (links.length) {
    const grouped = groupLinksByClaim(links);
    lines.push("", "主張別出典:");
    for (const [claimText, claimLinks] of grouped) {
      lines.push(`- ${claimText}`);
      for (const link of claimLinks) {
        const citation = link.citations[0];
        const citationNote = citation
          ? `（${citation.estimated ? "推定" : "確度"}${citation.confidence}: ${citation.text}）`
          : "";
        lines.push(`  - ${link.sourceOwner} / ${link.sourceTitle}${citationNote}`);
      }
    }
  }

  if (alerts.length) {
    lines.push("", "根拠不足アラート:");
    for (const alert of alerts) {
      lines.push(`- [${alert.severity}] ${alert.claimText} → ${alert.guidance}`);
    }
  }

  return lines.join("\n");
}

function groupLinksByClaim(links: ClaimEvidenceLink[]): Map<string, ClaimEvidenceLink[]> {
  const map = new Map<string, ClaimEvidenceLink[]>();
  for (const link of links) {
    const bucket = map.get(link.claimText) ?? [];
    bucket.push(link);
    map.set(link.claimText, bucket);
  }
  return map;
}
