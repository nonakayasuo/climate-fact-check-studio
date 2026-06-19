# Climate Fact-Check Studio Plans.md（子レイヤ / 作戦会議室）

最終更新: 2026-06-19

> **2 層構成**: 上位（全体俯瞰・判断基準）= [../Plans.md](../Plans.md)。ここはこのリポジトリの「今回だけのこと」。
> **接続先**: プロジェクト方針 → [docs/steering/](docs/steering/)（product / structure / tech）、機能仕様 → [docs/specs/](docs/specs/)、Supabase 運用 → [docs/supabase-operations.md](docs/supabase-operations.md)。
> **研究文脈**: 博士研究「気候変動 × 情報環境（CSS）」のプロトタイプ基盤（進路: 朝日新聞 → 東京科学大 MOT 2027/4 → 博士）。
> ℹ️ 旧 `.kiro` 運用は廃止。steering / specs は `docs/` に移し、進捗追跡は本 Plans.md に一本化。

---

## 🎯 このリポジトリの目的・成功条件（子層の固定枠）

- **目的**: 気候変動報道向けに、主張抽出 → リスク判定 → 根拠提示 → 編集支援 → 人間評価 → 監査ログ／CSV出力までを回せる**研究プロトタイプ**を提供し、CSS 研究の実験基盤にする。
- **やる**: 日本語の気候報道に特化したファクトチェック支援、研究用データ収集（評価・修正ログ）、A/B 出力比較などの実験設計。
- **やらない**: 一般向けの商用ファクトチェックサービス化、気候以外ドメインへの汎用拡張（当面）。
- **成功条件（研究側）**: 人間評価ログが定量分析できる粒度で蓄積され、出力方式（A/B/C）の比較実験が回せる状態。

---

## 🔥 今のフォーカス（作戦会議室 / WIP）

> ⚠️ 2026-05-11 を最後に約5週間停滞中。再開時はまず `bun install && bun run dev` で現状を確認 → 下記 WIP に着手。

### [C-1] A/B/C 出力比較実験の実装（仕様 → 実装）

- **目的**: 出力方式の違いが編集者の評価（正確性・有用性・信頼性）に与える差を測れるようにする。研究の核。
- **なぜ今**: 仕様（[docs/specs/ab-output-comparison-conditional-dashboard/](docs/specs/ab-output-comparison-conditional-dashboard/)）は定義済みだが実装が未着手。MVP の評価ログ基盤は揃っているので、ここを通すと実験が回り始める。
- **今回やること**: 仕様の requirements/design に沿って出力バリアントの生成と切替、評価ログへの variant 紐付け。
- **今回やらないこと**: 統計ダッシュボードの作り込み（C-2 に分離）、新規 LLM プロバイダ追加。
- **検証すること**: `bun run typecheck` / `bun run build` / `bun run test` が通り、CSV に variant 列が出力される。
- **終わったあとに残すこと**: 実験設計と判断を docs/ に反映。完了サマリは（必要なら）`.plans/` を新設して保存。

---

## 📋 アクティブ

| Task | 内容 | DoD | 仕様 | Status |
|------|------|-----|------|--------|
| C-1 | A/B/C 出力比較実験の実装（仕様 → 実装） | variant 生成・切替・評価ログ紐付け、CSV に variant 列 | [docs/specs/ab-output-comparison-conditional-dashboard/](docs/specs/ab-output-comparison-conditional-dashboard/) | cc:todo |
| C-2 | 条件別ダッシュボードと評価統計 | 条件別に評価指標を集計表示できる | 同上 | cc:todo |
| C-3 | 根拠資料 PDF/URL 登録の拡充（簡易 RAG の精度向上） | 登録 → 検索 → 提示の品質が実用域 | [docs/specs/evidence-source-registry-simple-rag/](docs/specs/evidence-source-registry-simple-rag/) | cc:todo |
| C-4 | OpenAI 依存のコスト/フォールバック整理（ルールベース併用） | API 失敗時もルールベースで継続動作 | [docs/specs/openai-claim-risk-memo-generation/](docs/specs/openai-claim-risk-memo-generation/) | cc:todo |

> 📌 詳細仕様は [docs/specs/](docs/specs/)、プロジェクト方針は [docs/steering/](docs/steering/)。本表は「進行中として追跡する」項目のミラー。

---

## 📦 アーカイブ（完了済み）

> 完了タスクは「目的・成果物 / 判断の系譜 / 失敗と対策 / 次に活きること」で残す。量が増えたら `.plans/` ディレクトリに分離する。

| 完了 | 内容 | 仕様 / 根拠 |
|------|------|------|
| 2026-05-10 | MVP 試作（入力・主張抽出ルールベース・リスク判定・根拠候補・編集メモ・5段階評価・修正ログ・CSV・監査ログ） | Initial prototype / PR #1 |
| 2026-05-10 | Next.js studio アプリ + OpenAI 駆動の分析ワークフロー | [docs/specs/openai-claim-risk-memo-generation/](docs/specs/openai-claim-risk-memo-generation/) / PR #2 |
| 2026-05-10 | Supabase バックエンドの研究ログ永続化 | [docs/specs/supabase-log-persistence/](docs/specs/supabase-log-persistence/) / PR #3 |
| 2026-05-11 | Evidence registry + 簡易 RAG + ギャップアラート | [docs/specs/evidence-source-registry-simple-rag/](docs/specs/evidence-source-registry-simple-rag/) / PR #5 |

---

## 🧩 技術メモ

- Stack: Next.js 16 (App Router) / TypeScript / Tailwind v4 / HeroUI v3 / Bun / Supabase / OpenAI。
- 起動: `bun install` → `bun run dev`（http://localhost:3000）。検証: `bun run typecheck` / `bun run build` / `bun run test`。
- 秘匿情報は `.env.local`（コミットしない）。
- 旧 `.kiro/`（steering + specs + 汎用 rules/templates）は廃止。steering → `docs/steering/`、specs → `docs/specs/` に移行し、汎用テンプレ類は削除（履歴に残存）。
