# Research & Design Decisions

## Summary
- **Feature**: `ab-output-comparison-conditional-dashboard`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 既存 `StudioApp` は単一分析結果と単一評価入力を前提としており、条件比較の単位（condition/session）が未定義。
  - 既存 `ResearchLog` と `logsToCsv` は条件列を持たないため、条件別統計と過信リスク指標の算出にはログ契約拡張が必要。
  - 既存 Dashboard は全体平均のみの集計で、条件別集計・ランダム提示順の追跡情報を保持していない。

## Research Log

### 既存評価フローの拡張可能性
- **Context**: A/B/C 比較実験を既存画面へどう統合するかを判断するため。
- **Sources Consulted**:
  - `components/studio-app.tsx`
  - `app/api/analyze/route.ts`
- **Findings**:
  - 現状は「1入力 -> 1分析結果 -> 1評価」の直列フロー。
  - 分析APIは単一条件を想定し、比較用メタ情報を受け取らない。
  - UI側で評価収集ロジックがまとまっており、比較実験管理の挿入点は明確。
- **Implications**:
  - 比較実験オーケストレータを UI 主体で追加し、条件出力・ランダム順・評価入力をセッション単位で扱う設計が妥当。

### データ契約と集計の制約
- **Context**: 条件別統計・過信リスク可視化の実装前提を確認するため。
- **Sources Consulted**:
  - `lib/types.ts`
  - `lib/csv.ts`
- **Findings**:
  - `ResearchLog` は条件ID、表示順、実験セッション識別子を持たない。
  - CSV出力ヘッダは既存ログ項目固定で、条件別分析列が不足。
  - 過信リスク（高信頼かつ修正発生）を直接算出するフィールドは派生計算で対応可能。
- **Implications**:
  - ログ契約を拡張し、条件比較に必要な最小メタデータを追加する。
  - ダッシュボードは拡張列を前提に条件別集計器を導入する。

### 依存方向と責務分離
- **Context**: 既存steeringの責務分離を保持しつつ機能追加できるかを確認するため。
- **Sources Consulted**:
  - `.kiro/steering/structure.md`
  - `.kiro/steering/tech.md`
- **Findings**:
  - UI状態管理は `StudioApp` に集約されており、比較セッション状態の拡張先として一貫性がある。
  - 集計ロジックを `lib` へ抽出すれば UI 複雑化と表示ロジックの結合を抑制できる。
- **Implications**:
  - `lib` へ比較実験・統計集計の純粋関数を追加し、UI は入力/表示責務に集中する。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| UI-only comparison state | すべてを `StudioApp` 内状態で処理 | 追加ファイルが少ない | 集計・検証責務が肥大化 | 短期実装向けだが保守性が低い |
| Session model + analytics modules | 比較セッションモデルと集計モジュールを分離 | 責務が明確、再利用しやすい | 型拡張と移行が必要 | **採用** |
| External analytics stack first | BI/外部分析基盤を先行導入 | 高度分析に拡張しやすい | 現MVP範囲を超える | 今回は非採用 |

## Design Decisions

### Decision: 比較実験を「セッション単位」で扱う
- **Context**: A/B/C の提示順と評価を一貫して追跡する必要がある。
- **Alternatives Considered**:
  1. 条件ごとの独立ログを都度保存する
  2. 実験セッションを定義し、条件・提示順・評価をまとめて保持する
- **Selected Approach**: セッションIDを軸に条件評価を保持し、条件ごとに評価エントリを紐づける。
- **Rationale**: ランダム提示順の追跡と条件比較集計を安定して行える。
- **Trade-offs**: 既存ログモデルへの後方互換対応が必要。
- **Follow-up**: 既存ログから拡張ログへの互換読み込みを検証する。

### Decision: 過信リスクは派生指標として算出する
- **Context**: 高信頼評価でも修正が多い条件を可視化したい。
- **Alternatives Considered**:
  1. 過信リスクを手入力で記録
  2. 既存評価項目（trust, revision）から派生計算
- **Selected Approach**: 高信頼かつ修正発生の割合を条件別に算出する派生指標を採用。
- **Rationale**: 追加入力負荷を増やさず、既存評価データから再現可能に計算できる。
- **Trade-offs**: 閾値設計を誤ると解釈が過敏または鈍感になる。
- **Follow-up**: 実験初期データで閾値チューニングを行う。

### Decision: ダッシュボード集計は条件別の軽量集計器で実装する
- **Context**: 既存ダッシュボードは全体集計のみで条件比較ができない。
- **Alternatives Considered**:
  1. UI 内で都度集計
  2. `lib` に条件別集計器を追加
- **Selected Approach**: 条件別平均・分布・リスク算出を `lib` の純粋関数として実装する。
- **Rationale**: テスト可能性と再利用性が高く、UI複雑度を抑えられる。
- **Trade-offs**: 初期設計コストは増える。
- **Follow-up**: Unitテストで集計の境界ケースを網羅する。

## Risks & Mitigations
- ランダム提示順の偏りリスク — セッション単位で提示順を保存し、後から偏りを検証可能にする。
- ログ互換性破壊リスク — 旧ログ読み込み時のデフォルト条件を定義し、移行失敗を防ぐ。
- ダッシュボード解釈過信リスク — データ不足時に注意表示を必須化し、統計の信頼区間不足を明示する。

## References
- `components/studio-app.tsx` — 現行の分析・評価・ダッシュボード導線
- `lib/types.ts` — 既存ログ・分析契約の型定義
- `lib/csv.ts` — 研究データ出力の現行契約
- `.kiro/steering/structure.md` — 依存方向と責務分離制約
