import { Metadata } from "next";
import PICO88ClientPage from "./client-page";

export const metadata: Metadata = {
  title: "PICO-88 | 8ビット仮想コンピュータ",
  description:
    "ブラウザで体験できる教育・ホビー用途の8ビット仮想コンピュータ。アセンブリ言語プログラミングとレトロコンピューティングを学ぼう。",
};

export default function PICO88Page() {
  return <PICO88ClientPage />;
}
