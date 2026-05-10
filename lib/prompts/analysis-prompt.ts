import type { AnalysisRequest, EvidenceSource } from "@/lib/types";

function toEvidenceText(sources: EvidenceSource[]) {
  return sources
    .map(
      (source) =>
        `- ${source.name} (${source.owner})\n  URL: ${source.url}\n  Note: ${source.note}`
    )
    .join("\n");
}

export function createAnalysisPrompt(request: AnalysisRequest, sources: EvidenceSource[]) {
  return `あなたは日本語の気候変動報道を検証する編集支援アシスタントです。
以下の入力を読み、検証対象主張・リスク・根拠確認ポイント・編集メモを作成してください。

【入力】
- タイトル: ${request.title || "無題"}
- 媒体種別: ${request.mediaType}
- トピック: ${request.topic}
- 本文:
${request.body}

【参照候補ソース】
${toEvidenceText(sources)}

【出力方針】
- claims: 文脈上検証価値の高い主張を重複なく最大5件
- risks: 以下を優先観点として判定
  1) 断定が強い
  2) 気象と気候の混同
  3) 根拠不足
  4) 政策的主張と科学的事実の混在
- evidenceFocus: 次に確認すべき根拠観点を短文で3〜6件
- memo: 編集者がそのまま使える実務メモ（断定回避・表現緩和を含む）

必ず本文内容を根拠にし、推測を断定しないでください。`;
}
