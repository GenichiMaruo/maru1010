import Link from "next/link";
import { navItems } from "@/lib/nav";
import { shortHash } from "@/lib/hash";
import { LanguageBar } from "@/components/LanguageBar";
import { LifeBackground } from "@/components/LifeBackground";

const remotes = [
  { href: "https://github.com/GenichiMaruo", label: "github" },
  { href: "https://x.com/maru1010robo16", label: "x" },
  {
    href: "https://www.facebook.com/profile.php?id=100029838533241",
    label: "facebook",
  },
];

// コミットグラフの線。ホバー中のコミットと、それより上（HEAD 側）の線を点灯させる。
// 点灯の色は、ホバー中の項目の丸と同じ色（--graph-lit。globals.css の .commit-graph で切り替える）
const edge = "absolute left-[5px] w-0.5 bg-border transition-colors duration-150";
// Tailwind がクラス名を検出できるよう、組み立てずにそのまま書く
const lit =
  "group-hover:bg-[var(--graph-lit)] group-focus-within:bg-[var(--graph-lit)] [li:has(~li:hover)_&]:bg-[var(--graph-lit)] [li:has(~li:focus-within)_&]:bg-[var(--graph-lit)]";
const litBelow = "[li:has(~li:hover)_&]:bg-[var(--graph-lit)] [li:has(~li:focus-within)_&]:bg-[var(--graph-lit)]";

export default function Home() {
  return (
    <div className="relative isolate flex min-h-svh flex-col bg-background px-6 font-mono sm:px-10">
      <LifeBackground />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-24">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Genichi Maruo
          <span aria-hidden="true" className="cursor-blink ml-1 inline-block h-[0.8em] w-[0.45em] translate-y-[0.08em] bg-brand" />
        </h1>
        <p className="mt-4 text-xs leading-relaxed text-syntax-comment sm:text-sm">
          {"// Web アプリ・学習用シミュレータ・Minecraft MOD を制作"}
        </p>

        <div className="mt-8 max-w-md">
          <LanguageBar />
        </div>

        <nav aria-label="サイト内の主なページ" className="mt-14">
          <p className="text-xs text-muted-foreground">
            <span className="text-brand">$</span> git log --graph --oneline
          </p>
          <ul className="commit-graph mt-4">
            {navItems.map(({ href, description, color }, i) => {
              const first = i === 0;
              const last = i === navItems.length - 1;
              const name = href.slice(1);
              return (
                <li key={href} className="group relative" data-branch={color.text.replace("text-syntax-", "")}>
                  {/* 丸と線は 1 行目（ページ名の行）の高さに合わせる */}
                  {!first && <span aria-hidden="true" className={`${edge} top-0 h-6 ${lit}`} />}
                  {!last && <span aria-hidden="true" className={`${edge} top-6 bottom-0 ${litBelow}`} />}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-6 h-3 w-3 -translate-y-1/2 rounded-full border-2 bg-background transition-all duration-150 group-hover:scale-125 group-focus-within:scale-125 ${color.border} ${color.fill}`}
                  />
                  {/* git log の「1 行目が件名、2 行目以降が本文」と同じ形。説明は常に 2 行目に置く */}
                  <Link href={href} className="ml-7 block py-3 text-sm focus-visible:outline-none">
                    <span className="flex flex-wrap items-baseline gap-x-3 leading-6">
                      <span aria-hidden="true" className="hidden text-syntax-comment sm:inline">{shortHash(name)}</span>
                      <span aria-hidden="true" className="text-muted-foreground">
                        (
                        {first && <span className="text-brand">HEAD -&gt; main, </span>}
                        <span className={color.text}>{name}</span>)
                      </span>
                      <span className="text-base text-foreground underline-offset-4 group-hover:underline group-focus-within:underline">
                        {name}
                      </span>
                    </span>
                    <span className="mt-0.5 block pl-4 text-xs leading-5 text-muted-foreground">{description}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* .gitconfig 風のプロフィール */}
      <footer className="mx-auto mb-8 flex w-full max-w-2xl flex-wrap items-end justify-between gap-6 text-xs leading-6">
        <div>
        <p className="text-syntax-keyword">[user]</p>
        <p className="pl-4">
          <span className="text-syntax-fn">name</span>
          <span className="text-muted-foreground"> = </span>
          <span className="text-syntax-string">Genichi Maruo</span>
        </p>
        <p className="pl-4">
          <span className="text-syntax-fn">org</span>
          <span className="text-muted-foreground">&nbsp; = </span>
          <span className="text-syntax-string">大阪工業大学大学院 情報科学研究科 M2</span>
        </p>
        <p className="mt-1 text-syntax-keyword">[remote]</p>
        <p className="flex flex-wrap gap-x-4 pl-4">
          {remotes.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-brand hover:decoration-brand"
            >
              {label}
            </a>
          ))}
        </p>
        </div>
        <p className="text-syntax-comment">{"// bg: Conway's Game of Life — click to drop a glider"}</p>
      </footer>
    </div>
  );
}
