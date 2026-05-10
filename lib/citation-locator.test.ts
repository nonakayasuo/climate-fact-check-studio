import { describe, expect, it } from "vitest";
import { locateCitationCandidates, splitSentences } from "./citation-locator";
import type { EvidenceSource } from "./types";

const source: EvidenceSource = {
  name: "気象庁 観測データ",
  owner: "気象庁",
  themes: ["猛暑"],
  note: "猛暑日の観測値と長期トレンドを整理した一次情報。気象データは年次更新で公開される。",
  url: "https://www.data.jma.go.jp/cpdinfo/ccj/index.html"
};

describe("splitSentences", () => {
  it("splits on Japanese terminators", () => {
    const sentences = splitSentences("一文目です。二文目です！三文目？");
    expect(sentences).toHaveLength(3);
  });
});

describe("locateCitationCandidates", () => {
  it("returns estimated=true when overlap is weak", () => {
    const candidates = locateCitationCandidates("脱炭素政策の影響", source, []);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => candidate.estimated)).toBe(true);
  });

  it("returns higher confidence when claim shares vocabulary with source note", () => {
    const candidates = locateCitationCandidates(
      "猛暑日の観測値が更新された",
      source,
      ["猛暑日", "観測値"]
    );
    expect(candidates[0]).toBeDefined();
    expect(candidates[0]?.confidence).toBeGreaterThan(0);
  });
});
