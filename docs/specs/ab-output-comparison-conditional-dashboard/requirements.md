# Requirements Document

## Introduction
本仕様は、気候変動報道向け AI 支援ツールの出力を研究的に比較評価するために、A/B/C 条件の提示実験、評価入力、条件別ダッシュボード、統計集計を定義する。研究者・編集者・リサーチャーが、提示形式ごとの正確性・有用性・信頼性・修正理由傾向・過信リスクを手作業ではなく一貫した実験フローで検証できる状態を目標とする。

## Boundary Context (Optional)
- **In scope**:
  - A/B/C 条件の出力を同一評価フローで比較できること
  - 条件のランダム提示と評価フォーム入力を実験記録として保持できること
  - 条件別ダッシュボードで評価統計・修正理由分布・過信リスク指標を確認できること
  - 研究データとして再利用可能な集計結果を抽出できること
- **Out of scope**:
  - 外部統計基盤や BI ツールへの自動連携
  - 研究倫理審査や同意取得プロセスそのものの管理
  - モデル学習や自動最適化による条件生成
- **Adjacent expectations**:
  - 既存の分析入力導線（記事入力〜AI出力取得）を破壊しないこと
  - 最終的な編集判断・公開判断は人間が行う前提を維持すること

## Requirements

### Requirement 1: 条件別出力の比較実験運用
**Objective:** As a 研究者・編集者・リサーチャー, I want A/B/C 条件の出力を同一条件下で比較したい, so that 提示形式ごとの差を公平に把握できる

#### Acceptance Criteria
1. When 利用者が比較実験を開始したとき, the Climate Fact-Check Studio shall 同一入力に対する A/B/C 条件の出力を比較対象として生成または提示する.
2. While 比較実験セッションが有効な間, the Climate Fact-Check Studio shall 条件ラベルと提示順を実験記録として保持する.
3. If いずれかの条件出力が取得できない場合, then the Climate Fact-Check Studio shall 欠損条件を明示して再試行またはスキップ判断を可能にする.
4. The Climate Fact-Check Studio shall 条件差以外の評価前提（入力本文、テーマ、媒体種別）を統一して扱う.

### Requirement 2: ランダム提示と評価入力の一貫収集
**Objective:** As a 研究者・編集者・リサーチャー, I want 条件提示バイアスを抑えて評価を収集したい, so that 比較結果の解釈可能性を高められる

#### Acceptance Criteria
1. When 比較対象を評価画面に表示するとき, the Climate Fact-Check Studio shall 事前定義されたルールに基づき条件提示順をランダム化する.
2. While 評価者が各条件をレビューしている間, the Climate Fact-Check Studio shall 正確性・有用性・信頼性の 5 段階評価を入力可能にする.
3. Where 評価入力が有効な場合, the Climate Fact-Check Studio shall 修正理由と自由記述コメントを条件単位で記録できる.
4. If 評価入力が未完了のまま送信された場合, then the Climate Fact-Check Studio shall 欠落項目を明示して入力完了を促す.

### Requirement 3: 条件別ダッシュボードと評価統計
**Objective:** As a 研究者・編集者・リサーチャー, I want 条件別に統計を可視化したい, so that どの提示形式が実務的に有効か判断できる

#### Acceptance Criteria
1. When 利用者がダッシュボードを開いたとき, the Climate Fact-Check Studio shall 条件別の平均評価（正確性・有用性・信頼性）を表示する.
2. When 条件別統計を表示するとき, the Climate Fact-Check Studio shall 修正理由の分布を比較可能な形式で表示する.
3. If 指定した条件または期間の評価データが不足している場合, then the Climate Fact-Check Studio shall データ不足を明示し、解釈上の注意を提示する.
4. The Climate Fact-Check Studio shall 利用者が条件別統計を研究データとして再確認できる形式で出力可能にする.

### Requirement 4: 過信リスクの可視化と解釈支援
**Objective:** As a 研究者・編集者・リサーチャー, I want 評価上の過信リスクを把握したい, so that 高評価でも不適切な受容を早期に検知できる

#### Acceptance Criteria
1. When 条件別の評価集計を行うとき, the Climate Fact-Check Studio shall 高信頼評価と修正発生の組み合わせを過信リスク指標として算出する.
2. If 過信リスク指標が事前定義した閾値を超える場合, then the Climate Fact-Check Studio shall 条件単位で警告を表示する.
3. While 利用者が過信リスク指標を確認している間, the Climate Fact-Check Studio shall 指標の算出根拠となる評価件数と関連内訳を参照できるようにする.
4. The Climate Fact-Check Studio shall 過信リスク指標をもって出力品質を自動的に断定せず、人間の最終解釈を前提とする.
