# 技術スタック

## アーキテクチャ

Next.js App Router を土台にした **シングルページ寄りのフルスタック構成**。サーバ側は純粋関数で書かれた解析ロジックを Route Handler が薄くラップし、クライアント側は HeroUI ベースの単一画面アプリ（`StudioApp`）が状態と UI を一括して持つ。永続化は MVP では `localStorage`、本番化に備えて Supabase スキーマ草案を `docs/` に同梱しているという段階的アーキテクチャを取る。

```
[ブラウザ: StudioApp (use client)]
   │  fetch POST
   ▼
[/api/analyze (Route Handler)]
   │  createAnalysis()
   ▼
[lib/analysis.ts (純粋関数, ルールベース)]
   │  evidenceSources を参照
   ▼
[data/evidence-sources.ts]
```

## 中核技術

- **言語**: TypeScript 5.9（strict mode、`noEmit`、`isolatedModules`）
- **フレームワーク**: Next.js 16 App Router（`typedRoutes` 有効、Turbopack 利用）
- **UI ランタイム**: React 19（Server Component を既定、対話部分のみ `"use client"`）
- **スタイル**: Tailwind CSS v4 + `@tailwindcss/postcss` + HeroUI v3
- **アニメーション**: framer-motion（HeroUI 経由）
- **パッケージマネージャ / ランタイム**: Bun（`bun.lock` をコミット、`bun install` / `bun run *` を標準）

## 主要ライブラリの使い分け

- **HeroUI v3 (`@heroui/react`)** — `Button` / `Card` / `Chip` / `Tabs` を中心に使用。新規 UI もまずは HeroUI のプリミティブから組み立て、足りないものだけ自作ヘルパ（`FieldLabel`, `Metric`, `ResultCard` など）として `components/` 内にコロケーションする。独自コンポーネントライブラリの新設は避ける。
- **localStorage** — 監査ログ（`climate-studio-logs` キー）の唯一の永続化先。Supabase 移行までは `useEffect` で読み書きするパターンを踏襲する。
- **Supabase スキーマ草案** — `docs/supabase-schema.sql` に `fact_check_sessions` テーブル定義あり。`ResearchLog` 型のカラム名と一致させ続けることがルール。

## 開発標準

### 型安全

- **TypeScript strict 必須**。`any` は導入しない。外部 JSON は `as Partial<...>` で受けてから必須キーを検証する（例: `app/api/analyze/route.ts` の payload バリデーション）。
- **型 SSOT は `lib/types.ts`**。新しいデータ構造はまずここに追加し、UI とサーバの双方が同じ型をインポートする。
- **DB と UI の命名差**: ドメイン型はキャメルケース（`mediaType`）、ログ型 `ResearchLog` は Supabase スキーマと揃えて **snake_case**（`media_type`）。両者を変換する箇所はログ生成（`StudioApp.saveLog`）に局所化する。

### コード品質

- **ESLint 未導入**。`bun run lint` は実体として `tsc --noEmit` を実行する型チェックのエイリアス。Lint ルールを足したい場合は steering 更新と合わせて議論する。
- **フォーマッタ未指定**。既存ファイルのスタイル（2 スペースインデント、ダブルクォート、末尾セミコロン）に追随する。

### テスト

- **自動テスト未整備**。検証は `bun run typecheck` と `bun run build` の通過、加えて UI の手動確認で代替している。テスト導入時は steering を更新する。

## 開発環境

### 必要ツール

- **Bun**（ローカル実行・パッケージ管理）
- **Node 互換ランタイム**（Next.js 16 / React 19 が動作する環境）

### 標準コマンド

```bash
# 開発サーバ
bun run dev          # next dev (http://localhost:3000)

# 検証
bun run typecheck    # tsc --noEmit
bun run lint         # = typecheck（ESLint なし）
bun run build        # next build

# 本番起動
bun run start        # next start
```

## 重要な技術的決定

- **解析はサーバ側 Route Handler 経由で実行**: クライアントから直接 `lib/analysis.ts` を呼ばず `/api/analyze` 経由にすることで、後で LLM API キーをサーバ環境変数で扱えるようにしている。LLM 化の際もこの境界は維持する。
- **`lib/analysis.ts` は副作用なしの純粋関数**: ルールベース → LLM 置換時に差し替えやすくするため、入出力は `AnalysisRequest` / `AnalysisResult` のみで完結させる。`fetch` や I/O はここに入れない。
- **永続化は段階導入**: 初期は `localStorage`、次フェーズで Supabase。`ResearchLog` の構造が両者の契約面なので、フィールド追加時は CSV ヘッダ（`lib/csv.ts`）と SQL スキーマ（`docs/supabase-schema.sql`）の両方を同期する。
- **言語は日本語が一級市民**: `<html lang="ja">`、UI コピー、ドメイン型のリテラル（`"猛暑"` 等）はすべて日本語。i18n は導入しない方針。
- **`typedRoutes` 有効**: 新しいルート追加時は型生成を待つために `bun run dev` か `bun run build` を一度走らせること。

---
_キーフレームワーク・標準・技術判断の根拠を記載し、依存パッケージの羅列はしない。_
