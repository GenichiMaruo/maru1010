"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateGeometricPattern } from "@/utils/generatePattern";
import { Timer, AlarmClock, Baseline } from "lucide-react";

import StopwatchTab from "@/components/tools/StopwatchTab";
import TimerTab from "@/components/tools/TimerTab";
import CharacterCountTab from "@/components/tools/CharacterCountTab";

export default function ToolsPage() {
  const [patternSvg, setPatternSvg] = useState<string>("");

  useEffect(() => {
    const patternOptions = {
      size: 300,
      colors: ["#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8"],
      complexity: Math.random() * 0.3 + 0.3,
      contrast: Math.random() * 0.4 + 0.3,
    };
    const svg = generateGeometricPattern(patternOptions);
    setPatternSvg(svg);
  }, []);

  const backgroundStyle: React.CSSProperties = {
    backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(
      patternSvg
    )}')`,
    backgroundColor: "#e0e7ff",
    position: "relative",
    minHeight: "100vh",
    paddingTop: "6rem", // ヘッダーの高さを考慮 (適宜調整)
    paddingBottom: "4rem",
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(138, 161, 230, 0.3)",
    zIndex: 1,
  };

  const contentStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 2,
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}></div>
      <div className="container mx-auto px-4 pt-0 sm:pt-4" style={contentStyle}>
        <Tabs
          defaultValue="stopwatch"
          className="w-full flex flex-col items-center pt-0 sm:pt-0"
        >
          <div
            className="w-full max-w-sm mx-auto mb-2 
             flex flex-col items-center space-y-3 sm:space-y-4 
             bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 
             rounded-xl shadow-2xl p-3 sm:p-4"
          >
            <TabsList className="grid w-full max-w-[240px] sm:max-w-[280px] grid-cols-3 gap-1 p-0 bg-transparent border-none shadow-none h-full">
              <TabsTrigger
                value="stopwatch"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-sky-300 text-slate-400 hover:bg-slate-700/50 hover:text-slate-100 rounded-md transition-all duration-150 ease-in-out px-1 py-1 h-full"
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
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-sky-300 text-slate-400 hover:bg-slate-700/50 hover:text-slate-100 rounded-md transition-all duration-150 ease-in-out px-1 py-1 h-full"
              >
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <AlarmClock size={18} strokeWidth={2} />
                  <span className="text-[10px] font-medium tracking-tight">
                    Timer
                  </span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="charcount"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-sky-300 text-slate-400 hover:bg-slate-700/50 hover:text-slate-100 rounded-md transition-all duration-150 ease-in-out px-1 py-1 h-full"
              >
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <Baseline size={18} strokeWidth={2} />
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
          <TabsContent value="charcount" className="w-full">
            <CharacterCountTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
