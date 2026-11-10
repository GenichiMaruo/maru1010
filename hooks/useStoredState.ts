"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "stored-state-change";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // プライベートモードやストレージ無効時
  }
}

/**
 * localStorage に保存される state。
 * サーバー描画・初回描画では initial を使い、ハイドレーション後に保存値へ切り替わる
 * （useEffect で読み込んで setState するより、ちらつきとハイドレーション不一致が起きにくい）。
 */
export function useStoredState<T extends object>(key: string, initial: T) {
  const raw = useSyncExternalStore(
    (onChange) => {
      const handler = (event: Event) => {
        if (event instanceof StorageEvent ? event.key === key : (event as CustomEvent).detail === key) onChange();
      };
      window.addEventListener("storage", handler);
      window.addEventListener(EVENT, handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(EVENT, handler);
      };
    },
    () => read(key),
    () => null
  );

  const value = useMemo<T>(() => {
    if (raw === null) return initial;
    try {
      return { ...initial, ...JSON.parse(raw) } as T;
    } catch {
      return initial;
    }
    // initial は呼び出し側で定数を渡す前提
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = (() => {
        const stored = read(key);
        if (stored === null) return initial;
        try {
          return { ...initial, ...JSON.parse(stored) } as T;
        } catch {
          return initial;
        }
      })();
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}
      window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [value, setValue] as const;
}
