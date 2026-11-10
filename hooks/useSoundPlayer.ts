"use client";

import { useCallback, useEffect, useRef } from "react";

export type SoundName = "chime" | "bell";

const SOURCES: Record<SoundName, string> = {
  chime: "/sounds/timer-chime.mp3",
  bell: "/sounds/timer-bell.mp3",
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type PlayOptions = {
  /** 鳴らす回数 */
  times?: number;
  /** 回数ごとの間隔(ms) */
  intervalMs?: number;
  /** 何 ms 後に鳴らし始めるか */
  delayMs?: number;
};

/**
 * Web Audio で効果音を鳴らす。
 * - 音は AudioContext の時計で予約するので、タブがバックグラウンドで setInterval が
 *   間引かれても、決めた時刻に鳴る
 * - iOS Safari はユーザー操作の中で resume しないと音が出ないため、
 *   開始ボタンなどの操作時に unlock() を呼ぶ
 */
export function useSoundPlayer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Partial<Record<SoundName, AudioBuffer>>>({});
  const activeRef = useRef(new Set<AudioBufferSourceNode>());

  useEffect(() => {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    ctxRef.current = ctx;
    let cancelled = false;
    const active = activeRef.current;

    for (const name of Object.keys(SOURCES) as SoundName[]) {
      fetch(SOURCES[name])
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${SOURCES[name]}`);
          return res.arrayBuffer();
        })
        // 古い Safari はコールバック形式のみ対応のため、両方で受け取る
        .then((data) => new Promise<AudioBuffer>((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)))
        .then((buffer) => {
          if (!cancelled) buffersRef.current[name] = buffer;
        })
        .catch((error) => console.warn("効果音の読み込みに失敗しました", error));
    }

    return () => {
      cancelled = true;
      active.forEach((source) => {
        try {
          source.stop();
        } catch {}
      });
      active.clear();
      ctx.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  const unlock = useCallback(async () => {
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {}
    }
    return ctx?.state === "running";
  }, []);

  /** 音を予約して、取り消し用の関数を返す */
  const play = useCallback((name: SoundName, { times = 1, intervalMs = 500, delayMs = 0 }: PlayOptions = {}) => {
    const ctx = ctxRef.current;
    const buffer = buffersRef.current[name];
    if (!ctx || !buffer) return () => {};
    const sources: AudioBufferSourceNode[] = [];
    const base = ctx.currentTime + Math.max(0, delayMs) / 1000;
    for (let i = 0; i < times; i++) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(base + (i * intervalMs) / 1000);
      source.onended = () => activeRef.current.delete(source);
      activeRef.current.add(source);
      sources.push(source);
    }
    return () => {
      for (const source of sources) {
        source.onended = null;
        try {
          source.stop();
        } catch {}
        activeRef.current.delete(source);
      }
    };
  }, []);

  const stopAll = useCallback(() => {
    activeRef.current.forEach((source) => {
      source.onended = null;
      try {
        source.stop();
      } catch {}
    });
    activeRef.current.clear();
  }, []);

  /** AudioContext が止まっていない（予約した音が鳴る状態）か */
  const isRunning = useCallback(() => ctxRef.current?.state === "running", []);

  return { unlock, play, stopAll, isRunning };
}
