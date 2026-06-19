# Requirements Document

## Introduction
本仕様は、気候変動報道に関わる編集者・記者・リサーチャー向けに、記事本文・SNS投稿・見出し案から「検証対象の主張」「リスク」「根拠確認ポイント」「編集者向けメモ」を一貫して生成し、人間が短時間で評価・修正できるファクトチェック支援体験を定義する。現行のルールベース運用で生じる文脈理解不足と表面的な指摘を改善し、編集判断に直接使える出力品質を目標とする。

## Boundary Context (Optional)
- **In scope**:
  - 入力テキストに対して、主張抽出・リスク指摘・根拠確認ポイント・編集者向けメモを同一レスポンスで提示すること
  - 出力を人間レビュー可能な構造化形式で提供し、編集者が追記・修正しやすいこと
  - 断定表現、根拠不足、気象と気候の混同、政策と科学の混在など、既存運用で重要なリスク観点を明示すること
- **Out of scope**:
  - ユーザー認証や権限管理
  - 監査ログ保存先の変更（localStorage から Supabase への移行）
  - 根拠資料 PDF 取り込みや RAG など、外部知識基盤の新規導入
- **Adjacent expectations**:
  - 本機能の出力は既存の人間評価フロー（正確性・有用性・信頼性評価、修正理由記録）でそのまま扱えること
  - 既存 UI の入力形式（タイトル、媒体種別、トピック、本文）を前提とし、操作導線を破壊しないこと

## Requirements

### Requirement 1: 主張抽出の文脈適合性
**Objective:** As a 編集者・記者・リサーチャー, I want 入力文脈に沿った検証対象主張を抽出したい, so that 検証すべきポイントを短時間で把握できる

#### Acceptance Criteria
1. When 編集者が記事本文またはSNS投稿または見出し案を分析対象として送信したとき, the Climate Fact-Check Studio shall 文脈上で検証価値の高い主張を複数件提示する.
2. If 入力文に検証対象となる主張が明確に存在しない場合, then the Climate Fact-Check Studio shall 主張なしを明示したうえで確認対象の不足を利用者に伝える.
3. While 入力に同一内容の言い換えや重複表現が含まれている間, the Climate Fact-Check Studio shall 重複した主張を統合して提示する.
4. The Climate Fact-Check Studio shall 抽出主張を人間がレビューしやすい順序と粒度で提示する.

### Requirement 2: リスクと根拠確認ポイントの明示
**Objective:** As a 編集者・記者・リサーチャー, I want 主張ごとのリスクと根拠確認ポイントを同時に把握したい, so that 科学的に慎重な表現へ修正できる

#### Acceptance Criteria
1. When 主張が抽出されたとき, the Climate Fact-Check Studio shall 各主張に対して主要リスク観点を明示する.
2. If 断定表現・根拠不足・気象と気候の混同・政策と科学の混在のいずれかが検出された場合, then the Climate Fact-Check Studio shall 該当リスクを区別して提示する.
3. Where リスクが提示される場合, the Climate Fact-Check Studio shall 利用者が次に確認すべき根拠観点を具体的に示す.
4. The Climate Fact-Check Studio shall リスク未検出時でも「確認不要」とは断定せず、最終判断は人間が行う前提を保持する.

### Requirement 3: 編集支援メモの実務有用性
**Objective:** As a 編集者・記者・リサーチャー, I want 出力をそのまま編集判断に使えるメモとして受け取りたい, so that 修正作業を効率化できる

#### Acceptance Criteria
1. When 分析結果が返されるとき, the Climate Fact-Check Studio shall 主張・リスク・根拠確認ポイントを統合した編集支援メモを提示する.
2. If 主張の確度や根拠強度が不十分な場合, then the Climate Fact-Check Studio shall 断定回避や表現緩和の方向性をメモ内で提案する.
3. While 利用者が結果をレビューしている間, the Climate Fact-Check Studio shall 内容の読み取りに必要な情報を単一画面内で完結して提示する.
4. The Climate Fact-Check Studio shall 編集者が修正案を作成するために必要な最低限の判断材料を欠落なく提示する.

### Requirement 4: 構造化出力と既存評価フロー整合
**Objective:** As a 編集者・記者・リサーチャー, I want 分析結果を構造化して扱いたい, so that 評価・修正フローへ滑らかに接続できる

#### Acceptance Criteria
1. When 分析結果を返すとき, the Climate Fact-Check Studio shall 主張・リスク・根拠確認ポイント・編集支援メモを構造化データとして返却する.
2. If 分析処理が失敗した場合, then the Climate Fact-Check Studio shall 利用者が再試行または入力見直しを判断できるエラー情報を返す.
3. Where 既存の人間評価フローが有効な環境では, the Climate Fact-Check Studio shall 既存の評価・修正入力を継続して実施できるようにする.
4. The Climate Fact-Check Studio shall 既存の入力項目（タイトル、媒体種別、トピック、本文）で利用可能である.

