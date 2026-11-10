// Tailwind がクラス名を検出できるよう、色ごとのクラスは文字列のまま持つ
export const navItems = [
  {
    href: "/projects",
    label: "Projects",
    description: "いま公開している Web アプリと Minecraft MOD",
    color: { text: "text-syntax-type", bg: "bg-syntax-type", border: "border-syntax-type", fill: "group-hover:bg-syntax-type group-focus-within:bg-syntax-type" },
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    description: "ハッカソンや過去の制作物の記録",
    color: { text: "text-syntax-keyword", bg: "bg-syntax-keyword", border: "border-syntax-keyword", fill: "group-hover:bg-syntax-keyword group-focus-within:bg-syntax-keyword" },
  },
  {
    href: "/tools",
    label: "Tools",
    description: "タイマーや文字数カウントなどの小さな道具",
    color: { text: "text-syntax-number", bg: "bg-syntax-number", border: "border-syntax-number", fill: "group-hover:bg-syntax-number group-focus-within:bg-syntax-number" },
  },
];
