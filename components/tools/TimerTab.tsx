// TimerTab.tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, BellRing, AlarmClock } from "lucide-react";
import { formatTimerTime } from "@/utils/formatTime";
import ScrollPicker from "@/components/ui/scroll-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

const generateNumberRange = (start: number, end: number): number[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

type ActivePickerType = "h" | "m" | "s" | null;

export default function TimerTab() {
  const [initialTime, setInitialTime] = useState({ h: 0, m: 1, s: 0 });
  const [timeLeft, setTimeLeft] = useState(initialTime.m * 60 + initialTime.s);
  const [isRunning, setIsRunning] = useState(false);
  const [showVisualAlarm, setShowVisualAlarm] = useState(false); // Changed from showAlarm
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activePicker, setActivePicker] = useState<ActivePickerType>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const hoursValues = useMemo(() => generateNumberRange(0, 23), []);
  const minutesValues = useMemo(() => generateNumberRange(0, 59), []);
  const secondsValues = useMemo(() => generateNumberRange(0, 59), []);
  const pickerOrder: ActivePickerType[] = useMemo(() => ["h", "m", "s"], []);

  const getTotalInitialSeconds = useCallback(() => {
    return initialTime.h * 3600 + initialTime.m * 60 + initialTime.s;
  }, [initialTime]);

  // This determines if the settings pickers should be visible
  const showSettings =
    !isRunning && timeLeft === getTotalInitialSeconds() && !showVisualAlarm;

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/timer-chime.mp3");
    }
  }, []);

  // Main timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      targetTimeRef.current = Date.now() + timeLeft * 1000; // Define targetTimeRef below
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remainingMilliseconds = Math.max(0, targetTimeRef.current - now);
        const newTimeLeftSeconds = Math.ceil(remainingMilliseconds / 1000);
        setTimeLeft(newTimeLeftSeconds);

        if (remainingMilliseconds <= 0) {
          setIsRunning(false);
          setShowVisualAlarm(true); // Trigger visual alarm
          audioRef.current
            ?.play()
            .catch((e) => console.warn("Audio play failed:", e));
          if (Notification.permission === "granted") {
            new Notification("Timer Finished!");
          }
        }
      }, 250);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const targetTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning && !showVisualAlarm) {
      setTimeLeft(getTotalInitialSeconds());
    }
  }, [initialTime, getTotalInitialSeconds, showVisualAlarm]);

  const handleTimeChange = useCallback(
    (unit: "h" | "m" | "s", newValue: number) => {
      setInitialTime((prev) => ({ ...prev, [unit]: newValue }));
      if (
        !isRunning &&
        timeLeft === getTotalInitialSeconds() &&
        !showVisualAlarm
      ) {
        setActivePicker(unit);
        if (highlightTimeoutRef.current)
          clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = setTimeout(
          () => setActivePicker(null),
          3000
        );
      }
    },
    [isRunning, timeLeft, getTotalInitialSeconds, showVisualAlarm]
  );

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setShowVisualAlarm(false); // Turn off visual alarm
    setTimeLeft(getTotalInitialSeconds());
    setActivePicker(null);
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, [getTotalInitialSeconds]);

  const handleStartPause = useCallback(() => {
    if (showVisualAlarm) {
      // If alarm is showing, treat as reset/dismiss
      handleReset();
      return;
    }
    const totalInitialSec = getTotalInitialSeconds();
    if (
      totalInitialSec === 0 &&
      !isRunning &&
      timeLeft === 0 &&
      !(!isRunning && timeLeft === getTotalInitialSeconds() && !showVisualAlarm)
    )
      return;

    if (timeLeft > 0 || (!isRunning && totalInitialSec > 0)) {
      setIsRunning((prevIsRunning) => !prevIsRunning);
      if (!isRunning) setActivePicker(null);
    }
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [
    timeLeft,
    getTotalInitialSeconds,
    isRunning,
    showVisualAlarm,
    handleReset,
  ]); // Added handleReset

  const clearActivityHighlight = useCallback(() => setActivePicker(null), []);
  const resetActivityTimer = useCallback(() => {
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(clearActivityHighlight, 3000);
  }, [clearActivityHighlight]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const targetTagName = (event.target as HTMLElement)?.tagName;
      if (
        targetTagName === "INPUT" ||
        targetTagName === "TEXTAREA" ||
        (event.target as HTMLElement)?.isContentEditable
      )
        return;

      if (event.code === "Space") {
        event.preventDefault();
        handleStartPause();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        handleReset();
      }

      const currentShowSettings =
        !isRunning && timeLeft === getTotalInitialSeconds() && !showVisualAlarm;
      if (currentShowSettings) {
        if (event.code === "ArrowLeft") {
          event.preventDefault();
          setActivePicker((prev) => {
            const currentIdx = prev ? pickerOrder.indexOf(prev) : -1;
            const nextIdx =
              (currentIdx - 1 + pickerOrder.length) % pickerOrder.length;
            return pickerOrder[nextIdx];
          });
          resetActivityTimer();
        } else if (event.code === "ArrowRight") {
          event.preventDefault();
          setActivePicker((prev) => {
            const currentIdx = prev
              ? pickerOrder.indexOf(prev)
              : pickerOrder.length - 1;
            const nextIdx = (currentIdx + 1) % pickerOrder.length;
            return pickerOrder[nextIdx];
          });
          resetActivityTimer();
        } else if (event.code === "ArrowUp" || event.code === "ArrowDown") {
          if (activePicker) {
            event.preventDefault();
            let currentValues: number[];
            let currentValue: number;
            if (activePicker === "h") {
              currentValues = hoursValues;
              currentValue = initialTime.h;
            } else if (activePicker === "m") {
              currentValues = minutesValues;
              currentValue = initialTime.m;
            } else {
              currentValues = secondsValues;
              currentValue = initialTime.s;
            }
            const currentIndex = currentValues.indexOf(currentValue);
            const newIndex =
              event.code === "ArrowUp"
                ? (currentIndex - 1 + currentValues.length) %
                  currentValues.length
                : (currentIndex + 1) % currentValues.length;
            handleTimeChange(activePicker, currentValues[newIndex]);
          } else {
            event.preventDefault();
            setActivePicker(pickerOrder[0]);
            resetActivityTimer();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (highlightTimeoutRef.current)
        clearTimeout(highlightTimeoutRef.current);
    };
  }, [
    handleStartPause,
    handleReset,
    isRunning,
    timeLeft,
    getTotalInitialSeconds,
    showVisualAlarm,
    activePicker,
    pickerOrder,
    hoursValues,
    minutesValues,
    secondsValues,
    initialTime,
    handleTimeChange,
    resetActivityTimer,
  ]);

  return (
    <Card
      ref={cardRef}
      tabIndex={-1}
      className="w-full max-w-md lg:max-w-xl mx-auto bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl text-slate-50 flex flex-col outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      <CardHeader className="pt-5 pb-3">
        <AlarmClock
          size={32}
          className={`mx-auto transition-all duration-300 ease-in-out ${
            showVisualAlarm ? "text-yellow-400 animate-ping" : "text-sky-300"
          }`}
        />
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4 px-4 md:px-6 lg:px-8 pb-6 flex-grow">
        {/* 1. Time Left Display - Now at the top of content */}
        <div
          className={`text-5xl lg:text-6xl font-mono tabular-nums select-none transition-colors duration-300 ${
            showVisualAlarm ? "text-yellow-400 animate-pulse" : "text-slate-100"
          } ${showSettings ? "pt-0" : "pt-2"}`} // Adjust top padding based on settings visibility
        >
          {formatTimerTime(timeLeft)}
        </div>

        {/* Optional: Explicit Alarm Bell Icon if needed, or rely on header icon */}
        {showVisualAlarm && !isRunning && timeLeft === 0 && (
          <BellRing
            size={36}
            className="text-yellow-400 opacity-75 my-1 animate-bounce"
          />
        )}

        {/* 2. Progress Bar */}
        <Progress
          value={
            timeLeft > 0 && getTotalInitialSeconds() > 0
              ? (timeLeft / getTotalInitialSeconds()) * 100
              : isRunning && getTotalInitialSeconds() === 0
              ? 100
              : 0
          }
          className="w-full h-2.5 bg-slate-700/80 rounded-full [&>div]:bg-sky-400"
        />

        {/* 3. Buttons */}
        <div className="flex w-full sm:w-auto sm:space-x-3 flex-col sm:flex-row space-y-3 sm:space-y-0">
          <Button
            onClick={handleStartPause}
            size="lg"
            disabled={
              getTotalInitialSeconds() === 0 &&
              !isRunning &&
              timeLeft === 0 &&
              !showVisualAlarm
            }
            className="w-full sm:w-auto bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300 hover:text-sky-200 transition-colors duration-200 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <Pause className="mr-2 h-5 w-5" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            {isRunning ? "Pause" : showVisualAlarm ? "Dismiss" : "Start"}
          </Button>
          <Button
            onClick={handleReset}
            size="lg"
            className="w-full sm:w-auto bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 text-pink-300 hover:text-pink-200 transition-colors duration-200 rounded-lg"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Reset
          </Button>
        </div>

        {/* 4. Time Settings UI (Animated open/close) - Now at the bottom of content */}
        <div
          className={`w-full transition-all duration-500 ease-in-out overflow-hidden grid ${
            showSettings
              ? "grid-rows-[1fr] opacity-100 pt-6 pb-2"
              : "grid-rows-[0fr] opacity-0" // Added pt-6, pb-2 for spacing when open
          }`}
          aria-hidden={!showSettings}
        >
          <div className="overflow-hidden min-h-0">
            <div className="flex space-x-1 sm:space-x-2 items-center justify-center w-full">
              {(["h", "m", "s"] as const).map((unit, idx) => (
                <React.Fragment key={unit}>
                  <div className="flex flex-col items-center w-[calc(100%/3-0.5rem)] sm:w-[calc(100%/3-1rem)] max-w-[5rem] sm:max-w-[6rem]">
                    <ScrollPicker
                      label={
                        unit === "h"
                          ? "Hours"
                          : unit === "m"
                          ? "Minutes"
                          : "Seconds"
                      }
                      values={
                        unit === "h"
                          ? hoursValues
                          : unit === "m"
                          ? minutesValues
                          : secondsValues
                      }
                      currentValue={initialTime[unit]}
                      onChange={(newVal) => handleTimeChange(unit, newVal)}
                    />
                    <span className="mt-1 text-xs text-slate-400 capitalize">
                      {unit === "h"
                        ? "Hours"
                        : unit === "m"
                        ? "Minutes"
                        : "Seconds"}
                    </span>
                  </div>
                  {idx < 2 && (
                    <span className="text-2xl lg:text-3xl text-slate-500 pb-5 shrink-0">
                      :
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <div className="text-center text-xs text-slate-400 mt-0 pb-0 gap-0">
        効果音素材：
        <a
          href="https://otologic.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-300 transition-colors"
        >
          OtoLogic
        </a>
      </div>

      <CardFooter className="hidden lg:flex justify-center items-center pt-3 pb-0 border-t border-slate-700/50 mt-auto">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger className="flex items-center space-x-2 text-xs text-slate-400 opacity-80 cursor-default p-1 rounded-md hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500">
              <span className="border border-slate-600 bg-slate-700/50 px-2 py-0.5 rounded shadow-sm">
                SPACE
              </span>
              <span className="text-slate-500">/</span>
              <span className="border border-slate-600 bg-slate-700/50 px-1.5 py-0.5 rounded shadow-sm">
                R
              </span>
              <span className="text-slate-500">·</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-left-right"
              >
                <polyline points="17 11 21 7 17 3" />
                <path d="M3 7h18" />
                <polyline points="7 21 3 17 7 13" />
                <path d="M21 17H3" />
              </svg>
              <span className="text-slate-500">/</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-up-down"
              >
                <path d="m21 16-4 4-4-4" />
                <path d="M17 20V4" />
                <path d="m3 8 4-4 4 4" />
                <path d="M7 4v16" />
              </svg>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white border-slate-700 shadow-xl">
              <p>
                <span className="font-semibold">[SPACE]:</span>{" "}
                Start/Pause/Dismiss
              </p>
              <p>
                <span className="font-semibold">[R]:</span> Reset Timer
              </p>
              <p>
                <span className="font-semibold">[←][→]:</span> Select Picker
              </p>
              <p>
                <span className="font-semibold">[↑][↓]:</span> Change Time
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
