"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { navItems } from "@/lib/nav";

const Header = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // トップページはナビゲーションを本文に置くので、テーマ切り替えだけを残す
  if (isHome) {
    return (
      <div className="fixed top-[calc(env(safe-area-inset-top)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-50 sm:top-[calc(env(safe-area-inset-top)+1.5rem)] sm:right-[calc(env(safe-area-inset-right)+1.5rem)]">
        <ModeToggle />
      </div>
    );
  }

  const current = pathname.split("/").filter(Boolean)[0];

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] font-mono backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* シェルのプロンプト風：カレントディレクトリ + ブランチ */}
        <p className="truncate text-sm">
          <Link href="/" className="text-syntax-keyword transition-colors hover:text-brand">
            ~/maru1010
          </Link>
          {current && <span className="text-syntax-keyword">/{current}</span>}
          <span className="ml-2 hidden text-muted-foreground sm:inline">
            git:(<span className="text-brand">main</span>)
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {navItems.map(({ href }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`hidden rounded-md px-2 py-1 text-sm transition-colors sm:inline ${
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {href.slice(1)}
              </Link>
            );
          })}
          <Link
            href="/"
            className="px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:hidden"
          >
            cd ~
          </Link>
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Header;
