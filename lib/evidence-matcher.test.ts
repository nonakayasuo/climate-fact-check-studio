import { describe, expect, it } from "vitest";
import { matchEvidenceForClaim, tokenize } from "./evidence-matcher";
import type { EvidenceSource } from "./types";

const seed: EvidenceSource[] = [
  {
    name: "気象庁 観測データ",
    owner: "気象庁",
    themes: ["猛暑"],
    note: "猛暑日の観測値と長期トレンドを整理した一次情報。",
    url: "https://www.data.jma.go.jp/cpdinfo/ccj/index.html"
  },
  {
    name: "再エネ普及白書",
    owner: "経済産業省",
    themes: ["再エネ"],
    note: "電源構成と再エネ比率の推移、政策措置の年次まとめ。",
    url: "https://example.go.jp/renewable"
  }
];

const candidates = seed.map((source, index) => ({ source, sourceId: `seed:${index}` }));

describe("tokenize", () => {
  it("removes stop words and short tokens", () => {
    const tokens = tokenize("今年の猛暑は地球温暖化が原因です");
    expect(tokens).toContain("猛暑");
    expect(tokens).toContain("地球温暖化");
  });
});

describe("matchEvidenceForClaim", () => {
  it("returns sources sorted by score with theme bonus", () => {
    const matches = matchEvidenceForClaim(
      "今年の猛暑日は観測史上最多になった",
      "猛暑",
      candidates
    );
    expect(matches[0]?.source.name).toBe("気象庁 観測データ");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("returns empty array when no candidate scores above zero", () => {
    const matches = matchEvidenceForClaim(
      "完全に無関係な文字列",
      "原発",
      candidates
    );
    expect(matches).toEqual([]);
  });
});
