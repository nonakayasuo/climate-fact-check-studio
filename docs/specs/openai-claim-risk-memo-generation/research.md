# Research & Design Decisions

## Summary
- **Feature**: `openai-claim-risk-memo-generation`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 既存実装は `/api/analyze` → `lib/analysis.ts` の単一路線で、境界が明確なため OpenAI 連携を同境界に追加しやすい。
  - Structured Outputs（JSON Schema）を使うことで、主張・リスク・根拠確認ポイント・メモの構造化返却を安定化できる。
  - 外部 API 呼び出し失敗時は、利用者が再試行判断できるエラー種別を返す設計が必須。

## Research Log

### 既存アーキテクチャ適合性
- **Context**: ルールベースから OpenAI API への拡張で、既存 UI と API 境界を維持できるか確認したい。
- **Sources Consulted**:
  - `app/api/analyze/route.ts`
  - `lib/analysis.ts`
  - `.kiro/steering/tech.md`
  - `.kiro/steering/structure.md`
- **Findings**:
  - 現在は Route Handler が薄いオーケストレーション層として機能し、解析ロジックは `lib/analysis.ts` に集約されている。
  - `StudioApp` は `/api/analyze` のレスポンスを前提に画面描画と評価保存を行う。
  - 解析の実装差し替えはサーバ境界内で完結でき、UI 契約を維持しやすい。
- **Implications**:
  - 既存の API 契約を壊さない拡張（内部実装の置換）を第一方針とする。

### OpenAI Structured Output 方針
- **Context**: 要件が「構造化 JSON」を求めるため、出力の安定性担保が必要。
- **Sources Consulted**:
  - [Text generation | OpenAI API](https://developers.openai.com/docs/guides/text?api-mode=responses)
  - [Responses | OpenAI API Reference](https://developers.openai.com/api/reference/resources/responses)
  - [Structured model outputs | OpenAI API](https://platform.openai.com/docs/guides/structured-outputs)
- **Findings**:
  - Responses API を前提とした structured output 利用が推奨される。
  - JSON Schema 制約付きの返却形式は、UI 側で期待する構造データ連携と相性が高い。
  - モデル拒否（refusal）や不完全レスポンスを業務エラーとして扱う必要がある。
- **Implications**:
  - 設計では「構造化出力バリデーション」と「業務エラー分類」を独立責務として定義する。

### レート制限・再試行観点
- **Context**: 外部 API 障害時に利用者体験を維持する要件を満たす必要がある。
- **Sources Consulted**:
  - [Rate limits | OpenAI API](https://platform.openai.com/docs/guides/rate-limits/)
  - [429 Too Many Requests errors](https://help.openai.com/en/articles/5955604)
  - [Production best practices | OpenAI API](https://developers.openai.com/api/docs/guides/production-best-practices)
- **Findings**:
  - 429/5xx/timeout を対象とした指数バックオフ再試行が推奨される。
  - 再試行しても失敗する場合は、ユーザーが入力見直しまたは再実行を選べるメッセージ設計が必要。
- **Implications**:
  - `route.ts` では失敗理由を「再試行可能」「再試行しても改善しにくい」に分けて返却する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存関数の直接置換 | `lib/analysis.ts` を OpenAI 呼び出し実装に全面置換 | 変更箇所が少ない | 失敗処理・構造化検証が混在し責務が肥大化 | 不採用 |
| オーケストレータ + OpenAI アダプタ分離 | 既存 `createAnalysis` は入口を維持し、外部呼び出しと構造化変換を別モジュール化 | 境界明確、テストしやすい、将来差し替え容易 | ファイル数が増える | 採用 |
| UI から OpenAI 直接呼び出し | `StudioApp` から直接 API 呼び出し | 実装が速い | キー管理・エラー制御・契約維持が困難 | 境界違反のため不採用 |

## Design Decisions

### Decision: API 境界は `/api/analyze` を維持
- **Context**: 既存 UI を壊さず要件を満たしたい。
- **Alternatives Considered**:
  1. UI 直結で OpenAI 呼び出し
  2. Route Handler 境界を維持
- **Selected Approach**: Route Handler 内で解析オーケストレーションし、UI は既存 fetch 契約を継続。
- **Rationale**: 既存構造との整合性が高く、運用リスクが低い。
- **Trade-offs**: サーバ側実装の責務整理が必要。
- **Follow-up**: 実装で API レスポンス後方互換を確認。

### Decision: 構造化出力バリデーションを必須化
- **Context**: 構造化 JSON 出力を人間評価フローへ接続する必要がある。
- **Alternatives Considered**:
  1. 生テキストを都度パース
  2. JSON Schema 制約で返却を固定
- **Selected Approach**: OpenAI 応答を構造化スキーマに合わせて検証し、失敗時は業務エラーへ正規化。
- **Rationale**: 返却形式の安定性が高く、UI 側分岐を簡素化できる。
- **Trade-offs**: スキーマ更新時に契約再検証が必要。
- **Follow-up**: `lib/types.ts` の型とスキーマの同期ルールをタスク化。

### Decision: フォールバックは段階導入
- **Context**: 外部 API 失敗時に完全停止を避けたい。
- **Alternatives Considered**:
  1. 常時エラー返却のみ
  2. 既存ルールベースを限定フォールバックとして残す
- **Selected Approach**: リトライ後も失敗するケースでは、要件上の明確なエラー返却を基本としつつ、将来の運用判断でフォールバックを有効化可能な構造にする。
- **Rationale**: 要件の「利用者が判断できるエラー情報」を満たしつつ、品質低下の無自覚なフォールバックを避ける。
- **Trade-offs**: 初期リリース時の可用性は API 品質に依存。
- **Follow-up**: フォールバック有効条件を運用ガイドとして定義。

## Risks & Mitigations
- レスポンス構造不一致 — スキーマ検証とエラー正規化で UI への不正データ流入を防止。
- レート制限や一時障害 — 指数バックオフ再試行と再試行可能エラー分類を導入。
- 既存評価フローとの乖離 — 返却契約を `AnalysisResult` 互換で維持し、UI 変更を局所化。

## References
- [Text generation | OpenAI API](https://developers.openai.com/docs/guides/text?api-mode=responses) — Responses API 推奨方針
- [Responses | OpenAI API Reference](https://developers.openai.com/api/reference/resources/responses) — 主要 API 契約
- [Structured model outputs | OpenAI API](https://platform.openai.com/docs/guides/structured-outputs) — JSON Schema 構造化出力
- [Rate limits | OpenAI API](https://platform.openai.com/docs/guides/rate-limits/) — レート制限設計
