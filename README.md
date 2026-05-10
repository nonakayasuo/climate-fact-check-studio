# Climate Fact-Check Studio

気候変動報道向けのAIファクトチェック支援基盤です。共有チャットの構想をもとに、まずは研究プロトタイプとして「入力、主張抽出、リスク判定、編集支援メモ、人間評価、監査ログ、CSV出力」までをローカルで動かせる形にしています。

## 現在のMVP

- 記事・SNS投稿・見出しの入力
- 主張抽出のルールベース試作
- 断定表現、根拠不足、気象と気候の混同などのリスク判定
- IPCC、気象庁、環境省、国立環境研究所の根拠候補表示
- 編集者向け確認メモ生成
- 5段階の正確性・有用性・信頼性評価
- 人間修正ログと修正理由タグの保存
- 研究用CSVエクスポート
- localStorageによる監査ログ保存

## 起動

```bash
npm run dev
```

ブラウザで `http://localhost:4173` を開きます。依存関係はありません。

## 研究データ項目

CSVには以下を出力します。

- `timestamp`
- `title`
- `media_type`
- `topic`
- `input_text`
- `claims`
- `ai_memo`
- `sources`
- `risks`
- `human_rating_accuracy`
- `human_rating_usefulness`
- `human_rating_trust`
- `human_revision`
- `revision_reason`

## 次の実装候補

1. OpenAI APIによる主張抽出と編集支援メモ生成
2. Supabase保存への切り替え
3. 根拠資料PDF/URL登録と簡易RAG
4. A/B出力比較実験
5. 条件別ダッシュボードと評価統計

## GitHub連携メモ

この環境ではGitHub Appで既存リポジトリ操作は可能ですが、新規リポジトリ作成APIが露出していません。`gh` CLIの認証を直した後、以下でリモート作成とpushができます。

```bash
gh auth login -h github.com
gh repo create nonakayasuo/climate-fact-check-studio --private --source=. --remote=origin --push
```
