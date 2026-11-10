"use client";

import { Flag, Pause, Play, RotateCcw } from "lucide-react";
import { useStopwatch } from "@/hooks/useStopwatch";
import { useShortcuts } from "@/hooks/useShortcuts";
import { splitStopwatch } from "@/utils/formatTime";
import { ToolShell } from "@/components/tools/shared/ToolShell";
import { ToolButton } from "@/components/tools/shared/ToolButton";
import { TimeDisplay } from "@/components/tools/shared/TimeDisplay";
import { cn } from "@/lib/utils";

const HINTS = [
  { keys: ["Space"], label: "start/pause" },
  { keys: ["L"], label: "lap" },
  { keys: ["R"], label: "reset" },
];

const format = (ms: number) => {
  const { main, fraction } = splitStopwatch(ms);
  return `${main}.${fraction}`;
};

export default function StopwatchTab() {
  const { elapsedMs, running, laps, toggle, lap, reset } = useStopwatch();
  useShortcuts({ Space: toggle, KeyL: lap, KeyR: reset });

  const { main, fraction } = splitStopwatch(elapsedMs);
  const splits = laps.map((total, i) => total - (laps[i - 1] ?? 0));
  // 2 周以上あるときだけ、最速・最遅のラップに色を付ける
  const fastest = splits.length > 1 ? Math.min(...splits) : null;
  const slowest = splits.length > 1 ? Math.max(...splits) : null;

  const mode = running ? "run" : elapsedMs > 0 ? "pause" : "idle";

  return (
    <ToolShell
      file="stopwatch.ts"
      mode={mode === "run" ? "running" : mode === "pause" ? "paused" : "ready"}
      tone={mode}
      info={laps.length > 0 ? `${laps.length} laps` : undefined}
      hints={HINTS}
    >
      <TimeDisplay main={main} fraction={fraction} className="text-center text-6xl sm:text-7xl" />

      <div className="mt-8 grid grid-cols-3 gap-2 sm:mx-auto sm:max-w-sm">
        <ToolButton
          variant="primary"
          size="lg"
          onClick={toggle}
          icon={running ? <Pause /> : <Play />}
          kbd="␣"
        >
          {running ? "pause" : elapsedMs > 0 ? "resume" : "start"}
        </ToolButton>
        <ToolButton size="lg" onClick={lap} disabled={!running} icon={<Flag />} kbd="L">
          lap
        </ToolButton>
        <ToolButton size="lg" variant="danger" onClick={reset} disabled={elapsedMs === 0} icon={<RotateCcw />} kbd="R">
          reset
        </ToolButton>
      </div>

      {laps.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-md border border-border">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full font-mono text-sm tabular-nums">
              <thead className="sticky top-0 bg-secondary text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 text-left font-normal">#</th>
                  <th className="px-3 py-1.5 text-right font-normal">lap</th>
                  <th className="px-3 py-1.5 text-right font-normal">total</th>
                </tr>
              </thead>
              <tbody>
                {laps
                  .map((total, i) => ({ total, split: splits[i], n: i + 1 }))
                  .reverse()
                  .map(({ total, split, n }) => (
                    <tr key={n} className="border-t border-border">
                      <td className="px-3 py-1.5 text-muted-foreground">{String(n).padStart(2, "0")}</td>
                      <td
                        className={cn(
                          "px-3 py-1.5 text-right",
                          split === fastest && "text-syntax-string",
                          split === slowest && "text-syntax-tag"
                        )}
                      >
                        {format(split)}
                      </td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground">{format(total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {fastest !== null && (
            <p className="border-t border-border bg-secondary/40 px-3 py-1.5 font-mono text-[11px] text-syntax-comment">
              {"// "}
              <span className="text-syntax-string">fastest</span> / <span className="text-syntax-tag">slowest</span>
            </p>
          )}
        </div>
      )}
    </ToolShell>
  );
}
