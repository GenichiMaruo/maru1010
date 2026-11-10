import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ToolTone = "idle" | "run" | "pause" | "done";

const toneClass: Record<ToolTone, string> = {
  idle: "bg-secondary text-muted-foreground",
  run: "bg-brand text-background",
  pause: "bg-syntax-number text-background",
  done: "bg-syntax-tag text-background",
};

export type KeyHint = { keys: string[]; label: string };

/** キー操作の一覧（<kbd> 表示）。タッチ端末では意味がないので親側で隠す */
export function KeyHints({ hints, className }: { hints: KeyHint[]; className?: string }) {
  return (
    <ul className={cn("flex items-center gap-3", className)}>
      {hints.map(({ keys, label }) => (
        <li key={label} className="flex items-center gap-1">
          {keys.map((key) => (
            <kbd key={key} className="rounded border border-border bg-card px-1 py-px font-mono text-[10px] text-foreground">
              {key}
            </kbd>
          ))}
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * ツール共通の枠。上はエディタのタブ風のファイル名、下は vim 風のステータスバー
 * （左に状態を色付きで、右にキー操作）。
 */
export function ToolShell({
  file,
  mode,
  tone,
  info,
  hints,
  actions,
  children,
  wide,
  className,
  bodyClassName,
}: {
  file: string;
  mode: string;
  tone: ToolTone;
  info?: ReactNode;
  hints?: KeyHint[];
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        wide ? "max-w-3xl" : "max-w-xl",
        className
      )}
    >
      <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-secondary/50 pr-1.5 pl-4 font-mono text-xs text-muted-foreground">
        <span className="truncate">{file}</span>
        {actions && <div className="flex items-center gap-0.5">{actions}</div>}
      </header>
      <div className={cn("flex-1 px-5 py-8 sm:px-8", bodyClassName)}>{children}</div>
      <footer className="flex min-h-7 shrink-0 items-stretch border-t border-border font-mono text-[11px]">
        <span className={cn("flex items-center px-3 font-semibold tracking-wider uppercase transition-colors", toneClass[tone])}>
          {mode}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-3 truncate px-3 text-muted-foreground">{info}</span>
        {hints && <KeyHints hints={hints} className="hidden pr-3 text-muted-foreground [@media(hover:hover)]:flex" />}
      </footer>
    </section>
  );
}

/** ヘッダー右側の小さなアイコンボタン */
export function ShellAction({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
        active ? "bg-secondary text-foreground" : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
