import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-foreground text-background hover:opacity-90",
  outline: "border border-border bg-card text-foreground hover:bg-secondary",
  danger: "border border-syntax-tag/40 bg-card text-syntax-tag hover:bg-syntax-tag/10",
  ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
};

const sizes = {
  sm: "h-8 gap-1.5 px-2.5 text-xs",
  md: "h-9 gap-2 px-3.5 text-sm",
  lg: "h-11 gap-2 px-5 text-sm",
};

/** ツール用のボタン。kbd を渡すと、マウス操作の端末でだけキー操作のヒントを右端に出す */
export function ToolButton({
  variant = "outline",
  size = "md",
  icon,
  kbd,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  icon?: ReactNode;
  kbd?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md font-mono whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
      {kbd && (
        <kbd className="ml-1 hidden rounded border border-current/25 px-1 text-[10px] leading-4 opacity-60 [@media(hover:hover)]:inline">
          {kbd}
        </kbd>
      )}
    </button>
  );
}
