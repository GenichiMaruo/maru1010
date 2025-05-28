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

### 1. 依存関係のインストール

```bash
npm install
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
├── pages/           # Next.jsのルーティングページ
├── styles/          # TailwindやグローバルCSS
├── public/          # 静的ファイル
└── ...
```

## 🛠 開発に関するメモ

UIは shadcn/ui をカスタマイズして構築

スタイリングは Tailwind CSS をベースに構成

必要に応じて tailwind.config.js を編集してユーティリティを拡張可能

ご質問・不具合報告等がありましたら maru1010.com よりご連絡ください。

## 📄 ライセンス

このプロジェクトは [MIT License](https://opensource.org/license/mit/) の下でライセンスされています。
