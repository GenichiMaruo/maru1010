// StopwatchTab.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter, // Added CardFooter
  CardHeader,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, RotateCcw, Flag, Timer } from "lucide-react";
import { formatTime } from "@/utils/formatTime";
import {
  // Added Tooltip components
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function StopwatchTab() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Memoize handlers for useEffect dependency array
  const handleStartPause = useCallback(() => {
    setIsRunning((prevIsRunning) => !prevIsRunning);
  }, []);

  const handleLap = useCallback(() => {
    if (isRunning) {
      setLaps((prevLaps) => [...prevLaps, time]);
    }
  }, [isRunning, time]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  }, []);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - time;
      timerRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, time]); // time is needed here to correctly calculate startTimeRef on resume

  // Keyboard shortcuts effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts if typing in an input field elsewhere on the page
      const targetTagName = (event.target as HTMLElement)?.tagName;
      if (
        targetTagName === "INPUT" ||
        targetTagName === "TEXTAREA" ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        handleStartPause();
      } else if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        // Trigger lap only if the button isn't disabled
        if (isRunning || time !== 0) {
          // Corresponds to disabled logic on Lap button
          handleLap();
        }
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        handleReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleStartPause, handleLap, handleReset, isRunning, time]); // Added isRunning and time for handleLap condition

  return (
    <Card className="w-full max-w-md lg:max-w-xl mx-auto bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl text-slate-50 flex flex-col">
      <CardHeader className="pt-5 pb-3">
        <Timer size={32} className="mx-auto text-sky-300" />
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 px-4 md:px-6 lg:px-8 pb-6 flex-grow">
        <div className="text-5xl lg:text-6xl font-mono tabular-nums text-slate-100 select-none">
          {formatTime(time)}
        </div>
        <div className="flex w-full sm:w-auto sm:space-x-3 flex-col sm:flex-row space-y-3 sm:space-y-0">
          <Button
            onClick={handleStartPause}
            size="lg"
            className="w-full sm:w-auto bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300 hover:text-sky-200 transition-colors duration-200 rounded-lg"
          >
            {isRunning ? (
              <Pause className="mr-2 h-5 w-5" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button
            onClick={handleLap}
            disabled={!isRunning && time === 0} // Lap button disabled logic
            size="lg"
            className="w-full sm:w-auto bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30 text-teal-300 hover:text-teal-200 transition-colors duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Flag className="mr-2 h-5 w-5" /> Lap
          </Button>
          <Button
            onClick={handleReset}
            size="lg"
            className="w-full sm:w-auto bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 text-pink-300 hover:text-pink-200 transition-colors duration-200 rounded-lg"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Reset
          </Button>
        </div>
        {laps.length > 0 && (
          <ScrollArea className="h-48 lg:h-56 w-full rounded-xl border border-slate-700/80 bg-slate-900/50 p-4 shadow-inner">
            <h3 className="text-lg font-semibold mb-3 text-slate-200">Laps:</h3>
            <ul className="space-y-1.5">
              {laps
                .map((lap, index) => (
                  <li
                    key={index}
                    className="flex justify-between text-sm text-slate-300 border-b border-slate-700/60 pb-1 last:border-b-0 last:pb-0"
                  >
                    <span className="font-medium">Lap {index + 1}:</span>
                    <div className="flex flex-col items-end font-mono tabular-nums">
                      <span>{formatTime(lap - (laps[index - 1] || 0))}</span>
                      <span className="text-xs text-slate-400">
                        (Total: {formatTime(lap)})
                      </span>
                    </div>
                  </li>
                ))
                .reverse()}{" "}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
      {/* Keyboard Hints Footer */}
      <CardFooter className="hidden lg:flex justify-center items-center pt-3 pb-0 border-t border-slate-700/50 mt-auto">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger className="flex items-center space-x-2 text-xs text-slate-400 opacity-80 cursor-default p-1 rounded-md hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500">
              <span className="border border-slate-600 bg-slate-700/50 px-2 py-0.5 rounded shadow-sm">
                SPACE
              </span>
              <span className="text-slate-500">/</span>
              <span className="border border-slate-600 bg-slate-700/50 px-1.5 py-0.5 rounded shadow-sm">
                L
              </span>
              <span className="text-slate-500">/</span>
              <span className="border border-slate-600 bg-slate-700/50 px-1.5 py-0.5 rounded shadow-sm">
                R
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white border-slate-700 shadow-xl">
              <p>
                <span className="font-semibold">[SPACE]:</span> Start/Pause
              </p>
              <p>
                <span className="font-semibold">[L]:</span> Record Lap
              </p>
              <p>
                <span className="font-semibold">[R]:</span> Reset
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
