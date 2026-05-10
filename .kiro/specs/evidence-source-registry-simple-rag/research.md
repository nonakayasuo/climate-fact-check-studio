# Research & Design Decisions

## Summary
- **Feature**: `evidence-source-registry-simple-rag`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 既存システムは `StudioApp` → `/api/analyze` → `createAnalysis()` の単一路線で、分析責務は `lib/analysis.ts` に集中している。
  - 根拠ソースは `data/evidence-sources.ts` の静的配列のみで、登録・更新・無効化の運用インターフェースが存在しない。
  - 型 SSOT は `lib/types.ts` のため、根拠資料登録と主張-出典紐づけを導入する場合は型拡張と API 契約の同期が最優先になる。

## Research Log

### 既存分析経路の拡張余地
- **Context**: 要件 1-4 を既存構造へどこまで追加できるか確認する必要があった。
- **Sources Consulted**:
  - `app/api/analyze/route.ts`
  - `lib/analysis.ts`
  - `lib/types.ts`
- **Findings**:
  - `/api/analyze` は `AnalysisRequest` の最小検証後に `createAnalysis()` を呼ぶ薄い境界。
  - `createAnalysis()` は主張抽出・リスク判定・根拠候補・メモ作成を同期処理で返す。
  - エラー封筒や主張単位の参照箇所構造は未定義。
- **Implications**:
  - `analysis` ドメイン内に根拠レジストリ検索と参照箇所候補生成を追加し、Route Handler 側は契約維持に集中させる。

### 根拠ソース管理の現状
- **Context**: PDF/URL 登録機能の要件を満たすため、既存データ配置の制約を確認した。
- **Sources Consulted**:
  - `data/evidence-sources.ts`
  - `lib/types.ts`
- **Findings**:
  - 現状は静的な `EvidenceSource[]` のみで、ユーザー入力由来の資料を保持する構造がない。
  - `EvidenceSource` は URL とメモを持つが、資料状態（有効/無効）や更新履歴、資料種別の正規化項目が不足。
- **Implications**:
  - 既存 `data/evidence-sources.ts` を「初期シード」に位置づけ、ユーザー登録資料は別レイヤ（クライアント永続化 + API 入出力）で統合する設計が必要。

### 境界・依存方向の整合
- **Context**: steering の依存方向 (`app`/`components` → `lib` ← `data`) を崩さずに設計できるか評価した。
- **Sources Consulted**:
  - `.kiro/steering/structure.md`
  - `.kiro/steering/tech.md`
- **Findings**:
  - `lib` 層は副作用なしが原則のため、保存 I/O は `components/studio-app.tsx` か Route Handler で扱う必要がある。
  - 既存の localStorage 方針を活かせば新規インフラ導入なしで MVP を成立できる。
- **Implications**:
  - 根拠資料レジストリは「UI で永続化」「lib で検索・ランキング・紐づけ」の責務分離を採用する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Static Catalog Extension | `data/evidence-sources.ts` のみ拡張 | 実装が最小 | 登録/更新要件を満たせない | 要件1未達のため棄却 |
| Client Registry + Analysis Orchestrator | UI で資料登録を保持し、分析時に統合検索 | 既存アーキテクチャに適合、段階導入可能 | クライアント保存の品質管理が必要 | **採用** |
| External Vector DB First | 先に専用 RAG 基盤を導入 | 検索精度の拡張性が高い | 現スコープを超える導入コスト | 現フェーズでは過剰 |

## Design Decisions

### Decision: 根拠資料レジストリを「シード + ユーザー登録」の二層に分離
- **Context**: 権威ソースを維持しつつ、記事別の追加資料登録を可能にする必要がある。
- **Alternatives Considered**:
  1. 既存シード配列を直接編集
  2. ユーザー登録資料を独立して保持し、分析時にマージ
- **Selected Approach**: シードは読み取り専用、ユーザー登録は別ストアで保持し、検索時に統合する。
- **Rationale**: 既存データの信頼性を保ちながら要件1を満たせる。
- **Trade-offs**: 2種類のデータソース整合ロジックが必要。
- **Follow-up**: 重複判定ルールと無効化反映のテストを実装段階で確認。

### Decision: 簡易 RAG は「主張-資料候補-参照箇所候補」のルールベース段階実装
- **Context**: まずは実務フローで使える速度と説明可能性を確保する必要がある。
- **Alternatives Considered**:
  1. いきなり埋め込み検索中心で設計
  2. 既存ルールベースを拡張し、主張単位検索を追加
- **Selected Approach**: 主張単位で資料候補をスコアリングし、参照箇所候補を返す簡易 RAG を採用。
- **Rationale**: 現行 MVP の検証サイクルと整合し、既存 `createAnalysis()` の拡張で導入できる。
- **Trade-offs**: 初期は検索精度より再現性を優先する。
- **Follow-up**: 将来の埋め込み導入時に差し替え可能なインターフェースを維持する。

### Decision: 根拠不足アラートは真偽断定ではなく編集判断支援として扱う
- **Context**: 要件4.4で自動断定禁止が明示されている。
- **Alternatives Considered**:
  1. 根拠不足を自動的に高リスク判定へ直結
  2. 根拠不足を警告として提示し、判断責任は人間に残す
- **Selected Approach**: アラートは警告レイヤに留め、メモで追加確認方針を示す。
- **Rationale**: プロダクト方針（編集支援）と監査可能性に整合する。
- **Trade-offs**: ユーザーが最終判断を行う運用前提が必要。
- **Follow-up**: UI 上で「警告」と「断定」を明確に区別する文言検証が必要。

## Risks & Mitigations
- 重複資料判定の誤差で候補品質が落ちるリスク — URL 正規化とタイトル類似判定の二段階検証を導入する。
- 主張-参照箇所紐づけが曖昧になるリスク — 確度低時の明示フラグと再確認ガイドを必須出力にする。
- クライアント保存データ破損リスク — 入出力バリデーションと復旧時のフォールバック（シードのみ利用）を用意する。

## References
- `app/api/analyze/route.ts` — 既存 API 境界と入力検証の基準
- `lib/analysis.ts` — 現行の主張抽出・リスク判定・根拠候補ロジック
- `data/evidence-sources.ts` — 既存の権威ソースカタログ
- `.kiro/steering/structure.md` — 依存方向と責務分離の制約
