"use client";

import React from "react";
import type { SplitLayout } from "@/hooks/useEditorLayout";

interface SplitContainerProps {
  layout: SplitLayout;
  children: React.ReactNode[];
  onResize?: (sizes: number[]) => void;
}

export function SplitContainer({
  layout,
  children,
  onResize,
}: SplitContainerProps) {
  if (
    layout.type !== "split" ||
    !layout.children ||
    children.length !== layout.children.length
  ) {
    return <div className="h-full">{children[0]}</div>;
  }

  const direction = layout.direction || "horizontal";
  const sizes =
    layout.sizes || new Array(children.length).fill(100 / children.length);

  const handleResizerMouseDown = (
    resizerIndex: number,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startPos = direction === "horizontal" ? e.clientX : e.clientY;
    const startSizes = [...sizes];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPos =
        direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
      const delta = currentPos - startPos;

      // コンテナサイズを取得
      const containerElement = (e.target as HTMLElement).closest(
        ".split-container"
      );
      if (!containerElement) return;

      const containerSize =
        direction === "horizontal"
          ? containerElement.clientWidth
          : containerElement.clientHeight;

      if (containerSize > 0) {
        const deltaPercent = (delta / containerSize) * 100;
        const newSizes = [...startSizes];

        // 隣接する2つのペインのサイズを調整
        const minSize = 5; // 最小サイズ（%）
        const maxSize = 95; // 最大サイズ（%）

        const leftIndex = resizerIndex;
        const rightIndex = resizerIndex + 1;

        const newLeftSize = Math.max(
          minSize,
          Math.min(maxSize, startSizes[leftIndex] + deltaPercent)
        );
        const newRightSize = Math.max(
          minSize,
          Math.min(maxSize, startSizes[rightIndex] - deltaPercent)
        );

        // サイズが有効な範囲内の場合のみ更新
        if (newLeftSize >= minSize && newRightSize >= minSize) {
          newSizes[leftIndex] = newLeftSize;
          newSizes[rightIndex] = newRightSize;
          onResize?.(newSizes);
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor =
      direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div
      className={`h-full split-container flex ${
        direction === "horizontal" ? "flex-row" : "flex-col"
      }`}
    >
      {children.map((child, index) => {
        const size = sizes[index] || 100 / children.length;
        return (
          <React.Fragment key={index}>
            <div
              className="relative flex-shrink-0 min-w-0"
              style={{
                [direction === "horizontal" ? "width" : "height"]: `${size}%`,
              }}
            >
              {child}
            </div>

            {/* リサイザー（最後の要素以外） */}
            {index < children.length - 1 && (
              <div
                className={`flex-shrink-0 ${
                  direction === "horizontal"
                    ? "w-1 cursor-col-resize bg-slate-300 dark:bg-slate-600 hover:bg-blue-400 dark:hover:bg-blue-500"
                    : "h-1 cursor-row-resize bg-slate-300 dark:bg-slate-600 hover:bg-blue-400 dark:hover:bg-blue-500"
                } transition-colors duration-150 z-10`}
                onMouseDown={(e) => handleResizerMouseDown(index, e)}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
