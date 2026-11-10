# maru1010.com - Frontend

このリポジトリは、[maru1010.com](https://maru1010.com) のフロントエンドコードを管理しています。  
技術スタックとして [Next.js](https://nextjs.org/)、[Tailwind CSS](https://tailwindcss.com/)、[shadcn/ui](https://ui.shadcn.com/) を使用しています。

## 🔧 使用技術スタック

- **Next.js** - アプリケーションの基盤
- **Tailwind CSS** - ユーティリティファーストなCSSフレームワーク
- **shadcn/ui** - 再利用可能なUIコンポーネント群

## 🚀 デプロイ先

本アプリは以下のURLで公開されています：  
👉 [https://maru1010.com](https://maru1010.com)

## 📦 セットアップ

以下の手順でローカル開発環境を構築できます。

Node.js 22 以上を使用してください（検証環境：Node.js 24）。

### 1. 依存関係のインストール

```bash
npm ci
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで <http://localhost:3000> を開いて確認できます。

### 3. 本番ビルド

```bash
npm run build
```

### 4. 本番サーバーの起動

```bash
npm run start
```

## 📂 ディレクトリ構成（概要）

```csharp
.
├── components/      # 再利用可能なUIコンポーネント
├── app/             # App Routerのページ・グローバルCSS
├── lib/             # 共通処理・制作物データの型と抽出
├── public/          # 静的ファイル
└── ...
```

## 🛠 開発に関するメモ

UIは shadcn/ui をカスタマイズして構築

スタイリングは Tailwind CSS をベースに構成

Tailwind CSS 4 のテーマは app/globals.css で設定

制作物は `app/(main)/portfolio/projects.json` で管理します。トップページ・プロジェクト紹介・ポートフォリオで共通の情報を使用します。公開資料と更新時の注意点は [2026年11月の更新記録](docs/content-refresh-2026-11.md) を参照してください。

```bash
npm run typecheck
npm run lint
npm audit
```

ご質問・不具合報告等がありましたら maru1010.com よりご連絡ください。

## 📄 ライセンス

このプロジェクトは [MIT License](https://opensource.org/license/mit/) の下でライセンスされています。
