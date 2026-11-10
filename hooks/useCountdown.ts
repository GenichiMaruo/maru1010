"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CountdownStatus = "idle" | "running" | "paused" | "finished";

const TICK_MS = 100;

type State =
  | { status: "idle" }
  | { status: "running"; endAt: number }
  | { status: "paused"; remaining: number }
  | { status: "finished"; endAt: number };

/**
 * カウントダウン。終了予定時刻を一度だけ決め、残り時間はそこからの差で求める。
 * （以前の実装は毎秒「今 + 残り秒数（切り上げ）」で予定時刻を作り直していたため、1 秒ごとに最大 0.25 秒遅れていた）
 * 終了後は超過時間も数え続ける。
 */
export function useCountdown(durationMs: number, onFinish?: () => void) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [now, setNow] = useState(0);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const endAt = state.status === "running" || state.status === "finished" ? state.endAt : 0;
  useEffect(() => {
    if (state.status !== "running" && state.status !== "finished") return;
    const running = state.status === "running";
    const id = window.setInterval(() => {
      const t = performance.now();
      setNow(t);
      if (running && t >= endAt) {
        setState({ status: "finished", endAt });
        onFinishRef.current?.();
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [state.status, endAt]);

  let remainingMs = durationMs;
  if (state.status === "running") remainingMs = Math.max(0, state.endAt - now);
  else if (state.status === "paused") remainingMs = state.remaining;
  else if (state.status === "finished") remainingMs = 0;
  const overtimeMs = state.status === "finished" ? Math.max(0, now - state.endAt) : 0;

  /** 開始・再開する。開始したときの残り時間(ms)を返し、開始できなければ null */
  const start = useCallback((): number | null => {
    if (state.status === "running" || state.status === "finished") return null;
    const remaining = state.status === "paused" ? state.remaining : durationMs;
    if (remaining <= 0) return null;
    const t = performance.now();
    setNow(t);
    setState({ status: "running", endAt: t + remaining });
    return remaining;
  }, [state, durationMs]);

  const pause = useCallback(() => {
    if (state.status !== "running") return;
    setState({ status: "paused", remaining: Math.max(0, state.endAt - performance.now()) });
  }, [state]);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return {
    status: state.status as CountdownStatus,
    remainingMs,
    elapsedMs: durationMs - remainingMs,
    overtimeMs,
    start,
    pause,
    reset,
  };
}
