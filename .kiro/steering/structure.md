# プロジェクト構造

## 構成思想

Next.js App Router の規約に従いつつ、**「UI / ドメインロジック / データ / ドキュメント」を 4 層で水平分離** する。各層は import 方向が一方向で、`app/` と `components/` が `lib/` と `data/` に依存し、その逆は発生しない。ドメイン型は `lib/types.ts` を SSOT とする。

## ディレクトリの役割

### App Router（ルーティングと API）
**場所**: `app/`
**用途**: ページ・レイアウト・グローバルスタイル・API Route Handler。ビジネスロジックは持たず、`components/` と `lib/` を組み合わせるだけのシン層。
**例**:
- `app/page.tsx` は `<StudioApp />` を 1 行で返すだけ
- `app/api/analyze/route.ts` は payload バリデーションして `lib/analysis.ts` に委譲

### クライアントコンポーネント
**場所**: `components/`
**用途**: `"use client"` を付ける対話 UI と、その内部で使う表示用ヘルパ（`FieldLabel`, `Metric`, `ResultCard`, `SummaryCard`, `EmptyText` 等）を **同一ファイル内にコロケーション** する。汎用化は使い回しが 2 箇所以上発生してから検討。
**例**: `components/studio-app.tsx` がアプリ全体を抱える単一の大きなクライアントコンポーネント

### ドメインロジックと型
**場所**: `lib/`
**用途**: 副作用のない純粋関数と型定義。サーバ・クライアント双方から import される共通レイヤ。外部 I/O（`fetch`、DB、`window` API）は置かない。
**例**:
- `lib/types.ts` 全ドメイン型の SSOT
- `lib/analysis.ts` 主張抽出・リスク判定・メモ生成のルールベース実装
- `lib/csv.ts` `ResearchLog` を CSV 文字列に変換

### 静的シードデータ
**場所**: `data/`
**用途**: コードと一緒にバージョン管理する読み取り専用データ。型は `lib/types.ts` のものを使う。
**例**: `data/evidence-sources.ts` は `EvidenceSource[]` をエクスポート

### 仕様アーティファクト
**場所**: `docs/`
**用途**: 実装ではないが SSOT として保持したい設計成果物（DB スキーマ草案、外部仕様メモ等）。
**例**: `docs/supabase-schema.sql`（`ResearchLog` と整合）

> 仕様駆動開発の成果物（要件・設計・タスク）は別途 `.kiro/specs/` 以下に格納する。`docs/` は実装に直結する技術仕様、`.kiro/specs/` はプロセス成果物、と使い分ける。

## 命名規則

- **ファイル名**: kebab-case（`studio-app.tsx`, `evidence-sources.ts`, `analyze/route.ts`）
- **React コンポーネント**: PascalCase（`StudioApp`, `FieldLabel`, `Metric`）
- **型・型エイリアス**: PascalCase（`AnalysisResult`, `ResearchLog`, `EvidenceSource`）
- **関数・変数**: camelCase（`createAnalysis`, `evidenceSources`）
- **ドメイン型のリテラル値**: 日本語（`"猛暑"`, `"新聞記事"` 等）。トピックや媒体種別の追加時は `Topic` / `MediaType` の Union を更新し、UI 側の `topics` / `mediaTypes` 配列、`evidence-sources.ts` のテーマ、CSV ヘッダの整合性を順に確認する。
- **`ResearchLog` のフィールド**: snake_case（`media_type`, `human_rating_trust`, `revision_reason`）。これは Supabase スキーマ（`docs/supabase-schema.sql`）および CSV ヘッダ（`lib/csv.ts`）と完全一致させるための例外。

## インポート規則

```typescript
// 絶対パス（@/ エイリアス、tsconfig の baseUrl はプロジェクトルート）
import { evidenceSources } from "@/data/evidence-sources";
import type { AnalysisRequest } from "@/lib/types";
import { StudioApp } from "@/components/studio-app";

// 相対パス
import "./globals.css";   // 同階層の副作用 import のみ
```

**パスエイリアス**:
- `@/*` → プロジェクトルート（`./*`）。`lib/`, `data/`, `components/`, `app/` どれを指すときも `@/` を使う。

**規則**:
- **クロスディレクトリ参照は必ず `@/`**。`../../lib/...` のような相対は使わない。
- **同階層・同ファイル群への参照だけ相対**（CSS の副作用 import 等）。
- **`type` import を明示**: 型のみ使う場合は `import type { ... }` と書く（`isolatedModules` 配下の最適化のため）。

## コード構成原則

- **依存方向**: `app/` → `components/` → `lib/` ← `data/`。`lib/` から `components/` や `app/` を参照しない。
- **`lib/analysis.ts` は純粋関数のみ**: LLM への置換余地を残すため `fetch`・乱数・`Date.now()` といった副作用は入れない。タイムスタンプや `crypto.randomUUID()` は呼び出し側（`StudioApp.saveLog`）で付与する。
- **クライアントコンポーネントの境界**: `app/` のレイアウト・ページは Server Component を既定とし、対話・ブラウザ API（`localStorage`、`URL.createObjectURL`）が必要な部分のみ `components/` で `"use client"` 化する。
- **状態管理**: `useState` + `useEffect` の組み合わせを基本とする。状態管理ライブラリは導入しない。`StudioApp` 一画面で完結している間はこの方針を維持する。
- **データ契約の同期**: `ResearchLog` を変更した場合は、`lib/csv.ts` の `headers`、`docs/supabase-schema.sql` のカラム定義、`StudioApp.saveLog` の組み立てロジックの **3 点を同時に更新** する。

---
_ファイルツリーの羅列ではなく、新規ファイルがパターンに従う限り更新不要なレベルのルールを記載する。_
