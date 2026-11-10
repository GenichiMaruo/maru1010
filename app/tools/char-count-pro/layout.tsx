import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Char Count Pro | maru1010.com",
  description: "複数の文書を管理できる、文字数カウント付きのエディタ。目標文字数・検索と置換・左右分割・Markdown 書き出しに対応。",
};

export default function CharCountProLayout({ children }: { children: React.ReactNode }) {
  return children;
}
