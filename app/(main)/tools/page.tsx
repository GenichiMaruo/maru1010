"use client";

import { useSyncExternalStore } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, AlarmClock, Presentation, ALargeSmall } from "lucide-react";

import StopwatchTab from "@/components/tools/StopwatchTab";
import TimerTab from "@/components/tools/TimerTab";
import CharacterCountTab from "@/components/tools/CharacterCountTab";
import PresentationTimerTab from "@/components/tools/PresentationTimerTab";

// エディタのファイルタブ風。色はトップの git グラフと同じシンタックス色
const tools = [
  { value: "stopwatch", file: "stopwatch.ts", Icon: Timer, color: "text-syntax-type", bar: "bg-syntax-type", Content: StopwatchTab },
  { value: "timer", file: "timer.ts", Icon: AlarmClock, color: "text-syntax-number", bar: "bg-syntax-number", Content: TimerTab },
  { value: "presentation", file: "presentation.ts", Icon: Presentation, color: "text-syntax-keyword", bar: "bg-syntax-keyword", Content: PresentationTimerTab },
  { value: "charcount", file: "charcount.ts", Icon: ALargeSmall, color: "text-syntax-string", bar: "bg-syntax-string", Content: CharacterCountTab },
];

export default function ToolsPage() {
  // 選択中のタブは URL のハッシュ（#timer など）に持つ。戻る・進むにも追従する
  const hash = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    },
    () => window.location.hash.slice(1),
    () => ""
  );
  const activeTab = tools.some((tool) => tool.value === hash) ? hash : "stopwatch";

  const handleTabChange = (value: string) => {
    window.history.pushState(null, "", `${window.location.pathname}#${value}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return (
    <div className="min-h-svh px-4 pt-24 pb-16 sm:px-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mx-auto w-full max-w-3xl gap-0">
        <p className="mb-3 font-mono text-xs text-muted-foreground">
          <span className="text-brand">$</span> ls ./tools
        </p>
        <TabsList className="no-scrollbar flex h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b border-border bg-transparent p-0 font-mono">
          {tools.map(({ value, file, Icon, color, bar }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="group relative -mb-px h-auto flex-none gap-2 rounded-none rounded-t-md border border-transparent px-3 py-2 text-xs text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none sm:px-4 sm:text-sm dark:data-[state=active]:border-border dark:data-[state=active]:border-b-background dark:data-[state=active]:bg-background"
            >
              <Icon className={`h-3.5 w-3.5 ${color}`} strokeWidth={2} />
              {file}
              {/* アクティブなタブの上辺に色を付ける */}
              <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-0.5 rounded-t-md opacity-0 group-data-[state=active]:opacity-100 ${bar}`} />
            </TabsTrigger>
          ))}
        </TabsList>
        {tools.map(({ value, Content }) => (
          <TabsContent key={value} value={value} className="pt-8">
            <Content />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
