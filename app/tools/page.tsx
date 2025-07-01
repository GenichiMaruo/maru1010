"use client";

import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateGeometricPattern } from "@/utils/generatePattern";
import {
  Timer,
  AlarmClock,
  Presentation as PresentationIcon, // "Presentation" にエイリアスを設定
  ALargeSmall as CharCountIcon, // "ALargeSmall" にエイリアスを設定
} from "lucide-react";

import StopwatchTab from "@/components/tools/StopwatchTab";
import TimerTab from "@/components/tools/TimerTab";
import CharacterCountTab from "@/components/tools/CharacterCountTab";
import PresentationTimerTab from "@/components/tools/PresentationTimerTab";

export default function ToolsPage() {
  useEffect(() => {
    const lightPatternOptions = {
      size: 300,
      colors: ["#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8"],
      complexity: Math.random() * 0.3 + 0.3,
      contrast: Math.random() * 0.4 + 0.3,
    };
    const darkPatternOptions = {
      size: 300,
      colors: ["#1e293b", "#334155", "#475569", "#64748b"],
      complexity: Math.random() * 0.3 + 0.3,
      contrast: Math.random() * 0.4 + 0.3,
    };

    const lightSvg = generateGeometricPattern(lightPatternOptions);
    const darkSvg = generateGeometricPattern(darkPatternOptions);

    // CSSカスタムプロパティとして設定
    document.documentElement.style.setProperty(
      "--tools-pattern-light",
      `url('data:image/svg+xml;utf8,${encodeURIComponent(lightSvg)}')`
    );
    document.documentElement.style.setProperty(
      "--tools-pattern-dark",
      `url('data:image/svg+xml;utf8,${encodeURIComponent(darkSvg)}')`
    );
  }, []);

  return (
    <div
      className="min-h-screen bg-indigo-100 dark:bg-gray-900 pt-24 pb-16 relative"
      style={{
        backgroundImage: "var(--tools-pattern-light)",
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full bg-blue-500/20 dark:bg-blue-900/40 z-[1]"></div>
      <div className="container mx-auto px-4 relative z-[2]">
        <Tabs
          defaultValue="stopwatch"
          className="w-full flex flex-col items-center"
        >
          <div
            className="w-full max-w-sm mx-auto mb-2 
              flex flex-col items-center space-y-3 sm:space-y-4 
              bg-slate-800/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 dark:border-slate-600/50 
              rounded-xl shadow-2xl p-3 sm:p-4"
          >
            <TabsList className="grid w-full max-w-[280px] sm:max-w-xs grid-cols-4 gap-1 p-0 bg-transparent border-none shadow-none h-full">
              <TabsTrigger
                value="stopwatch"
                className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-sky-300 dark:data-[state=active]:text-sky-400 text-slate-400 dark:text-slate-300 hover:bg-slate-700/50 dark:hover:bg-slate-600/50 hover:text-slate-100 rounded-md transition-all duration-150 ease-in-out px-1 py-1 h-full"
              >
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <Timer size={18} strokeWidth={2} />
                  <span className="text-[10px] font-medium tracking-tight">
                    Stopwatch
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="timer"
                className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-sky-300 dark:data-[state=active]:text-sky-400 text-slate-400 dark:text-slate-300 hover:bg-slate-700/50 dark:hover:bg-slate-600/50 hover:text-slate-100 rounded-md transition-all duration-150 ease-in-out px-1 py-1 h-full"
              >
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <AlarmClock size={18} strokeWidth={2} />
                  <span className="text-[10px] font-medium tracking-tight">
                    Timer
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="presentation"
                className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-sky-300 dark:data-[state=active]:text-sky-400 text-slate-400 dark:text-slate-300 hover:bg-slate-700/50 dark:hover:bg-slate-600/50 hover:text-slate-100 rounded-md transition-all duration-150 ease-in-out px-1 py-1 h-full"
              >
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <PresentationIcon size={18} strokeWidth={2} />
                  <span className="text-[10px] font-medium tracking-tight">
                    Presentation
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="charcount"
                className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-sky-300 dark:data-[state=active]:text-sky-400 text-slate-400 dark:text-slate-300 hover:bg-slate-700/50 dark:hover:bg-slate-600/50 hover:text-slate-100 rounded-md transition-all duration-150 ease-in-out px-1 py-1 h-full"
              >
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <CharCountIcon size={18} strokeWidth={2} />
                  <span className="text-[10px] font-medium tracking-tight">
                    Char Count
                  </span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="stopwatch" className="w-full">
            <StopwatchTab />
          </TabsContent>
          <TabsContent value="timer" className="w-full">
            <TimerTab />
          </TabsContent>
          <TabsContent value="presentation" className="w-full">
            <PresentationTimerTab />
          </TabsContent>
          <TabsContent value="charcount" className="w-full">
            <CharacterCountTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
