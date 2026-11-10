"use client";

import { Fragment } from "react";
import ScrollPicker from "@/components/ui/scroll-picker";
import type { Duration } from "@/utils/formatTime";

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const UNITS = {
  h: { label: "時間", values: range(0, 23) },
  m: { label: "分", values: range(0, 59) },
  s: { label: "秒", values: range(0, 59) },
} as const;

/** 時・分・秒のドラム式ピッカー（Timer / Presentation 共通） */
export function DurationPicker<T extends Partial<Duration>>({
  value,
  onChange,
  units = ["h", "m", "s"],
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  units?: (keyof Duration)[];
  label?: string;
}) {
  return (
    <div className="flex items-start justify-center gap-1 sm:gap-2">
      {units.map((unit, i) => (
        <Fragment key={unit}>
          <div className="flex w-16 flex-col items-center sm:w-20">
            <ScrollPicker
              label={`${label ? `${label} ` : ""}${UNITS[unit].label}`}
              values={UNITS[unit].values as unknown as number[]}
              currentValue={value[unit] ?? 0}
              onChange={(n) => onChange({ ...value, [unit]: n })}
            />
            <span className="mt-1.5 font-mono text-[11px] text-muted-foreground">{unit}</span>
          </div>
          {i < units.length - 1 && (
            <span aria-hidden="true" className="pt-[44px] font-mono text-xl text-muted-foreground">
              :
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}

export const COUNT_VALUES = range(1, 10);
