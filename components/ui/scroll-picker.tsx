"use client";

import React, { useEffect, useMemo, useRef, type KeyboardEvent, type UIEvent } from "react";
import { cn } from "@/lib/utils";

interface ScrollPickerProps {
  values: number[];
  currentValue: number;
  onChange: (newValue: number) => void;
  itemHeight?: number;
  visibleItemCount?: number;
  label?: string;
  className?: string;
}

/**
 * ドラム式の数値ピッカー。スクロール・クリック・↑↓キーで選ぶ。
 * 修正点：スナップ用のクラス名が Tailwind に存在しない名前（scroll-snap-type-y-mandatory など）
 * だったためスナップが効いていなかったのを snap-y / snap-center に直し、タイマーの後始末を追加。
 */
const ScrollPicker: React.FC<ScrollPickerProps> = ({
  values,
  currentValue,
  onChange,
  itemHeight = 40,
  visibleItemCount = 3,
  label,
  className,
}) => {
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  const padding = Math.floor(visibleItemCount / 2);

  const items = useMemo(
    () => [...Array<null>(padding).fill(null), ...values, ...Array<null>(padding).fill(null)],
    [values, padding]
  );

  // 値が外から変わったら、その位置へ移動する
  useEffect(() => {
    const index = values.indexOf(currentValue);
    if (index !== -1 && listRef.current && Math.abs(listRef.current.scrollTop - index * itemHeight) > 1) {
      listRef.current.scrollTo({ top: index * itemHeight, behavior: "instant" as ScrollBehavior });
    }
  }, [currentValue, values, itemHeight]);

  useEffect(() => () => window.clearTimeout(debounceRef.current), []);

  const handleScroll = (event: UIEvent<HTMLUListElement>) => {
    window.clearTimeout(debounceRef.current);
    const top = event.currentTarget.scrollTop;
    debounceRef.current = window.setTimeout(() => {
      const value = values[Math.round(top / itemHeight)];
      if (value !== undefined && value !== currentValue) onChange(value);
    }, 100);
  };

  const select = (index: number) => {
    const value = values[index];
    if (value === undefined) return;
    onChange(value);
    listRef.current?.scrollTo({ top: index * itemHeight, behavior: "smooth" });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const index = values.indexOf(currentValue);
    if (event.key === "ArrowUp") {
      event.preventDefault();
      select(Math.max(0, index - 1));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      select(Math.min(values.length - 1, index + 1));
    }
  };

  return (
    <div className={cn("relative w-full text-center", className)} style={{ height: itemHeight * visibleItemCount }}>
      {/* 選択中の行 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-md border border-border bg-secondary/70"
        style={{ height: itemHeight }}
      />
      <ul
        ref={listRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="listbox"
        aria-label={label ?? "数値を選択"}
        aria-activedescendant={undefined}
        className="no-scrollbar relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-md font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {items.map((item, i) => {
          if (item === null) {
            return <li key={`pad-${i}`} aria-hidden="true" style={{ height: itemHeight }} />;
          }
          const selected = item === currentValue;
          return (
            <li
              key={item}
              role="option"
              aria-selected={selected}
              onClick={() => select(i - padding)}
              style={{ height: itemHeight }}
              className={cn(
                "flex snap-center items-center justify-center tabular-nums transition-all duration-150 select-none",
                selected
                  ? "text-2xl font-semibold text-foreground"
                  : "cursor-pointer text-lg text-muted-foreground opacity-50 hover:opacity-90"
              )}
            >
              {String(item).padStart(2, "0")}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ScrollPicker;
