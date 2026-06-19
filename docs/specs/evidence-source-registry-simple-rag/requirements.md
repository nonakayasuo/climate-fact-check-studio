# Requirements Document

## Introduction
本仕様は、気候変動報道に関わる編集者・記者・リサーチャーが、記事やSNS投稿に含まれる主張を検証する際に、根拠資料を登録・検索・参照できる機能要件を定義する。PDF/URLを起点とした根拠資料データベースと簡易RAGにより、主張ごとの関連資料提示、参照箇所の明示、根拠不足アラートを実現し、検証作業の速度と再現性を高める。

## Boundary Context (Optional)
- **In scope**:
  - 編集者・記者・リサーチャーが、検証対象の根拠資料を PDF/URL 単位で登録・更新・参照できること
  - 入力テキストから抽出された主張ごとに、関連資料と参照箇所候補を提示できること
  - 根拠が弱い、または未登録資料しか見つからない主張を根拠不足として警告できること
  - AI の編集メモで、主張と出典を対応づけて確認できること
- **Out of scope**:
  - 有料データベースやクローズドソースへの自動ログイン取得
  - 法的最終判断や記事公開可否の自動決定
  - ユーザー認証・権限管理の新規導入
- **Adjacent expectations**:
  - 本機能の出力は既存の分析・編集メモ生成フローで扱える形式を維持すること
  - 最終的な採否判断は人間の編集者が行う前提を維持すること

## Requirements

### Requirement 1: 根拠資料の登録と維持管理
**Objective:** As a 編集者・記者・リサーチャー, I want 検証で使う一次情報を登録して再利用したい, so that 主張検証のたびに同じ資料探索を繰り返さずに済む

#### Acceptance Criteria
1. When 利用者が PDF または URL を根拠資料として登録したとき, the Climate Fact-Check Studio shall 登録可否を明示し、再利用可能な資料として一覧に反映する.
2. If 登録対象が重複資料または参照不能な資料である場合, then the Climate Fact-Check Studio shall 重複または参照不能の理由を利用者に通知する.
3. While 根拠資料が登録済みである間, the Climate Fact-Check Studio shall 資料の出典名、公開元、公開日または更新日、資料種別を利用者が確認できる状態で保持する.
4. The Climate Fact-Check Studio shall 利用者が根拠資料を修正または無効化したときに、以後の参照候補にその状態を反映する.

### Requirement 2: 主張ごとの関連資料検索
**Objective:** As a 編集者・記者・リサーチャー, I want 記事中の主張ごとに関連性の高い根拠資料を自動で受け取りたい, so that 検証に必要な資料へ短時間で到達できる

#### Acceptance Criteria
1. When 利用者が記事本文またはSNS投稿を分析対象として送信したとき, the Climate Fact-Check Studio shall 抽出主張ごとに関連資料候補を提示する.
2. When 主張と登録資料の関連度に差がある場合, the Climate Fact-Check Studio shall 関連度の高い順に候補を提示する.
3. If 主張に対して関連資料候補が見つからない場合, then the Climate Fact-Check Studio shall 候補なしであることを主張単位で明示する.
4. Where 根拠資料候補が提示される場合, the Climate Fact-Check Studio shall 候補ごとに資料タイトルと出典元へのアクセス情報を提示する.

### Requirement 3: 参照箇所と出典紐づけの提示
**Objective:** As a 編集者・記者・リサーチャー, I want 主張に対する参照箇所を確認しながら編集メモを作りたい, so that 出典付きの説明責任を保って原稿修正できる

#### Acceptance Criteria
1. When 主張に関連資料候補が存在するとき, the Climate Fact-Check Studio shall 主張に対応する参照箇所候補を資料単位で提示する.
2. If 参照箇所候補の確度が十分でない場合, then the Climate Fact-Check Studio shall 推定候補であることを明示し、利用者による再確認を促す.
3. While 利用者が編集メモを閲覧している間, the Climate Fact-Check Studio shall 主張と出典を対応づけた形で表示する.
4. The Climate Fact-Check Studio shall 出力された編集メモに、利用者が参照した出典情報を追跡できる識別情報を含める.

### Requirement 4: 根拠不足アラートと判断支援
**Objective:** As a 編集者・記者・リサーチャー, I want 根拠が弱い主張を早期に把握したい, so that 断定表現の見直しや追加取材の判断を行える

#### Acceptance Criteria
1. When 主張に対する根拠資料が見つからないまたは根拠が不十分であると判定されたとき, the Climate Fact-Check Studio shall 根拠不足アラートを主張単位で提示する.
2. If 同一記事内で根拠不足アラートが複数発生した場合, then the Climate Fact-Check Studio shall 利用者が優先確認すべき主張を識別できるように提示する.
3. While 根拠不足アラートが表示されている間, the Climate Fact-Check Studio shall 断定回避または追加確認の方向性を利用者に示す.
4. The Climate Fact-Check Studio shall 根拠不足アラートをもって自動的に記事の真偽を断定しない.
