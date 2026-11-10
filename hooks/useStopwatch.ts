"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ストップウォッチ。経過時間は「開始時刻からの差」で求めるので、
 * 描画が間引かれても（バックグラウンドタブなど）ずれない。
 */
export function useStopwatch() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  /** 各ラップを押した時点の累計時間 */
  const [laps, setLaps] = useState<number[]>([]);
  const startedAtRef = useRef(0); // performance.now() - 再開時点の経過時間
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const tick = () => {
      elapsedRef.current = performance.now() - startedAtRef.current;
      setElapsedMs(elapsedRef.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const toggle = useCallback(() => {
    if (running) {
      elapsedRef.current = performance.now() - startedAtRef.current;
      setElapsedMs(elapsedRef.current);
      setRunning(false);
    } else {
      startedAtRef.current = performance.now() - elapsedRef.current;
      setRunning(true);
    }
  }, [running]);

  const lap = useCallback(() => {
    if (!running) return;
    setLaps((prev) => [...prev, performance.now() - startedAtRef.current]);
  }, [running]);

  const reset = useCallback(() => {
    setRunning(false);
    elapsedRef.current = 0;
    setElapsedMs(0);
    setLaps([]);
  }, []);

  return { elapsedMs, running, laps, toggle, lap, reset };
}
