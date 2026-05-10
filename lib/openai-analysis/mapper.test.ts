import { describe, expect, it } from "vitest";
import { mapToAnalysisResult } from "./mapper";
import type { AnalysisRequest } from "../types";

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
