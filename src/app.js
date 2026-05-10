const evidenceSources = [
  {
    name: "IPCC AR6 Synthesis Report",
    owner: "IPCC",
    theme: ["猛暑", "豪雨", "気候政策"],
    note: "長期的な温暖化傾向、極端現象、適応・緩和策の根拠確認に使う。",
    url: "https://www.ipcc.ch/report/ar6/syr/"
  },
  {
    name: "日本の気候変動 2025",
    owner: "気象庁・文部科学省",
    theme: ["猛暑", "豪雨"],
    note: "日本国内の観測データ、将来予測、極端気象の説明に向く。",
    url: "https://www.data.jma.go.jp/cpdinfo/ccj/index.html"
  },
  {
    name: "気候変動影響評価報告書",
    owner: "環境省",
    theme: ["気候政策", "豪雨", "猛暑"],
    note: "農業、水資源、防災、健康など影響評価の文脈を補強する。",
    url: "https://www.env.go.jp/earth/tekiou.html"
  },
  {
    name: "国立環境研究所 気候変動適応情報",
    owner: "国立環境研究所",
    theme: ["脱炭素", "再エネ", "気候政策"],
    note: "適応策、影響、自治体向け情報の確認に使いやすい。",
    url: "https://adaptation-platform.nies.go.jp/"
  }
];

const sampleArticle = {
  title: "今年の猛暑はすべて地球温暖化が原因なのか",
  mediaType: "Web記事",
  topic: "猛暑",
  body: "今年の猛暑は地球温暖化が原因であり、近年の高温はすべて温暖化で説明できる。専門家は、今後も同じような暑さが毎年必ず続くと指摘している。政府の脱炭素政策が進めば、すぐに猛暑は解消される可能性がある。"
};

let currentAnalysis = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function getLogs() {
  return JSON.parse(localStorage.getItem("climate-studio-logs") || "[]");
}

function setLogs(logs) {
  localStorage.setItem("climate-studio-logs", JSON.stringify(logs));
  renderDashboard();
  renderLogs();
  renderMetrics();
}

function extractClaims(text) {
  const sentences = text
    .split(/[。！？\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const claimKeywords = ["原因", "影響", "説明", "必ず", "すべて", "可能性", "政策", "解消", "増加", "減少"];
  const claims = sentences.filter((sentence) => claimKeywords.some((keyword) => sentence.includes(keyword)));

  return (claims.length ? claims : sentences.slice(0, 3)).slice(0, 5);
}

function detectRisks(text) {
  const checks = [
    {
      label: "断定が強い",
      test: /すべて|必ず|原因である|間違いない|解消される/.test(text),
      suggestion: "寄与度、確率、強度などの表現に置き換えられるか確認する。"
    },
    {
      label: "気象と気候の混同",
      test: /今年|今日|今回|この猛暑/.test(text) && /温暖化|気候変動/.test(text),
      suggestion: "個別現象と長期傾向を分け、イベント・アトリビューションの根拠を確認する。"
    },
    {
      label: "根拠不足",
      test: !/IPCC|気象庁|環境省|研究|データ|報告書/.test(text),
      suggestion: "公的資料、査読研究、観測データへの参照を追加する。"
    },
    {
      label: "政策的主張と科学的事実の混在",
      test: /政府|政策|脱炭素|原発|再エネ/.test(text) && /原因|解消|必ず/.test(text),
      suggestion: "科学的知見、政策評価、価値判断を段落や表現で分ける。"
    }
  ];

  return checks.filter((check) => check.test);
}

function getRelevantSources(topic, text) {
  return evidenceSources
    .filter((source) => source.theme.includes(topic) || source.theme.some((theme) => text.includes(theme)))
    .slice(0, 4);
}

function createMemo({ title, topic, claims, risks, sources }) {
  const riskText = risks.length
    ? risks.map((risk) => `- ${risk.label}: ${risk.suggestion}`).join("\n")
    : "- 重大なリスクは検出されませんでした。ただし根拠資料の確認は必要です。";
  const sourceText = sources.map((source) => `- ${source.owner}: ${source.name}`).join("\n");
  const claimText = claims.map((claim, index) => `${index + 1}. ${claim}`).join("\n");

  return `対象: ${title || "無題"}\nテーマ: ${topic}\n\n抽出された主張:\n${claimText}\n\n要確認ポイント:\n${riskText}\n\n関連根拠候補:\n${sourceText}\n\n推奨編集方針:\n個別の気象現象と長期的な気候傾向を分けて説明し、断定表現は「発生確率や強度を高めているとされる」「影響している可能性がある」など、根拠の強さに応じた表現へ調整する。`;
}

function renderList(container, items, mapper) {
  container.classList.toggle("empty", items.length === 0);
  container.innerHTML = items.length ? items.map(mapper).join("") : container.textContent;
}

function analyze() {
  const title = $("#article-title").value.trim();
  const mediaType = $("#media-type").value;
  const topic = $("#topic").value;
  const body = $("#article-body").value.trim();

  if (!body) {
    $("#article-body").focus();
    return;
  }

  const claims = extractClaims(body);
  const risks = detectRisks(body);
  const sources = getRelevantSources(topic, body);
  const memo = createMemo({ title, topic, claims, risks, sources });

  currentAnalysis = { title, mediaType, topic, body, claims, risks, sources, memo };

  $("#claim-count").textContent = String(claims.length);
  $("#risk-count").textContent = String(risks.length);
  renderList($("#claims-list"), claims, (claim, index) => `<article><strong>${index + 1}</strong><p>${escapeHtml(claim)}</p></article>`);
  renderList($("#risk-list"), risks, (risk) => `<article><strong>${escapeHtml(risk.label)}</strong><p>${escapeHtml(risk.suggestion)}</p></article>`);
  $("#editor-memo").value = memo;
  renderEvidence(sources);
  renderMetrics();
}

function renderEvidence(sources = evidenceSources) {
  $("#evidence-list").innerHTML = sources
    .map(
      (source) => `
        <article class="evidence-card">
          <div>
            <p class="kicker">${escapeHtml(source.owner)}</p>
            <h3>${escapeHtml(source.name)}</h3>
            <p>${escapeHtml(source.note)}</p>
          </div>
          <a href="${source.url}" target="_blank" rel="noreferrer">開く</a>
        </article>
      `
    )
    .join("");
}

function saveLog() {
  if (!currentAnalysis) {
    analyze();
  }
  if (!currentAnalysis) return;

  const reasons = $$("#revision-reasons input:checked").map((input) => input.value);
  const log = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    input_text: currentAnalysis.body,
    title: currentAnalysis.title,
    media_type: currentAnalysis.mediaType,
    topic: currentAnalysis.topic,
    claims: currentAnalysis.claims,
    ai_memo: currentAnalysis.memo,
    sources: currentAnalysis.sources.map((source) => source.name),
    risks: currentAnalysis.risks.map((risk) => risk.label),
    human_rating_accuracy: Number($("#rating-accuracy").value),
    human_rating_usefulness: Number($("#rating-usefulness").value),
    human_rating_trust: Number($("#rating-trust").value),
    human_revision: $("#human-revision").value.trim(),
    revision_reason: reasons
  };

  setLogs([log, ...getLogs()]);
  $("#human-revision").value = "";
  $$("#revision-reasons input").forEach((input) => {
    input.checked = false;
  });
  switchTab("logs");
}

function renderDashboard() {
  const logs = getLogs();
  const avg = (key) => (logs.length ? (logs.reduce((sum, log) => sum + log[key], 0) / logs.length).toFixed(1) : "-");
  $("#rating-summary").innerHTML = [
    ["正確性", avg("human_rating_accuracy")],
    ["有用性", avg("human_rating_usefulness")],
    ["信頼性", avg("human_rating_trust")]
  ]
    .map(([label, value]) => `<div><span>${value}</span><small>${label}</small></div>`)
    .join("");

  renderBars("#reason-summary", countBy(logs.flatMap((log) => log.revision_reason)));
  renderBars("#topic-summary", countBy(logs.map((log) => log.topic)));
}

function renderBars(selector, counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  $(selector).innerHTML = entries.length
    ? entries
        .map(
          ([label, count]) => `
          <div class="bar-row">
            <span>${escapeHtml(label)}</span>
            <div><i style="width:${(count / max) * 100}%"></i></div>
            <b>${count}</b>
          </div>
        `
        )
        .join("")
    : "<p class=\"empty-note\">ログがまだありません。</p>";
}

function renderLogs() {
  const logs = getLogs();
  $("#log-list").innerHTML = logs.length
    ? logs
        .map(
          (log) => `
        <article class="log-card">
          <div class="log-head">
            <div>
              <p class="kicker">${new Date(log.timestamp).toLocaleString("ja-JP")}</p>
              <h3>${escapeHtml(log.title || "無題")}</h3>
            </div>
            <span>${escapeHtml(log.topic)}</span>
          </div>
          <p>${escapeHtml(log.ai_memo.slice(0, 180))}${log.ai_memo.length > 180 ? "..." : ""}</p>
          <div class="tag-row">
            ${log.risks.map((risk) => `<small>${escapeHtml(risk)}</small>`).join("")}
          </div>
        </article>
      `
        )
        .join("")
    : "<p class=\"empty-note\">保存済みログはありません。</p>";
}

function renderMetrics() {
  const logs = getLogs();
  const totalRisks = logs.reduce((sum, log) => sum + log.risks.length, currentAnalysis?.risks.length || 0);
  const trust = logs.length ? (logs.reduce((sum, log) => sum + log.human_rating_trust, 0) / logs.length).toFixed(1) : "-";
  $("#metric-sessions").textContent = String(logs.length);
  $("#metric-trust").textContent = trust;
  $("#metric-risk").textContent = String(totalRisks || "-");
}

function exportCsv() {
  const logs = getLogs();
  const headers = [
    "timestamp",
    "title",
    "media_type",
    "topic",
    "input_text",
    "claims",
    "ai_memo",
    "sources",
    "risks",
    "human_rating_accuracy",
    "human_rating_usefulness",
    "human_rating_trust",
    "human_revision",
    "revision_reason"
  ];
  const rows = logs.map((log) => headers.map((key) => csvCell(Array.isArray(log[key]) ? log[key].join("; ") : log[key])));
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "climate-fact-check-logs.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function switchTab(tabName) {
  $$(".tab-button").forEach((button) => button.classList.toggle("active", button.dataset.tab === tabName));
  $$(".tab-panel").forEach((panel) => panel.classList.toggle("visible", panel.id === `${tabName}-panel`));
}

function countBy(items) {
  return items.reduce((counts, item) => {
    if (item) counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
}

function csvCell(value = "") {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

$$(".tab-button").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
$("#load-sample").addEventListener("click", () => {
  $("#article-title").value = sampleArticle.title;
  $("#media-type").value = sampleArticle.mediaType;
  $("#topic").value = sampleArticle.topic;
  $("#article-body").value = sampleArticle.body;
  analyze();
});
$("#analyze-button").addEventListener("click", analyze);
$("#save-log").addEventListener("click", saveLog);
$("#copy-memo").addEventListener("click", () => navigator.clipboard.writeText($("#editor-memo").value));
$("#export-csv").addEventListener("click", exportCsv);
$("#clear-logs").addEventListener("click", () => {
  setLogs([]);
});

renderEvidence();
renderDashboard();
renderLogs();
renderMetrics();
