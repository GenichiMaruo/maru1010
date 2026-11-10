"use client";

import { useEffect, useRef } from "react";

/** KeyboardEvent.code（"Space" / "KeyR" / "Escape" など）→ 処理 */
export type ShortcutMap = Partial<Record<string, (event: KeyboardEvent) => void>>;

/**
 * ページ全体のキーボードショートカット。
 * - 入力欄・セレクト・ピッカー（listbox）・ダイアログ内では反応しない
 * - フォーカス中のボタンで Space / Enter を押したときはボタン自身に任せる
 *   （ボタンのクリックとショートカットが両方動いて「開始→即停止」になるのを防ぐ）
 * - 修飾キー付き・IME 変換中は無視する
 */
export function useShortcuts(map: ShortcutMap, enabled = true) {
  const mapRef = useRef(map);
  useEffect(() => {
    mapRef.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest?.(
          "input, textarea, select, [contenteditable='true'], [role='listbox'], [role='dialog'], [role='menu']"
        )
      ) {
        return;
      }
      if (
        (event.code === "Space" || event.code === "Enter") &&
        target?.closest?.("button:not([role='tab']), a, [role='button']")
      ) {
        return;
      }
      const handler = mapRef.current[event.code];
      if (!handler) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
