"use client";

import { useCallback, useEffect, useRef } from "react";
import { BellRing, Pause, Play, RotateCcw } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useSoundPlayer } from "@/hooks/useSoundPlayer";
import { useStoredState } from "@/hooks/useStoredState";
import { durationToMs, formatClock, type Duration } from "@/utils/formatTime";
import { ToolShell } from "@/components/tools/shared/ToolShell";
import { ToolButton } from "@/components/tools/shared/ToolButton";
import { TimeDisplay } from "@/components/tools/shared/TimeDisplay";
import { DurationPicker } from "@/components/tools/shared/DurationPicker";
import { notifyIfHidden, requestNotificationPermission } from "@/components/tools/shared/notify";
import { cn } from "@/lib/utils";

const HINTS = [
  { keys: ["Space"], label: "start/pause" },
  { keys: ["R"], label: "reset" },
];

const QUICK: { label: string; value: Duration }[] = [
  { label: "1m", value: { h: 0, m: 1, s: 0 } },
  { label: "3m", value: { h: 0, m: 3, s: 0 } },
  { label: "5m", value: { h: 0, m: 5, s: 0 } },
  { label: "10m", value: { h: 0, m: 10, s: 0 } },
  { label: "25m", value: { h: 0, m: 25, s: 0 } },
];

const DEFAULT_DURATION: Duration = { h: 0, m: 1, s: 0 };

const TONE = { idle: "idle", running: "run", paused: "pause", finished: "done" } as const;

export default function TimerTab() {
  // 最後に使った時間を覚えておく
  const [duration, setDuration] = useStoredState("maru1010.timer.duration", DEFAULT_DURATION);
  const durationMs = durationToMs(duration);
  const sound = useSoundPlayer();
  const cancelAlarmRef = useRef<() => void>(() => {});

  const handleFinish = useCallback(() => {
    // 予約した音が鳴らない状態（iOS で中断された等）なら、ここで鳴らし直す
    if (!sound.isRunning()) {
      sound.unlock().then((ok) => ok && sound.play("chime"));
    }
    notifyIfHidden("タイマーが終了しました");
  }, [sound]);

  const timer = useCountdown(durationMs, handleFinish);
  const { status } = timer;

  useEffect(() => () => cancelAlarmRef.current(), []);

  const reset = useCallback(() => {
    cancelAlarmRef.current();
    sound.stopAll();
    timer.reset();
  }, [sound, timer]);

  const toggle = useCallback(() => {
    if (status === "running") {
      timer.pause();
      cancelAlarmRef.current();
      return;
    }
    if (status === "finished") {
      reset();
      return;
    }
    const startedAt = performance.now();
    const remaining = timer.start();
    if (remaining === null) return;
    requestNotificationPermission();
    // iOS 対策：ボタン操作の中で AudioContext を再開してから、終了時刻に音を予約する
    sound.unlock().then(() => {
      cancelAlarmRef.current();
      cancelAlarmRef.current = sound.play("chime", { delayMs: remaining - (performance.now() - startedAt) });
    });
  }, [status, timer, reset, sound]);

  useShortcuts({ Space: toggle, KeyR: reset });

  const finished = status === "finished";
  const ratio = durationMs > 0 ? timer.remainingMs / durationMs : 0;
  const display = finished ? formatClock(timer.overtimeMs) : formatClock(timer.remainingMs, "ceil");

  return (
    <ToolShell
      file="timer.ts"
      mode={{ idle: "ready", running: "running", paused: "paused", finished: "time up" }[status]}
      tone={TONE[status]}
      info={finished ? "+ overtime" : `total ${formatClock(durationMs)}`}
      hints={HINTS}
    >
      <div className="flex flex-col items-center">
        {finished && <BellRing aria-hidden="true" className="mb-2 h-7 w-7 animate-bounce text-syntax-tag" />}
        <TimeDisplay
          main={display}
          prefix={finished ? "+" : undefined}
          className={cn("text-6xl sm:text-7xl", finished && "text-syntax-tag")}
        />
      </div>

      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-100 ease-linear",
            ratio > 0.2 ? "bg-syntax-type" : "bg-syntax-number"
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-2 sm:mx-auto sm:max-w-xs">
        <ToolButton
          variant="primary"
          size="lg"
          onClick={toggle}
          disabled={durationMs === 0 && status === "idle"}
          icon={status === "running" ? <Pause /> : <Play />}
          kbd="␣"
        >
          {{ idle: "start", running: "pause", paused: "resume", finished: "dismiss" }[status]}
        </ToolButton>
        <ToolButton size="lg" variant="danger" onClick={reset} disabled={status === "idle"} icon={<RotateCcw />} kbd="R">
          reset
        </ToolButton>
      </div>

      {/* 時間の設定は止まっているときだけ */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          status === "idle" ? "mt-8 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        inert={status !== "idle"}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border pt-6">
            <DurationPicker value={duration} onChange={setDuration} label="タイマー" />
            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {QUICK.map(({ label, value }) => (
                <ToolButton
                  key={label}
                  size="sm"
                  variant={durationToMs(value) === durationMs ? "primary" : "outline"}
                  onClick={() => setDuration(value)}
                >
                  {label}
                </ToolButton>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        効果音素材：
        <a href="https://otologic.jp/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          OtoLogic
        </a>
      </p>
    </ToolShell>
  );
}
