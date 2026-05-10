import { describe, expect, it } from "vitest";
import { appendEvidenceSummaryToMemo, mapToAnalysisResult } from "./mapper";
import type { AnalysisRequest, ClaimEvidenceLink, GapAlert } from "../types";

const request: AnalysisRequest = {
  title: "テスト",
  mediaType: "Web記事",
  topic: "猛暑",
  body: "本文"
};

describe("mapToAnalysisResult", () => {
  it("deduplicates claims and maps risks", () => {
    const result = mapToAnalysisResult(
      request,
      {
        claims: ["同じ主張", "同じ主張", "別主張"],
        risks: [{ label: "根拠不足", reason: "出典なし", suggestion: "出典追加" }],
        evidenceFocus: ["IPCCを確認"],
        memo: "編集メモ"
      },
      []
    );

    expect(result.claims).toEqual(["同じ主張", "別主張"]);
    expect(result.risks[0]).toEqual({
      label: "根拠不足",
      suggestion: "出典なし 出典追加"
    });
    expect(result.memo).toContain("最終的な編集判断は人間が行ってください");
  });
});

describe("appendEvidenceSummaryToMemo", () => {
  const link: ClaimEvidenceLink = {
    claimId: "claim-1",
    claimText: "猛暑日が増えている",
    sourceId: "registry:abc",
    sourceTitle: "気象庁観測データ",
    sourceOwner: "気象庁",
    sourceUrl: "https://example.org",
    score: 4,
    citations: [{ text: "観測値の推移", confidence: 0.6, estimated: false }]
  };

  const alert: GapAlert = {
    claimId: "claim-2",
    claimText: "断定的な主張",
    severity: "high",
    priority: 3,
    reason: "no_source",
    guidance: "追加取材を検討してください。"
  };

  it("includes claim-source mapping and gap alert sections", () => {
    const memo = appendEvidenceSummaryToMemo("ベースメモ", [link], [alert]);
    expect(memo).toContain("主張別出典:");
    expect(memo).toContain("気象庁観測データ");
    expect(memo).toContain("根拠不足アラート:");
    expect(memo).toContain("[high]");
  });

  it("returns base memo when there are no links and alerts", () => {
    const memo = appendEvidenceSummaryToMemo("ベースのみ", [], []);
    expect(memo).toBe("ベースのみ");
  });
});
