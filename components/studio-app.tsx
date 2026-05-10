"use client";

import { Button, Card, Chip, Tabs } from "@heroui/react";
import type { Key, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { evidenceSources } from "@/data/evidence-sources";
import { logsToCsv } from "@/lib/csv";
import type { AnalysisResult, MediaType, ResearchLog, Topic } from "@/lib/types";

const topics: Topic[] = ["猛暑", "豪雨", "脱炭素", "再エネ", "原発", "気候政策"];
const mediaTypes: MediaType[] = ["新聞記事", "Web記事", "SNS投稿", "見出し"];
const revisionReasons = ["根拠不足", "表現が断定的", "文脈を誤解", "出典が不適切", "役に立ったが要調整"];

const sampleArticle = {
  title: "今年の猛暑はすべて地球温暖化が原因なのか",
  mediaType: "Web記事" as MediaType,
  topic: "猛暑" as Topic,
  body: "今年の猛暑は地球温暖化が原因であり、近年の高温はすべて温暖化で説明できる。専門家は、今後も同じような暑さが毎年必ず続くと指摘している。政府の脱炭素政策が進めば、すぐに猛暑は解消される可能性がある。"
};

export function StudioApp() {
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("新聞記事");
  const [topic, setTopic] = useState<Topic>("猛暑");
  const [body, setBody] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [logs, setLogs] = useState<ResearchLog[]>([]);
  const [accuracy, setAccuracy] = useState(3);
  const [usefulness, setUsefulness] = useState(3);
  const [trust, setTrust] = useState(3);
  const [humanRevision, setHumanRevision] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("climate-studio-logs");
    if (saved) setLogs(JSON.parse(saved) as ResearchLog[]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("climate-studio-logs", JSON.stringify(logs));
  }, [logs]);

  const averageTrust = logs.length
    ? (logs.reduce((sum, log) => sum + log.human_rating_trust, 0) / logs.length).toFixed(1)
    : "-";
  const riskCount = logs.reduce((sum, log) => sum + log.risks.length, analysis?.risks.length ?? 0);
  const ratingSummary = useMemo(() => summarizeRatings(logs), [logs]);
  const reasonSummary = useMemo(() => countBy(logs.flatMap((log) => log.revision_reason)), [logs]);
  const topicSummary = useMemo(() => countBy(logs.map((log) => log.topic)), [logs]);

  async function analyzeArticle() {
    if (!body.trim()) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, mediaType, topic, body })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string; retryable?: boolean };
        const message = payload.error ?? "分析に失敗しました。";
        setAnalysis(null);
        setAnalysisError(payload.retryable ? `${message} 再試行してください。` : message);
        return;
      }

      setAnalysis((await response.json()) as AnalysisResult);
    } catch {
      setAnalysis(null);
      setAnalysisError("ネットワークエラーが発生しました。接続を確認して再試行してください。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function loadSample() {
    setTitle(sampleArticle.title);
    setMediaType(sampleArticle.mediaType);
    setTopic(sampleArticle.topic);
    setBody(sampleArticle.body);
  }

  function saveLog() {
    if (!analysis) return;

    const log: ResearchLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      input_text: analysis.body,
      title: analysis.title,
      media_type: analysis.mediaType,
      topic: analysis.topic,
      claims: analysis.claims,
      ai_memo: analysis.memo,
      sources: analysis.sources.map((source) => source.name),
      risks: analysis.risks.map((risk) => risk.label),
      human_rating_accuracy: accuracy,
      human_rating_usefulness: usefulness,
      human_rating_trust: trust,
      human_revision: humanRevision,
      revision_reason: selectedReasons
    };

    setLogs((currentLogs) => [log, ...currentLogs]);
    setHumanRevision("");
    setSelectedReasons([]);
  }

  function exportCsv() {
    const blob = new Blob([logsToCsv(logs)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "climate-fact-check-logs.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#14211c]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="bg-[#10231d] p-7 text-white">
          <p className="text-xs font-bold uppercase text-emerald-300">Climate Fact-Check Studio</p>
          <h1 className="mt-2 text-3xl font-black leading-tight">気候変動報道のためのAI編集支援基盤</h1>

          <div className="mt-8 grid grid-cols-3 gap-3 lg:mt-12 lg:grid-cols-1">
            <Metric label="sessions" value={String(logs.length)} />
            <Metric label="avg trust" value={averageTrust} />
            <Metric label="risk alerts" value={riskCount ? String(riskCount) : "-"} />
          </div>
        </aside>

        <section className="p-5 md:p-8">
          <Tabs defaultSelectedKey="studio" variant="primary">
            <Tabs.List aria-label="Climate studio sections" className="rounded-lg border border-default-200 bg-white p-1">
              <Tabs.Tab id="studio">Studio</Tabs.Tab>
              <Tabs.Tab id="evidence">Evidence</Tabs.Tab>
              <Tabs.Tab id="dashboard">Dashboard</Tabs.Tab>
              <Tabs.Tab id="logs">Logs</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel id="studio" className="mt-5">
              <div className="grid gap-5">
                <Card>
                  <Card.Header className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-emerald-700">Article Intake</p>
                      <h2 className="text-2xl font-black">記事・SNS投稿・見出しを検証する</h2>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onPress={loadSample}>
                        サンプル
                      </Button>
                      <Button variant="primary" isDisabled={isAnalyzing} onPress={analyzeArticle}>
                        {isAnalyzing ? "分析中" : "分析する"}
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Content className="grid gap-4">
                    {analysisError ? (
                      <p className="rounded-lg border border-danger-300 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                        {analysisError}
                      </p>
                    ) : null}
                    <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                      <FieldLabel label="タイトル">
                        <input className={fieldClassName} value={title} onChange={(event) => setTitle(event.target.value)} />
                      </FieldLabel>
                      <FieldLabel label="媒体種別">
                        <select
                          className={fieldClassName}
                          value={mediaType}
                          onChange={(event) => setMediaType(event.target.value as MediaType)}
                        >
                          {mediaTypes.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </FieldLabel>
                      <FieldLabel label="テーマ">
                        <select className={fieldClassName} value={topic} onChange={(event) => setTopic(event.target.value as Topic)}>
                          {topics.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </FieldLabel>
                    </div>
                    <FieldLabel label="本文">
                      <textarea className={fieldClassName} rows={8} value={body} onChange={(event) => setBody(event.target.value)} />
                    </FieldLabel>
                  </Card.Content>
                </Card>

                <div className="grid gap-5 xl:grid-cols-2">
                  <ResultCard title="抽出された主張" count={analysis?.claims.length ?? 0}>
                    {analysis?.claims.length ? (
                      <div className="grid gap-3">
                        {analysis.claims.map((claim, index) => (
                          <div key={claim} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-lg border border-default-200 bg-default-50 p-3">
                            <b className="text-emerald-700">{index + 1}</b>
                            <p>{claim}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyText>分析すると主張が表示されます。</EmptyText>
                    )}
                  </ResultCard>

                  <ResultCard title="リスク判定" count={analysis?.risks.length ?? 0}>
                    {analysis?.risks.length ? (
                      <div className="grid gap-3">
                        {analysis.risks.map((risk) => (
                          <div key={risk.label} className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                            <Chip color="warning" variant="soft">
                              {risk.label}
                            </Chip>
                            <p className="mt-2 text-sm text-default-700">{risk.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyText>断定表現や根拠不足を確認します。</EmptyText>
                    )}
                  </ResultCard>
                </div>

                <Card>
                  <Card.Header className="flex justify-between">
                    <h3 className="text-xl font-black">編集者向け確認メモ</h3>
                    <Button
                      variant="outline"
                      onPress={() => {
                        if (analysis?.memo) void navigator.clipboard.writeText(analysis.memo);
                      }}
                    >
                      コピー
                    </Button>
                  </Card.Header>
                  <Card.Content>
                    <textarea className={fieldClassName} rows={8} value={analysis?.memo ?? ""} readOnly />
                  </Card.Content>
                </Card>

                <Card>
                  <Card.Header className="block">
                    <p className="text-xs font-bold uppercase text-emerald-700">Human-in-the-loop</p>
                    <h3 className="text-xl font-black">人間評価と修正ログ</h3>
                  </Card.Header>
                  <Card.Content className="grid gap-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <RatingControl label="正確性" value={accuracy} onChange={setAccuracy} />
                      <RatingControl label="有用性" value={usefulness} onChange={setUsefulness} />
                      <RatingControl label="信頼性" value={trust} onChange={setTrust} />
                    </div>
                    <FieldLabel label="人間による修正">
                      <textarea
                        className={fieldClassName}
                        rows={4}
                        value={humanRevision}
                        onChange={(event) => setHumanRevision(event.target.value)}
                      />
                    </FieldLabel>
                    <div className="grid gap-2">
                      <span className="text-sm font-bold text-default-600">修正理由</span>
                      <div className="flex flex-wrap gap-3">
                        {revisionReasons.map((reason) => (
                          <label key={reason} className="flex items-center gap-2 rounded-lg border border-default-200 bg-white px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedReasons.includes(reason)}
                              onChange={(event) =>
                                setSelectedReasons((current) =>
                                  event.target.checked ? [...current, reason] : current.filter((item) => item !== reason)
                                )
                              }
                            />
                            {reason}
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button variant="primary" isDisabled={!analysis} onPress={saveLog}>
                      ログを保存
                    </Button>
                  </Card.Content>
                </Card>
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="evidence" className="mt-5">
              <div className="grid gap-4">
                {(analysis?.sources ?? evidenceSources).map((source) => (
                  <Card key={source.name}>
                    <Card.Content className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-emerald-700">{source.owner}</p>
                        <h3 className="text-xl font-black">{source.name}</h3>
                        <p className="mt-2 text-default-600">{source.note}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {source.themes.map((sourceTheme) => (
                            <Chip key={sourceTheme} variant="soft">
                              {sourceTheme}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <a
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-default-300 px-4 text-sm font-bold"
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        開く
                      </a>
                    </Card.Content>
                  </Card>
                ))}
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="dashboard" className="mt-5">
              <div className="grid gap-5">
                <div className="flex justify-end">
                  <Button variant="outline" isDisabled={!logs.length} onPress={exportCsv}>
                    CSV出力
                  </Button>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  <Card>
                    <Card.Header>
                      <h3 className="text-xl font-black">評価平均</h3>
                    </Card.Header>
                    <Card.Content className="grid grid-cols-3 gap-3">
                      <Metric label="正確性" value={ratingSummary.accuracy} dark={false} />
                      <Metric label="有用性" value={ratingSummary.usefulness} dark={false} />
                      <Metric label="信頼性" value={ratingSummary.trust} dark={false} />
                    </Card.Content>
                  </Card>
                  <SummaryCard title="修正理由分布" data={reasonSummary} />
                  <SummaryCard title="トピック別ログ" data={topicSummary} className="xl:col-span-2" />
                </div>
              </div>
            </Tabs.Panel>

            <Tabs.Panel id="logs" className="mt-5">
              <Card>
                <Card.Header className="flex justify-between">
                  <h3 className="text-xl font-black">保存済みログ</h3>
                  <Button variant="danger-soft" isDisabled={!logs.length} onPress={() => setLogs([])}>
                    全削除
                  </Button>
                </Card.Header>
                <Card.Content>
                  {logs.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-default-200 text-default-500">
                          <tr>
                            <th className="py-3 pr-4">日時</th>
                            <th className="py-3 pr-4">タイトル</th>
                            <th className="py-3 pr-4">テーマ</th>
                            <th className="py-3 pr-4">信頼性</th>
                            <th className="py-3 pr-4">リスク</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log) => (
                            <tr key={log.id} className="border-b border-default-100">
                              <td className="py-3 pr-4">{new Date(log.timestamp).toLocaleString("ja-JP")}</td>
                              <td className="py-3 pr-4 font-bold">{log.title || "無題"}</td>
                              <td className="py-3 pr-4">{log.topic}</td>
                              <td className="py-3 pr-4">{log.human_rating_trust}</td>
                              <td className="py-3 pr-4">
                                <div className="flex flex-wrap gap-1">
                                  {log.risks.map((risk) => (
                                    <Chip key={risk} size="sm" color="warning" variant="soft">
                                      {risk}
                                    </Chip>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyText>保存済みログはありません。</EmptyText>
                  )}
                </Card.Content>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </section>
      </div>
    </main>
  );
}

const fieldClassName =
  "w-full rounded-lg border border-default-200 bg-white px-3 py-2 text-sm text-[#14211c] outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15";

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-default-600">
      {label}
      {children}
    </label>
  );
}

function RatingControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-default-600">
      <span className="flex items-center justify-between">
        {label}
        <b className="text-emerald-700">{value}</b>
      </span>
      <input type="range" min={1} max={5} step={1} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Metric({ label, value, dark = true }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={dark ? "rounded-lg border border-white/15 p-4" : "rounded-lg border border-default-200 bg-default-50 p-4"}>
      <span className={dark ? "block text-3xl font-black text-white" : "block text-3xl font-black text-success-700"}>{value}</span>
      <small className={dark ? "text-white/65" : "text-default-500"}>{label}</small>
    </div>
  );
}

function ResultCard({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <Card>
      <Card.Header className="flex justify-between">
        <h3 className="text-xl font-black">{title}</h3>
        <Chip color="success" variant="soft">
          {count}
        </Chip>
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-default-500">{children}</p>;
}

function SummaryCard({ title, data, className = "" }: { title: string; data: Record<string, number>; className?: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, count]) => count));

  return (
    <Card className={className}>
      <Card.Header>
        <h3 className="text-xl font-black">{title}</h3>
      </Card.Header>
      <Card.Content className="grid gap-3">
        {entries.length ? (
          entries.map(([label, count]) => (
            <div key={label} className="grid grid-cols-[140px_minmax(0,1fr)_32px] items-center gap-3">
              <span className="text-sm font-bold">{label}</span>
              <div className="h-3 overflow-hidden rounded-full bg-default-100">
                <div className="h-full rounded-full bg-warning" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <b>{count}</b>
            </div>
          ))
        ) : (
          <EmptyText>ログがまだありません。</EmptyText>
        )}
      </Card.Content>
    </Card>
  );
}

function summarizeRatings(logs: ResearchLog[]) {
  if (!logs.length) return { accuracy: "-", usefulness: "-", trust: "-" };

  const average = (key: "human_rating_accuracy" | "human_rating_usefulness" | "human_rating_trust") =>
    (logs.reduce((sum, log) => sum + log[key], 0) / logs.length).toFixed(1);

  return {
    accuracy: average("human_rating_accuracy"),
    usefulness: average("human_rating_usefulness"),
    trust: average("human_rating_trust")
  };
}

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((counts, item) => {
    if (item) counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {});
}
