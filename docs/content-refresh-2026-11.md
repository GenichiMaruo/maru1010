# 2026年11月のコンテンツ更新

確認日：2026-11-10（日本時間）。新規掲載内容は、公開状態を確認した GitHub リポジトリの README と package.json を根拠にしています。非公開リポジトリ・Issue・個人情報は使用していません。プロフィールの M2 表記は本人の指示による更新です。

## 新規掲載

| 制作物 | 公開資料 | 掲載上の注意 |
| --- | --- | --- |
| Singulo | [README](https://github.com/GenichiMaruo/Singulo/blob/1.21.1/README.md) | 1.21.1 は NeoForge、1.20.1 は Forge / NeoForge。物理学を題材にしたゲームとして紹介。 |
| Singulo Arsenal | [README](https://github.com/GenichiMaruo/Singulo-Arsenal/blob/1.21.1/README.md) | 初回 Beta。本体 0.16 系が必要。将来の 1.20.1 対応を実装済みとして扱わない。 |
| Worldgen Assist | [README](https://github.com/GenichiMaruo/WorldgenAssist/blob/main/README.md) | 信頼できる参加者向けの実験的 Beta。シードの共有と初期状態での支援無効を明記。一律の高速化を主張しない。 |
| NandTick | [README](https://github.com/GenichiMaruo/NandTick/blob/main/README.md) / [package.json](https://github.com/GenichiMaruo/NandTick/blob/main/package.json) | ブラウザ内での回路編集・シミュレーション。公開リポジトリの homepage をアプリのリンクとして採用。 |
| RenDot | [README](https://github.com/GenichiMaruo/RenDot/blob/main/README.md) / [package.json](https://github.com/GenichiMaruo/RenDot/blob/main/package.json) | QR ライク形式は独自形式。標準 QR コードと混同しない。公開リポジトリの homepage をリンクとして採用。 |

リポジトリ作成日は GitHub の `created_at` を使用し、開発開始日・開発期間とは区別しています。新作の画像部分はサイト内のアイコンによるイメージ表示で、実際のゲーム画面ではありません。従来の制作物・受賞歴は既存の掲載記録を維持しています。

## コンテンツの管理

データは `app/(main)/portfolio/projects.json`、型と一覧の抽出は `lib/projects.ts` で管理します。

- `featured: true`：プロジェクト紹介に表示。
- `verifiedAt`：公開情報の確認日。新作をトップの「最近の制作物」に表示。
- `sources`：詳細画面に表示する公開資料。
- `repositoryCreatedAt`：リポジトリの作成日。制作期間には使用しない。

## パッケージ更新

Next.js 16.4.6、React 19.3.1、Tiptap 3.33.0、Tailwind CSS 4.3.5 へ更新。Radix UI、Lucide、marked、diff なども更新しました。ESLint 設定は Next.js 16 と同世代の flat config に移行し、廃止済みの `next lint` を ESLint CLI に置き換えています。

- KaTeX は **0.18.10 に固定**。作業開始時に存在した 0.19.1 への変更は Tiptap mathematics 3.33.0 の peer dependency 範囲外でした。0.18.11 は破壊的変更を含む誤公開として非推奨のため採用していません。
- `@tailwindcss/typography` の `postcss-selector-parser` と `@typescript-eslint/typescript-estree` の `minimatch` は、脆弱性修正版へ限定的に override しています。親パッケージが対応した時点で削除を検討してください。
- TypeScript は互換性を保つ 5.9 系、ESLint は既存のプラグイン構成に合わせて 9 系を維持。Node.js は 22 以上を指定し、Node.js 24 で検証しています。
- `@types/diff` / `@types/uuid` は本体に型定義が含まれるため削除。直接 import している `@tiptap/pm` を直接依存として追加しました。

## 検証と制約

- `npm run build`：成功。全ページを静的生成。
- `npm run typecheck`：成功。
- `npm audit`：脆弱性 0 件。
- 新しい React Hooks の lint ルールにより、既存のエディタ・タイマーなどに指摘があります。ルールを無効化して隠す変更は行っていません。
- Windows のブラウザ操作ツールが現在の URL を確認できず停止したため、実ブラウザによる表示・操作検証は未実施。
- Git commit・push・本番デプロイは実施していません。

## デザイン刷新後の不要ファイル整理

新デザインからの参照を確認し、旧コイントスアバター、未使用のフローティングエディタ・UI 部品・拡張、重複ページ、読み込まれない metadata ファイルなど、ソース15ファイルと公開アセット8ファイルを削除しました。旧背景・コイントス用の CSS と不要な React import も削除しています。空の検証用フォルダ12個を整理し、検証用出力は `.gitignore` に追加しました。

直接依存から `diff`、`diff2html`、`react-diff-view`、`uuid`、`@types/katex`、`@tailwindcss/typography`、未使用の Radix UI 5件を削除しました。typography 用の override も不要になったため削除しています。間接依存を含めてインストール済みパッケージは24件減少しました。

実際にコードから使用している `highlight.js` と `@tiptap/extension-strike` は、既存のインストール済みバージョンを直接依存として明示しました。ProseMirror の import は、既に直接依存にある `@tiptap/pm` 経由へ統一しています。

削除後の参照解析では、ページから到達しないソース・未宣言のパッケージ import・参照されない公開アセットはいずれも0件でした。lint の既存指摘は整理前後とも44件で、今回の整理による増加はありません。
