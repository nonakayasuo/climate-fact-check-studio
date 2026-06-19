# Research & Design Decisions

## Summary
- **Feature**: `supabase-log-persistence`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 監査ログ機能は `components/studio-app.tsx` の `localStorage` 読み書きに強く結び付いており、永続化先の切替は UI 層とデータアクセス境界の再設計が必要。
  - `docs/supabase-schema.sql` は `fact_check_sessions` テーブル草案を持つが、`ResearchLog.timestamp` と DB の `created_at` 名称差を吸収するマッピング契約が未定義。
  - 無認証・全件共有モデルでは全削除操作の誤爆リスクが高く、確認フローと権限境界を UI と API 双方で強制する必要がある。

## Research Log

### 既存永続化経路の拡張余地
- **Context**: 要件 1, 2, 5, 6 を実現するため、どこで保存責務を持っているか確認した。
- **Sources Consulted**:
  - `components/studio-app.tsx`
  - `lib/csv.ts`
  - `lib/types.ts`
- **Findings**:
  - 起動時ロードと保存は `useEffect` で `climate-studio-logs` キーへ直結している。
  - `saveLog` は `ResearchLog` を UI 内で生成し、そのまま配列先頭へ追加する。
  - CSV は `logs` ステートのみを入力とするため、データソース切替時も同じ `ResearchLog[]` が維持できれば UI 影響は限定的。
- **Implications**:
  - 永続化は `ResearchLogRepository` 境界を新設し、UI は「配列を受け取る/送る」責務に限定する。

### Supabase 契約整合と命名差
- **Context**: 要件 8（契約維持）と要件 7（設定不足の可視化）を満たすための前提を確認した。
- **Sources Consulted**:
  - `docs/supabase-schema.sql`
  - `lib/types.ts`
  - `.kiro/steering/tech.md`
- **Findings**:
  - DB 草案には `created_at` があるが、`ResearchLog` には `timestamp` があるため双方向マッピングが必要。
  - それ以外の業務カラム（`media_type`, `human_rating_trust`, `revision_reason` など）は snake_case で整合している。
  - steering では `ResearchLog` を契約 SSOT とし、CSV ヘッダ/SQL スキーマ同期を必須としている。
- **Implications**:
  - `toDbRow`/`toResearchLog` 変換関数を 1 か所に固定し、UI・API 直書きマッピングを禁止する。

### 無認証共有モデルの削除リスク
- **Context**: 要件 4 と要件 6 の整合（全員閲覧可能 + 全件削除可能）を確認した。
- **Sources Consulted**:
  - `requirements.md`
  - `components/studio-app.tsx`
- **Findings**:
  - 現状の「全削除」は即時実行で確認なし。Supabase 共有テーブルにそのまま適用すると全ユーザー分を破壊する。
  - 要件は `DELETE` 確認語句、件数表示、失敗時の状態保持を明示している。
- **Implications**:
  - UI 側ダイアログ + API 側確認トークン検証の二重ガードを採用し、片側実装漏れを防ぐ。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Browser Direct Supabase | `@supabase/supabase-js` をクライアント直結で利用 | 実装が短い | クライアント側権限管理が散逸しやすく、削除ガードを回避される | 不採用 |
| API-mediated Repository | UI → Next.js Route Handler → Supabase の一方向 | 契約とエラー処理を集約し、鍵露出管理が容易 | API 実装が増える | **採用** |
| Keep localStorage fallback | Supabase + localStorage 併用 | 障害時にローカル継続可能 | 要件 5（完全廃止）と矛盾 | 不採用 |

## Design Decisions

### Decision: 永続化アクセスを `ResearchLogRepository` に集約する
- **Context**: 保存/取得/全削除の契約を 1 箇所で統一する必要がある。
- **Alternatives Considered**:
  1. `StudioApp` から Supabase SDK を直接呼び出す
  2. API Route 経由で Repository が DB アクセスを担当する
- **Selected Approach**: API Route + Repository + Mapper の三層を採用する。
- **Rationale**: UI の状態責務を維持しつつ、要件 7・8 の契約統制を最小の変更範囲で実現できる。
- **Trade-offs**: ネットワーク往復が増えるが、監査・保守性を優先する。
- **Follow-up**: 実装時にレスポンス時間劣化が体感閾値を超えないことを確認する。

### Decision: `timestamp` と `created_at` の変換を明示契約化する
- **Context**: `ResearchLog` と DB 草案の唯一の主要差分を放置すると CSV/表示が崩れる。
- **Alternatives Considered**:
  1. DB スキーマを `timestamp` へ変更
  2. アプリ層で `timestamp` ↔ `created_at` を変換
- **Selected Approach**: 変換関数で吸収し、`ResearchLog` は変更しない。
- **Rationale**: 既存 UI/CSV 契約を壊さずに段階移行できる。
- **Trade-offs**: 変換漏れリスクがあるため、Repository 以外で変換禁止ルールが必要。
- **Follow-up**: 変換関数単体テストを優先対象にする。

### Decision: 全件削除は確認語句 + サーバ検証を必須にする
- **Context**: 誤操作による全データ消失を防ぎたい。
- **Alternatives Considered**:
  1. UI 確認のみ
  2. API 検証のみ
  3. UI と API の二重検証
- **Selected Approach**: `DELETE` 確認語句を UI で強制し、API 側でも一致確認する。
- **Rationale**: 片側欠落時の事故を防ぐ最小コストの防御線。
- **Trade-offs**: 操作手順が増える。
- **Follow-up**: 件数表示とエラーメッセージの文言を QA で確認する。

## Risks & Mitigations
- Supabase 環境変数未設定で機能が全停止するリスク — 起動時設定チェックとユーザー可視エラーを標準化する。
- 共有テーブルへの過剰削除リスク — 確認ダイアログ、確認語句、API 再検証、操作ログを導入する。
- スキーマ進化時の契約ドリフトリスク — `lib/types.ts` / `docs/supabase-schema.sql` / `lib/csv.ts` の同時更新をタスク境界に明記する。

## References
- `components/studio-app.tsx` — 現行の保存・読み出し・削除 UI 実装
- `lib/types.ts` — `ResearchLog` 契約 SSOT
- `lib/csv.ts` — CSV ヘッダ/配列連結ルール
- `docs/supabase-schema.sql` — `fact_check_sessions` テーブル草案
- `.kiro/steering/tech.md` — 段階的 Supabase 移行方針
- `.kiro/steering/structure.md` — 依存方向制約
