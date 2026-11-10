"use client";

import { Play, Plus, Square, Trash2 } from "lucide-react";
import ScrollPicker from "@/components/ui/scroll-picker";
import { DurationPicker, COUNT_VALUES } from "@/components/tools/shared/DurationPicker";
import { ToolButton } from "@/components/tools/shared/ToolButton";
import { chimeMs, type Chime } from "./model";

/** 予鈴の一覧と編集 */
export function ChimeList({
  chimes,
  durationMs,
  testingId,
  onChange,
  onTest,
}: {
  chimes: Chime[];
  durationMs: number;
  testingId: string | null;
  onChange: (chimes: Chime[]) => void;
  onTest: (chime: Chime) => void;
}) {
  const update = (id: string, patch: Partial<Chime>) =>
    onChange(chimes.map((chime) => (chime.id === id ? { ...chime, ...patch } : chime)));

  const add = () =>
    onChange([
      ...chimes,
      {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        timeFromStart: { m: 1, s: 0 },
        bellCount: 1,
        name: `予鈴 ${chimes.length + 1}`,
      },
    ]);

  return (
    <div>
      {chimes.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted-foreground">予鈴はまだありません。</p>
      ) : (
        <ul className="space-y-3">
          {chimes.map((chime, i) => {
            const late = chimeMs(chime) >= durationMs;
            const testing = testingId === chime.id;
            return (
              <li key={chime.id} className="rounded-md border border-border bg-background/50 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-syntax-comment">{String(i + 1).padStart(2, "0")}</span>
                  <input
                    value={chime.name ?? ""}
                    onChange={(e) => update(chime.id, { name: e.target.value })}
                    placeholder={`予鈴 ${i + 1}`}
                    aria-label="予鈴の名前"
                    className="min-w-0 flex-1 border-b border-transparent bg-transparent py-0.5 text-sm text-foreground outline-none focus:border-ring"
                  />
                  <ToolButton
                    size="sm"
                    variant="ghost"
                    onClick={() => onTest(chime)}
                    icon={testing ? <Square /> : <Play />}
                    aria-label={testing ? "試聴を止める" : "試聴"}
                  />
                  <ToolButton
                    size="sm"
                    variant="ghost"
                    onClick={() => onChange(chimes.filter((c) => c.id !== chime.id))}
                    icon={<Trash2 />}
                    aria-label="削除"
                    className="hover:text-syntax-tag"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-start justify-center gap-x-6 gap-y-3">
                  <div>
                    <p className="mb-1 text-center font-mono text-[11px] text-muted-foreground">開始から</p>
                    <DurationPicker
                      value={chime.timeFromStart}
                      units={["m", "s"]}
                      label="予鈴"
                      onChange={(timeFromStart) => update(chime.id, { timeFromStart })}
                    />
                  </div>
                  <div className="w-16 sm:w-20">
                    <p className="mb-1 text-center font-mono text-[11px] text-muted-foreground">回数</p>
                    <ScrollPicker
                      label="ベルの回数"
                      values={COUNT_VALUES}
                      currentValue={chime.bellCount}
                      onChange={(bellCount) => update(chime.id, { bellCount })}
                    />
                  </div>
                </div>
                {late && (
                  <p className="mt-2 font-mono text-[11px] text-syntax-number">
                    {"// 本鈴と同時かそれより後なので、この予鈴は鳴りません"}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ToolButton size="sm" onClick={add} icon={<Plus />} className="mt-3 w-full">
        予鈴を追加
      </ToolButton>
    </div>
  );
}
