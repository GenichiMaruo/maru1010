"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Archive, BellPlus, Maximize, Minimize, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useSoundPlayer } from "@/hooks/useSoundPlayer";
import { durationToMs, formatClock } from "@/utils/formatTime";
import { ShellAction, ToolShell } from "@/components/tools/shared/ToolShell";
import { ToolButton } from "@/components/tools/shared/ToolButton";
import { TimeDisplay } from "@/components/tools/shared/TimeDisplay";
import { DurationPicker, COUNT_VALUES } from "@/components/tools/shared/DurationPicker";
import { notifyIfHidden, requestNotificationPermission } from "@/components/tools/shared/notify";
import ScrollPicker from "@/components/ui/scroll-picker";
import { cn } from "@/lib/utils";
import { ChimeList } from "./presentation/ChimeList";
import {
  BELL_INTERVAL_MS,
  DEFAULT_CONFIG,
  alarmPlayback,
  chimeMs,
  loadPreset,
  savePreset,
  type Chime,
  type PresentationConfig,
} from "./presentation/model";

const FULLSCREEN_CLASS = "timer-fullscreen-active";
const TONE = { idle: "idle", running: "run", paused: "pause", finished: "done" } as const;
const MODE = { idle: "ready", running: "running", paused: "paused", finished: "overtime" } as const;
const HINTS = [
  { keys: ["Space"], label: "start/pause" },
  { keys: ["R"], label: "reset" },
  { keys: ["F"], label: "fullscreen" },
];

type Panel = "chimes" | "preset" | null;

export default function PresentationTimerTab() {
  const [config, setConfig] = useState<PresentationConfig>(DEFAULT_CONFIG);
  const [panel, setPanel] = useState<Panel>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const durationMs = durationToMs(config.duration);
  const sound = useSoundPlayer();
  const scheduledRef = useRef<(() => void)[]>([]);
  const testRef = useRef<{ cancel: () => void; timeout: number } | null>(null);
  const feedbackTimeoutRef = useRef<number | undefined>(undefined);

  const cancelScheduled = useCallback(() => {
    scheduledRef.current.forEach((cancel) => cancel());
    scheduledRef.current = [];
  }, []);

  const stopTest = useCallback(() => {
    if (!testRef.current) return;
    testRef.current.cancel();
    window.clearTimeout(testRef.current.timeout);
    testRef.current = null;
    setTestingId(null);
  }, []);

  const handleFinish = useCallback(() => {
    if (!sound.isRunning()) {
      const alarm = alarmPlayback(config);
      sound.unlock().then((ok) => ok && sound.play(alarm.name, alarm));
    }
    notifyIfHidden("プレゼンタイマー：時間になりました");
  }, [sound, config]);

  const timer = useCountdown(durationMs, handleFinish);
  const { status, elapsedMs } = timer;

  // 後始末（タブ切り替えで外れたとき、拡大表示のまま残らないようにする）
  useEffect(
    () => () => {
      cancelScheduled();
      window.clearTimeout(feedbackTimeoutRef.current);
      document.body.classList.remove(FULLSCREEN_CLASS);
    },
    [cancelScheduled]
  );

  useEffect(() => {
    document.body.classList.toggle(FULLSCREEN_CLASS, fullscreen);
  }, [fullscreen]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(null), 3000);
  };

  const reset = useCallback(() => {
    cancelScheduled();
    stopTest();
    sound.stopAll();
    timer.reset();
  }, [cancelScheduled, stopTest, sound, timer]);

  const toggle = useCallback(() => {
    if (status === "running") {
      timer.pause();
      cancelScheduled();
      return;
    }
    if (status === "finished") {
      reset();
      return;
    }
    const startedAt = performance.now();
    const elapsedBefore = durationMs - (status === "paused" ? timer.remainingMs : durationMs);
    const remaining = timer.start();
    if (remaining === null) return;
    stopTest();
    requestNotificationPermission();
    // iOS 対策：操作の中で AudioContext を再開し、予鈴と本鈴をまとめて予約する
    sound.unlock().then(() => {
      cancelScheduled();
      const lag = performance.now() - startedAt;
      for (const chime of config.chimes) {
        const at = chimeMs(chime);
        if (at > elapsedBefore && at < durationMs) {
          scheduledRef.current.push(
            sound.play("bell", { times: chime.bellCount, intervalMs: BELL_INTERVAL_MS, delayMs: at - elapsedBefore - lag })
          );
        }
      }
      const alarm = alarmPlayback(config);
      scheduledRef.current.push(sound.play(alarm.name, { ...alarm, delayMs: remaining - lag }));
    });
  }, [status, timer, durationMs, config, reset, cancelScheduled, stopTest, sound]);

  const test = async (id: string, play: () => () => void, lengthMs: number) => {
    const same = testRef.current && testingId === id;
    stopTest();
    if (same) return;
    await sound.unlock();
    const cancel = play();
    const timeout = window.setTimeout(stopTest, lengthMs + 1500);
    testRef.current = { cancel, timeout };
    setTestingId(id);
  };

  const testAlarm = () => {
    const alarm = alarmPlayback(config);
    test("alarm", () => sound.play(alarm.name, alarm), alarm.times * alarm.intervalMs);
  };
  const testChime = (chime: Chime) =>
    test(chime.id, () => sound.play("bell", { times: chime.bellCount, intervalMs: BELL_INTERVAL_MS }), chime.bellCount * BELL_INTERVAL_MS);

  const toggleFullscreen = useCallback(() => setFullscreen((v) => !v), []);
  useShortcuts({
    Space: toggle,
    KeyR: reset,
    KeyF: toggleFullscreen,
    ...(fullscreen ? { Escape: () => setFullscreen(false) } : {}),
  });

  const handleLoad = () => {
    const result = loadPreset();
    if (result === "missing") return showFeedback("保存されたプリセットがありません");
    if (result === "invalid") return showFeedback("プリセットを読み込めませんでした");
    reset();
    setConfig(result);
    showFeedback("プリセットを読み込みました");
  };

  const finished = status === "finished";
  const progress = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 0;
  const rung = config.chimes.filter((c) => status !== "idle" && elapsedMs >= chimeMs(c)).length;
  const display = finished ? formatClock(timer.overtimeMs) : formatClock(timer.remainingMs, "ceil");

  const clock = (
    <TimeDisplay
      main={display}
      prefix={finished ? "-" : undefined}
      className={cn(
        fullscreen ? "text-[17vw] leading-none lg:text-[14vw]" : "text-6xl sm:text-7xl",
        finished && "text-syntax-tag"
      )}
    />
  );

  const progressBar = (
    <div className="relative py-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-[width] duration-100 ease-linear", finished ? "bg-syntax-tag" : "bg-syntax-keyword")}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {/* 予鈴の位置 */}
      {durationMs > 0 &&
        config.chimes
          .filter((c) => chimeMs(c) < durationMs)
          .map((chime) => {
            const done = status !== "idle" && elapsedMs >= chimeMs(chime);
            return (
              <span
                key={chime.id}
                title={`${chime.name || "予鈴"}（${chime.timeFromStart.m}分${chime.timeFromStart.s}秒・${chime.bellCount}回）`}
                className={cn(
                  "absolute top-0 h-5 w-1 -translate-x-1/2 rounded-full ring-2 ring-card",
                  done ? "bg-muted-foreground" : "bg-syntax-number"
                )}
                style={{ left: `${(chimeMs(chime) / durationMs) * 100}%` }}
              />
            );
          })}
    </div>
  );

  const controls = (
    <div className={cn("grid grid-cols-2 gap-2", fullscreen ? "w-full max-w-md" : "sm:mx-auto sm:max-w-xs")}>
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
  );

  // ---- 拡大表示 ----
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
        <div className="flex items-center justify-between px-4 py-3 font-mono text-xs text-muted-foreground">
          <span>
            presentation.ts <span className="text-syntax-comment">{`// ${MODE[status]}`}</span>
          </span>
          <ShellAction label="拡大表示を終了 (F / Esc)" onClick={() => setFullscreen(false)}>
            <Minimize className="h-4 w-4" />
          </ShellAction>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-[4vh] px-6">
          {clock}
          <div className="w-full max-w-5xl">{progressBar}</div>
          {controls}
        </div>
      </div>
    );
  }

  return (
    <ToolShell
      file="presentation.ts"
      mode={MODE[status]}
      tone={TONE[status]}
      info={
        <>
          <span>total {formatClock(durationMs)}</span>
          {config.chimes.length > 0 && (
            <span>
              chimes {rung}/{config.chimes.length}
            </span>
          )}
        </>
      }
      hints={HINTS}
      actions={
        <>
          <ShellAction label="予鈴の設定" active={panel === "chimes"} onClick={() => setPanel((p) => (p === "chimes" ? null : "chimes"))}>
            <BellPlus className="h-4 w-4" />
          </ShellAction>
          <ShellAction label="プリセット" active={panel === "preset"} onClick={() => setPanel((p) => (p === "preset" ? null : "preset"))}>
            <Archive className="h-4 w-4" />
          </ShellAction>
          <ShellAction label="拡大表示 (F)" onClick={toggleFullscreen}>
            <Maximize className="h-4 w-4" />
          </ShellAction>
        </>
      }
    >
      <div className="flex justify-center">{clock}</div>
      <div className="mt-6">{progressBar}</div>
      <div className="mt-8">{controls}</div>

      {panel === "preset" && (
        <Section title="preset" note="設定を 1 つ、このブラウザに保存できます">
          <div className="flex flex-wrap justify-center gap-2">
            <ToolButton size="sm" onClick={() => showFeedback(savePreset(config) ? "プリセットを保存しました" : "保存に失敗しました")}>
              現在の設定を保存
            </ToolButton>
            <ToolButton size="sm" onClick={handleLoad}>
              保存した設定を読み込む
            </ToolButton>
          </div>
          <p className="mt-2 h-4 text-center font-mono text-[11px] text-syntax-string" aria-live="polite">
            {feedback}
          </p>
        </Section>
      )}

      {panel === "chimes" && (
        <Section title="chimes" note="予鈴：開始からの時間でベルを鳴らします">
          {status !== "idle" && (
            <p className="mb-3 font-mono text-[11px] text-syntax-number">{"// 動作中は編集できません（reset すると編集できます）"}</p>
          )}
          <fieldset disabled={status !== "idle"} inert={status !== "idle"} className="disabled:opacity-60">
          <ChimeList
            chimes={config.chimes}
            durationMs={durationMs}
            testingId={testingId}
            onChange={(chimes) => setConfig((c) => ({ ...c, chimes }))}
            onTest={testChime}
          />
          </fieldset>
        </Section>
      )}

      {/* 本鈴の設定は止まっているときだけ */}
      {status === "idle" && panel === null && (
        <Section title="alarm" note="本鈴：持ち時間と、終了時の音">
          <DurationPicker value={config.duration} onChange={(duration) => setConfig((c) => ({ ...c, duration }))} label="持ち時間" />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex rounded-md border border-border p-0.5 font-mono text-xs" role="radiogroup" aria-label="本鈴の音">
              {(["chime", "bell"] as const).map((name) => (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={config.alarmSound === name}
                  onClick={() => setConfig((c) => ({ ...c, alarmSound: name }))}
                  className={cn(
                    "rounded px-3 py-1.5 transition-colors",
                    config.alarmSound === name ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
            {config.alarmSound === "bell" && (
              <div className="flex items-center gap-2">
                <div className="w-16">
                  <ScrollPicker
                    label="本鈴のベルの回数"
                    values={COUNT_VALUES}
                    currentValue={config.alarmBellCount}
                    onChange={(alarmBellCount) => setConfig((c) => ({ ...c, alarmBellCount }))}
                  />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">回</span>
              </div>
            )}
            <ToolButton size="sm" variant="ghost" onClick={testAlarm} icon={testingId === "alarm" ? <Square /> : <Play />}>
              {testingId === "alarm" ? "stop" : "試聴"}
            </ToolButton>
          </div>
        </Section>
      )}

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        効果音素材：
        <a href="https://otologic.jp/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          OtoLogic
        </a>
      </p>
    </ToolShell>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-border pt-5">
      <h3 className="mb-4 font-mono text-xs">
        <span className="text-syntax-keyword">{title}</span>
        <span className="ml-2 text-syntax-comment">{`// ${note}`}</span>
      </h3>
      {children}
    </section>
  );
}
