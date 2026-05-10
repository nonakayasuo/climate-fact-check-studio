import type { EvidenceSource } from "@/lib/types";

export const evidenceSources: EvidenceSource[] = [
  {
    name: "IPCC AR6 Synthesis Report",
    owner: "IPCC",
    themes: ["猛暑", "豪雨", "気候政策"],
    note: "長期的な温暖化傾向、極端現象、適応・緩和策の根拠確認に使う。",
    url: "https://www.ipcc.ch/report/ar6/syr/"
  },
  {
    name: "日本の気候変動 2025",
    owner: "気象庁・文部科学省",
    themes: ["猛暑", "豪雨"],
    note: "日本国内の観測データ、将来予測、極端気象の説明に向く。",
    url: "https://www.data.jma.go.jp/cpdinfo/ccj/index.html"
  },
  {
    name: "気候変動影響評価報告書",
    owner: "環境省",
    themes: ["気候政策", "豪雨", "猛暑"],
    note: "農業、水資源、防災、健康など影響評価の文脈を補強する。",
    url: "https://www.env.go.jp/earth/tekiou.html"
  },
  {
    name: "気候変動適応情報プラットフォーム",
    owner: "国立環境研究所",
    themes: ["脱炭素", "再エネ", "気候政策"],
    note: "適応策、影響、自治体向け情報の確認に使いやすい。",
    url: "https://adaptation-platform.nies.go.jp/"
  }
];
