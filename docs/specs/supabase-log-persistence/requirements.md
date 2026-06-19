# Requirements Document

## Project Description (Input)

**Climate Fact-Check Studio** の編集者・研究者は、ファクトチェック作業のたびに記録した監査ログ（`ResearchLog`）を継続的に蓄積したい。しかし現状は `localStorage`（`climate-studio-logs` キー）にのみ保存されており、ブラウザを変えると参照できず、デバイス間共有・共同研究データ化ができない。本スペックでは、`docs/supabase-schema.sql` に既に草案がある `fact_check_sessions` テーブルを Supabase 上に正式に立ち上げ、`ResearchLog` の保存先を **Supabase に完全に置き換える** ことを目的とする。

### 現状（Current Situation）

- 監査ログは `components/studio-app.tsx` の `saveLog` で `localStorage` に書き込まれ、同じキーから読み込んで一覧表示・CSV エクスポートしている。
- Supabase スキーマ（`docs/supabase-schema.sql`）と `lib/types.ts: ResearchLog`（snake_case）は事前に整合済みだが、実際の Supabase 接続コード・テーブルは未稼働。
- 結果として、ブラウザ／デバイスをまたいだ研究データ蓄積、複数編集者間でのログ共有、CSV による横断分析が成立していない。

### 変更内容（What Should Change）

- `fact_check_sessions` テーブルを Supabase 上にプロビジョニングし、本機能リリース以降の `ResearchLog` をすべて Supabase に保存する。
- 一覧表示・CSV エクスポートの読み出し元を Supabase に切り替え、`localStorage` への保存／読み出しは廃止する。
- 既存の `lib/analysis.ts` の純粋関数性、`/api/analyze` のサーバ境界、`StudioApp` の単一画面構成は維持する。

### スコープ

- **認証**: 認証は導入しない。Supabase の anon キー＋RLS で全員が単一テーブルを共有する研究プロトタイプ運用を前提とする。
- **localStorage 戦略**: 完全置換。`localStorage` への書き込みは廃止し、Supabase を唯一の真実の保存先とする。
- **既存データ移行**: 行わない。`localStorage` に残っている過去ログのインポート機能は提供せず、本リリース以降の新規ログのみを Supabase に保存する。
- **閲覧範囲**: 全ユーザーが全レコードを閲覧および CSV エクスポートできる無差別共有モデル。
- **削除**: 「全削除」ボタンは維持するが、押下時に明示的な確認ダイアログを必須とする。

### スコープ外

- Supabase Auth、ログイン UI、ユーザー単位のアクセス制御。
- 既存 `localStorage` データの一括インポート機能。
- ログの編集・1 件単位削除の UI。
- `lib/analysis.ts` の LLM 化や RAG 導入など、解析ロジック側の変更。

### 契約面の注意

- `lib/types.ts: ResearchLog`（snake_case）と `docs/supabase-schema.sql` の `fact_check_sessions` 列定義を SSOT とする。差分が生じた場合は両者を同期する。
- CSV 出力（`lib/csv.ts`）は Supabase 由来のレコードを `ResearchLog` 型に揃えて流すことで、ヘッダ・並び順を変えずに挙動を維持する。
- Supabase クライアントの初期化と接続情報（環境変数）は、`/api/analyze` と同様に Next.js のサーバ／クライアント境界の方針に整合させる。

## Introduction

本仕様は、Climate Fact-Check Studio における監査ログ（`ResearchLog`）の永続化先を、ブラウザ単独の `localStorage` から Supabase の `fact_check_sessions` テーブルへ完全に切り替えるための要件を定義する。研究プロトタイプ用途として認証を導入せず、anon 公開鍵と Supabase 側のテーブル単位アクセス制御によって、全ユーザーが単一テーブルを共有・閲覧・CSV 出力できる無差別共有モデルを採用する。既存の `localStorage` データの移行は行わず、本リリース以降に保存されたログのみが Supabase 上に蓄積される。

## Boundary Context

- **In scope**:
  - 監査ログの新規保存先を Supabase の `fact_check_sessions` テーブルに切り替える
  - Logs タブ・Dashboard タブ・サイドバー指標が Supabase 上のレコードから描画される
  - CSV エクスポートが Supabase 上の全レコードから生成される
  - `localStorage` への書き込み・読み出しの完全停止
  - 全件削除操作の安全化（明示的確認）
  - Supabase 接続設定の不足や鍵露出に対するユーザー／オペレータ可視のエラー扱い
- **Out of scope**:
  - Supabase Auth、ログイン UI、ユーザー単位のレコード分離
  - 既存 `localStorage` データの自動／手動インポート
  - 1 件単位の編集・削除 UI、ソフトデリート、履歴管理
  - `lib/analysis.ts` の LLM 化、RAG、解析アルゴリズム変更
- **Adjacent expectations**:
  - `lib/types.ts: ResearchLog` と `docs/supabase-schema.sql` の `fact_check_sessions` がフィールド契約の SSOT として整合し続けること
  - CSV ヘッダ仕様（`lib/csv.ts`）が `ResearchLog` のフィールド集合と一致し続けること
  - `/api/analyze` の Route Handler 境界、`lib/analysis.ts` の副作用ゼロ性、`StudioApp` の単一画面構成は本仕様で変更しない
  - Supabase 側のテーブル作成・RLS ポリシー設定は本仕様の対象だが、組織内の Supabase プロジェクト発行や課金管理は対象外

## Requirements

### Requirement 1: Supabase への監査ログ保存

**Objective:** As a 編集者・研究者, I want ファクトチェックセッションの監査ログを Supabase に永続化したい, so that ブラウザやデバイスを変えても同じ研究データを参照できる

#### Acceptance Criteria

1. When 編集者が分析結果を確認したのち「ログを保存」ボタンを押下する, the Climate Fact-Check Studio shall `ResearchLog` の全フィールドを `fact_check_sessions` テーブルに 1 件のレコードとして保存する
2. When ログ保存が成功した, the Climate Fact-Check Studio shall 画面上のログ一覧の最上部に当該レコードを反映し、入力中の評価値・修正テキスト・修正理由をリセットする
3. If ログ保存が失敗した（接続不可・権限拒否・サーバ側エラーいずれの原因でも）, then the Climate Fact-Check Studio shall ユーザーに失敗内容を識別できるエラー通知を表示し、入力中の評価値・修正テキスト・修正理由を破棄せずに保持して同じ操作で再送信できる状態を維持する
4. The Climate Fact-Check Studio shall 1 度の「ログを保存」操作に対して重複した複数レコードを生成しない

### Requirement 2: 監査ログの読み出しと表示

**Objective:** As a 編集者・研究者, I want 過去に蓄積された監査ログを起動直後から閲覧したい, so that 自分や他者の過去セッションを横断的に振り返り研究データとして活用できる

#### Acceptance Criteria

1. When Climate Fact-Check Studio が初期描画される, the Climate Fact-Check Studio shall `fact_check_sessions` から監査ログを取得し、Logs タブの一覧、Dashboard タブの集計（評価平均・修正理由分布・トピック別件数）、サイドバーのメトリクス（セッション数・平均信頼性・リスク件数）に反映する
2. While 監査ログの初期取得が進行中である, the Climate Fact-Check Studio shall 取得未完了であることをユーザーが判別できる表示状態（読み込み表示、または空表示の明示）を提供する
3. The Climate Fact-Check Studio shall 取得した監査ログを保存日時の新しい順に並べて Logs タブに表示する
4. If 監査ログの取得が失敗した, then the Climate Fact-Check Studio shall ユーザーに失敗内容を識別できるエラー通知を表示し、再試行できる手段を提供する
5. When 編集者が新しいログの保存に成功した直後, the Climate Fact-Check Studio shall 追加レコードを再取得待ちなしに一覧と集計へ反映する

### Requirement 3: CSV エクスポート

**Objective:** As a 編集者・研究者, I want Supabase 上の全監査ログを CSV で書き出したい, so that 研究データとして外部分析や共有に利用できる

#### Acceptance Criteria

1. When 編集者が Dashboard タブの「CSV出力」ボタンを押下する, the Climate Fact-Check Studio shall その時点で Supabase から取得済みの監査ログ全件を CSV ファイル `climate-fact-check-logs.csv` としてダウンロードする
2. The Climate Fact-Check Studio shall CSV のヘッダ順序を既存仕様（`timestamp, title, media_type, topic, input_text, claims, ai_memo, sources, risks, human_rating_accuracy, human_rating_usefulness, human_rating_trust, human_revision, revision_reason`）と一致させる
3. While 監査ログが 0 件である, the Climate Fact-Check Studio shall 「CSV出力」ボタンを無効状態にして押下不能にする
4. The Climate Fact-Check Studio shall 配列フィールド（`claims`, `sources`, `risks`, `revision_reason`）を 1 セルにまとめ、各値を `;` 区切りで連結する既存挙動を維持する
5. If `ResearchLog` 型に新しいフィールドが追加された, then the Climate Fact-Check Studio shall CSV ヘッダと出力行の双方に同じフィールドを反映し、Supabase 保存／読み出し／CSV 出力のいずれにおいても欠落させない

### Requirement 4: 共有モデルと閲覧範囲

**Objective:** As a 編集者・研究者, I want 全員が全監査ログを共有テーブル上で閲覧したい, so that ログイン手続きなしに研究プロトタイプとして即時共同利用できる

#### Acceptance Criteria

1. The Climate Fact-Check Studio shall ユーザー識別やログインを要求せず、任意の閲覧者が起動時点ですべての監査ログを閲覧および CSV 出力できる
2. The Climate Fact-Check Studio shall ログ保存の許可をユーザー識別ではなく Supabase 側のテーブル単位アクセス制御（公開書込許可）に委ねる
3. The Climate Fact-Check Studio shall 監査ログを 1 つの共有テーブルに保存し、ユーザーごとの分離テーブルや行レベルの所有者制限を設けない

### Requirement 5: localStorage の完全廃止

**Objective:** As a プロジェクトのメンテナ, I want `localStorage` 由来の永続化経路を残さないようにしたい, so that 「ローカルにだけログが残る」状態を防ぎ、Supabase を唯一の真実とする運用を保証できる

#### Acceptance Criteria

1. The Climate Fact-Check Studio shall 監査ログ保存処理の中で `climate-studio-logs` キーを含むいかなる `localStorage` への書き込みも行わない
2. The Climate Fact-Check Studio shall 起動時に `climate-studio-logs` キーから監査ログを読み出さない
3. The Climate Fact-Check Studio shall 既存の `localStorage` データを Supabase へインポートする UI ないし内部処理を提供しない
4. While 既存の `climate-studio-logs` 値がブラウザに残っている, the Climate Fact-Check Studio shall その値を読み出しも上書きもせず、画面表示・統計・CSV 出力のいずれにも反映しない

### Requirement 6: 全件削除の安全な実行

**Objective:** As a 編集者・研究者, I want 共有テーブルの全レコード削除を誤操作なしで行いたい, so that テスト・リセット時に研究データを破壊してしまう事故を回避できる

#### Acceptance Criteria

1. When 編集者が Logs タブの「全削除」ボタンを押下する, the Climate Fact-Check Studio shall 削除実行前に明示的な確認ダイアログを表示し、(a) これから削除されるレコード件数、(b) 全ユーザー分のレコードが対象であること、(c) 取り消し不能であることを提示する
2. When 確認ダイアログ上で編集者が確認語句として `DELETE` を入力したうえで実行を承認する, the Climate Fact-Check Studio shall `fact_check_sessions` テーブルから全レコードを削除する
3. If 編集者が確認ダイアログをキャンセルする、または確認語句が `DELETE` と一致しない, then the Climate Fact-Check Studio shall いかなる削除も実行せず、ログ一覧と統計を変更しない
4. When 全件削除が成功する, the Climate Fact-Check Studio shall 画面上のログ一覧、Dashboard の集計、サイドバーのメトリクスを即時に空状態へ更新する
5. While 監査ログが 0 件である, the Climate Fact-Check Studio shall 「全削除」ボタンを無効状態にして押下不能にする
6. If 全件削除が失敗した, then the Climate Fact-Check Studio shall ユーザーに失敗内容を識別できるエラー通知を表示し、画面上のログ一覧と統計を削除前の状態のまま保つ

### Requirement 7: 接続設定の可視性とシークレット保護

**Objective:** As a プロジェクトのメンテナ, I want Supabase 接続情報の不足や誤露出を早期に把握したい, so that 「黙って保存できない」状態や鍵流出の事故を防げる

#### Acceptance Criteria

1. If Supabase 接続に必要な設定（プロジェクト URL・公開鍵）が起動環境に欠けている, then the Climate Fact-Check Studio shall 監査ログの保存・読み出し・全件削除のいずれの操作についても、ユーザーに対して設定不足を識別できるエラー通知を表示する
2. The Climate Fact-Check Studio shall ブラウザに配信されるアセットおよびネットワーク応答に、`fact_check_sessions` テーブルへの無制限な書込・削除権限を持つ特権鍵を含めない
3. The Climate Fact-Check Studio shall プロジェクトに必要な Supabase 側のテーブル定義および公開アクセス制御の設定手順を、リポジトリ内のドキュメントとして提示する

### Requirement 8: ResearchLog 契約の維持

**Objective:** As a プロジェクトのメンテナ, I want `ResearchLog` のフィールド契約を保存・読み出し・CSV の三者で一致させ続けたい, so that フィールド追加時にデータ欠落が発生せず、CSV 分析や Supabase 上のデータが破綻しない

#### Acceptance Criteria

1. When 編集者がログを保存する, the Climate Fact-Check Studio shall `ResearchLog` 型の全フィールド（`id`, `timestamp`, `input_text`, `title`, `media_type`, `topic`, `claims`, `ai_memo`, `sources`, `risks`, `human_rating_accuracy`, `human_rating_usefulness`, `human_rating_trust`, `human_revision`, `revision_reason`）を欠落なく保存する
2. When 監査ログを Supabase から読み出す, the Climate Fact-Check Studio shall 各レコードを `ResearchLog` 型と同等の構造として復元し、保存時と同じフィールド値で UI と CSV に提示する
3. The Climate Fact-Check Studio shall フィールド名のスネークケース表記（`media_type`, `human_rating_trust`, `revision_reason` 等）を Supabase 側カラム名と一致させ、保存と読み出しの間で命名変換による欠損や型崩れを起こさない
4. While `ResearchLog` 型と `fact_check_sessions` のスキーマが食い違っている, the Climate Fact-Check Studio shall 該当レコードの保存または読み出しでユーザーに対して契約不整合を識別できるエラー通知を表示し、不整合のままサイレントに欠落させない
