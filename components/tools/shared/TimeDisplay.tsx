import { cn } from "@/lib/utils";

/**
 * 大きな時刻表示。先頭の使っていない桁（"00:0" など）は薄く表示して、
 * 実際に動いている桁が目に入るようにする。
 */
export function TimeDisplay({
  main,
  fraction,
  prefix,
  className,
}: {
  main: string;
  /** 小数部（1/100 秒など）。小さく表示する */
  fraction?: string;
  /** "-" などの前置き */
  prefix?: string;
  className?: string;
}) {
  let split = 0;
  while (split < main.length - 4 && (main[split] === "0" || main[split] === ":")) split++;

  return (
    <p
      className={cn("font-mono font-medium tracking-tight tabular-nums select-none", className)}
      aria-label={`${prefix ?? ""}${main}${fraction ? `.${fraction}` : ""}`}
    >
      {prefix}
      <span className="opacity-25">{main.slice(0, split)}</span>
      {main.slice(split)}
      {fraction !== undefined && <span className="ml-1 text-[0.45em] text-muted-foreground">.{fraction}</span>}
    </p>
  );
}
