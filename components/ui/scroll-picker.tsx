"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  UIEvent,
  KeyboardEvent,
} from "react";

interface ScrollPickerProps {
  values: number[];
  currentValue: number;
  onChange: (newValue: number) => void;
  itemHeight?: number;
  visibleItemCount?: number;
  label?: string;
}

const ScrollPicker: React.FC<ScrollPickerProps> = ({
  values,
  currentValue,
  onChange,
  itemHeight = 40,
  visibleItemCount = 3,
  label,
}) => {
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showHighlight, setShowHighlight] = useState(false);
  const [highlightFade, setHighlightFade] = useState(false);

  const containerHeight = itemHeight * visibleItemCount;
  const paddingCount = Math.floor(visibleItemCount / 2);

  const displayItems = useMemo(
    () => [
      ...Array(paddingCount)
        .fill(null)
        .map((_, i) => `pad-top-${i}`),
      ...values,
      ...Array(paddingCount)
        .fill(null)
        .map((_, i) => `pad-bottom-${i}`),
    ],
    [values, paddingCount]
  );

  // 初期スクロール位置（瞬間移動）
  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetIndex = values.indexOf(currentValue);
      if (targetIndex !== -1) {
        scrollContainerRef.current.scrollTo({
          top: targetIndex * itemHeight,
          behavior: "instant" as ScrollBehavior,
        });
      }
    }
  }, [currentValue, values, itemHeight]);

  // フェードアウト付きハイライトトリガー
  const triggerHighlight = () => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    setShowHighlight(true);
    setHighlightFade(false);

    // 2秒後にフェードアウト開始
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightFade(true);

      // フェードアウト後0.5秒で完全非表示
      setTimeout(() => {
        setShowHighlight(false);
      }, 500);
    }, 2000);
  };

  const handleScroll = (event: UIEvent<HTMLUListElement>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    const scrollTop = event.currentTarget.scrollTop;
    debounceTimeoutRef.current = setTimeout(() => {
      const index = Math.round(scrollTop / itemHeight);
      if (index >= 0 && index < values.length) {
        const newValue = values[index];
        if (newValue !== currentValue) {
          onChange(newValue);
        }
      }
    }, 100);
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: index * itemHeight,
        behavior: "smooth",
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const currentIndex = values.indexOf(currentValue);
    if (e.key === "ArrowUp" && currentIndex > 0) {
      onChange(values[currentIndex - 1]);
      triggerHighlight();
      scrollToIndex(currentIndex - 1);
    }
    if (e.key === "ArrowDown" && currentIndex < values.length - 1) {
      onChange(values[currentIndex + 1]);
      triggerHighlight();
      scrollToIndex(currentIndex + 1);
    }
  };

  const handleItemClick = (clickedValue: number) => {
    if (values.includes(clickedValue) && clickedValue !== currentValue) {
      onChange(clickedValue);
      triggerHighlight();
      scrollToIndex(values.indexOf(clickedValue));
    }
  };

  return (
    <>
      <div
        className="relative text-center"
        style={{ height: containerHeight }}
        aria-label={label || "Scroll Picker"}
      >
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-slate-700/40 rounded-md pointer-events-none z-0"
          style={{ height: itemHeight }}
          aria-hidden="true"
        />
        {showHighlight && (
          <div
            className={`absolute inset-x-0 top-1/2 -translate-y-1/2 border-4 border-sky-500 rounded-md pointer-events-none z-10`}
            style={{
              height: itemHeight,
              opacity: highlightFade ? 0 : 1,
              transition: "opacity 0.5s ease-in-out",
            }}
          />
        )}
        <ul
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="h-full overflow-y-auto scroll-snap-type-y-mandatory list-none m-0 p-0 relative z-10 no-scrollbar cursor-grab active:cursor-grabbing focus:outline-none"
          tabIndex={0}
          role="listbox"
        >
          {displayItems.map((item, index) => {
            const isPadding =
              typeof item === "string" && item.startsWith("pad-");
            const valueToShow = isPadding ? "" : String(item).padStart(2, "0");
            const originalValueIndex = index - paddingCount;
            const actualValue = isPadding ? -1 : values[originalValueIndex];

            const isSelected =
              !isPadding &&
              originalValueIndex >= 0 &&
              originalValueIndex < values.length &&
              actualValue === currentValue;

            return (
              <li
                key={isPadding ? item : `${actualValue}-${index}`}
                className={`flex items-center justify-center scroll-snap-align-center transition-all duration-150 ease-out select-none
                ${
                  isSelected
                    ? "text-sky-300 text-3xl lg:text-4xl font-semibold"
                    : isPadding
                    ? "text-transparent"
                    : "text-slate-400 text-2xl lg:text-3xl opacity-60 hover:opacity-90 hover:text-slate-200 cursor-pointer"
                }`}
                style={{ height: itemHeight }}
                onClick={() => !isPadding && handleItemClick(actualValue)}
                aria-selected={isSelected}
                role="option"
              >
                {valueToShow}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default ScrollPicker;
