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
import {
  Play,
  Pause,
  RotateCcw,
  BellRing,
  AlarmClock,
  Settings2,
  PlusCircle,
  Trash2,
  PlayCircle,
  StopCircle,
  RadioTower,
  Volume2,
  Save,
  Download,
  Archive,
  Maximize,
  Minimize,
} from "lucide-react";
import { formatTimerTime } from "@/utils/formatTime";
import ScrollPicker from "@/components/ui/scroll-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import React from "react";
import { v4 as uuidv4 } from "uuid";

interface TimeObject {
  h: number;
  m: number;
  s: number;
}

interface Chime {
  id: string;
  timeFromStart: { m: number; s: number };
  bellCount: number;
  triggered: boolean;
  name?: string;
}

interface TimerPreset {
  version: number;
  initialMainTime: TimeObject;
  mainAlarmSoundType: "chime" | "bell";
  mainAlarmBellCount: number;
  chimes: Omit<Chime, "triggered">[];
}

const PRESET_STORAGE_KEY = "presentationTimerPreset_v1";
const CURRENT_PRESET_VERSION = 1;

const INTER_BELL_SHOT_INTERVAL_MS = 500;
const PRELIMINARY_CHIME_INTERVAL_MS = 500;
const MAIN_ALARM_CHIME_INTERVAL_MS = 600;
const TIMER_UPDATE_INTERVAL_MS = 200;
const OVERTIME_UPDATE_INTERVAL_MS = 250;
const MAIN_ALARM_ANIMATION_DURATION_MS = 5000;
const FEEDBACK_MESSAGE_DURATION_MS = 3000;
const FULLSCREEN_CLASS = "timer-fullscreen-active";

function generateNumberRange(start: number, end: number): number[] {
  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export default function PresentationTimerTab() {
  const [initialMainTime, setInitialMainTime] = useState<TimeObject>({
    h: 0,
    m: 10,
    s: 0,
  });
  const [timeLeftInSeconds, setTimeLeftInSeconds] = useState(
    () => initialMainTime.m * 60 + initialMainTime.s
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isMainTimerFinished, setIsMainTimerFinished] = useState(false);
  const [overtimeInSeconds, setOvertimeInSeconds] = useState<number>(0);
  const [isMainAlarmAnimationActive, setIsMainAlarmAnimationActive] =
    useState(false);
  const alarmAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const overtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetTimeRef = useRef<number>(0);
  const timerStartTimeRef = useRef<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<{
    chime: AudioBuffer | null;
    bell: AudioBuffer | null;
  }>({ chime: null, bell: null });
  const activeSoundSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentTestSoundSourcesRef = useRef<Set<AudioBufferSourceNode>>(
    new Set()
  );

  const [chimes, setChimes] = useState<Chime[]>([]);
  const [showChimeSettingsPanel, setShowChimeSettingsPanel] = useState(false);
  const [showPresetPanel, setShowPresetPanel] = useState(false);
  const [mainAlarmSoundType, setMainAlarmSoundType] = useState<
    "chime" | "bell"
  >("chime");
  const [mainAlarmBellCount, setMainAlarmBellCount] = useState<number>(3);
  const [uiActiveTestSoundId, setUiActiveTestSoundId] = useState<string | null>(
    null
  );
  const internalActiveTestSoundIdRef = useRef<string | null>(null);
  const chimesPlaybackInitiatedRef = useRef<Set<string>>(new Set());
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const showMainSettings = useMemo(
    () =>
      !isRunning &&
      timeLeftInSeconds === getTotalSeconds(initialMainTime) &&
      !isMainTimerFinished,
    [isRunning, timeLeftInSeconds, initialMainTime, isMainTimerFinished]
  );

  function getTotalSeconds(time: TimeObject): number {
    return time.h * 3600 + time.m * 60 + time.s;
  }
  const getCurrentTotalInitialSeconds = useCallback(
    () => getTotalSeconds(initialMainTime),
    [initialMainTime]
  );

  const hoursValues = useMemo(() => generateNumberRange(0, 23), []);
  const minutesValues = useMemo(() => generateNumberRange(0, 59), []);
  const secondsValues = useMemo(() => generateNumberRange(0, 59), []);
  const bellCountValues = useMemo(() => generateNumberRange(1, 10), []);

  const displayFeedback = useCallback((message: string) => {
    setFeedbackMessage(message);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(
      () => setFeedbackMessage(null),
      FEEDBACK_MESSAGE_DURATION_MS
    );
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();

      const loadSound = async (url: string): Promise<AudioBuffer | null> => {
        if (!audioContextRef.current) return null;
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(
              `HTTP error! status: ${response.status} for ${url}`
            );
          }
          const arrayBuffer = await response.arrayBuffer();
          return await audioContextRef.current.decodeAudioData(arrayBuffer);
        } catch (error) {
          console.error(`Failed to load sound: ${url}`, error);
          displayFeedback(
            `サウンド読込失敗: ${url.split("/").pop()}. Check console.`
          );
          return null;
        }
      };
      Promise.all([
        loadSound("/sounds/timer-chime.mp3"),
        loadSound("/sounds/timer-bell.mp3"),
      ]).then(([chimeBuffer, bellBuffer]) => {
        audioBuffersRef.current = { chime: chimeBuffer, bell: bellBuffer };
        if (!chimeBuffer || !bellBuffer) {
          console.warn("One or more sound files failed to load.");
        } else {
        }
      });
    }
    const activeSourcesSnapshot = new Set(activeSoundSourcesRef.current);
    const testSourcesSnapshot = new Set(currentTestSoundSourcesRef.current);

    return () => {
      if (alarmAnimationTimeoutRef.current)
        clearTimeout(alarmAnimationTimeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      document.body.classList.remove(FULLSCREEN_CLASS);
      if (audioContextRef.current) {
        activeSourcesSnapshot.forEach((source) => {
          try {
            source.onended = null;
            source.stop();
          } catch {}
        });
        activeSourcesSnapshot.clear();
        testSourcesSnapshot.forEach((source) => {
          try {
            source.onended = null;
            source.stop();
          } catch {}
        });
        testSourcesSnapshot.clear();
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [displayFeedback]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add(FULLSCREEN_CLASS);
    } else {
      document.body.classList.remove(FULLSCREEN_CLASS);
    }
  }, [isFullscreen]);

  const stopAllPlayingAudios = useCallback(() => {
    activeSoundSourcesRef.current.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
      } catch {}
    });
    activeSoundSourcesRef.current.clear();
    currentTestSoundSourcesRef.current.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
      } catch {}
    });
    currentTestSoundSourcesRef.current.clear();
    if (internalActiveTestSoundIdRef.current) {
      setUiActiveTestSoundId(null);
      internalActiveTestSoundIdRef.current = null;
    }
  }, []);
  const playSound = useCallback(
    async (
      soundType: "chime" | "bell",
      times: number,
      intervalMs: number,
      isTestSoundContext: boolean = false,
      currentTestIdForCancellation?: string
    ) => {
      if (!audioContextRef.current || !audioBuffersRef.current[soundType]) {
        console.warn(
          `playSound: AudioContext not ready or ${soundType} buffer missing.`
        );
        if (
          isTestSoundContext &&
          internalActiveTestSoundIdRef.current === currentTestIdForCancellation
        ) {
          setUiActiveTestSoundId(null);
          internalActiveTestSoundIdRef.current = null;
        }
        return;
      }
      const audioContext = audioContextRef.current;
      const audioBuffer = audioBuffersRef.current[soundType];
      if (!audioBuffer) {
        console.warn(`playSound: ${soundType} AudioBuffer is null.`);
        if (
          isTestSoundContext &&
          internalActiveTestSoundIdRef.current === currentTestIdForCancellation
        ) {
          setUiActiveTestSoundId(null);
          internalActiveTestSoundIdRef.current = null;
        }
        return;
      }
      if (audioContext.state === "suspended") {
        try {
          await audioContext.resume();
        } catch (e) {
          console.error("playSound: Failed to resume AudioContext", e);
          if (
            isTestSoundContext &&
            internalActiveTestSoundIdRef.current ===
              currentTestIdForCancellation
          ) {
            setUiActiveTestSoundId(null);
            internalActiveTestSoundIdRef.current = null;
          }
          return;
        }
      }
      const sourcesCreatedInThisCall = new Set<AudioBufferSourceNode>();
      for (let i = 0; i < times; i++) {
        if (
          isTestSoundContext &&
          internalActiveTestSoundIdRef.current !== currentTestIdForCancellation
        ) {
          sourcesCreatedInThisCall.forEach((s) => {
            try {
              s.onended = null;
              s.stop();
            } catch {}
            activeSoundSourcesRef.current.delete(s);
            currentTestSoundSourcesRef.current.delete(s);
          });
          return;
        }
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        const scheduledPlayTime =
          audioContext.currentTime + (i * intervalMs) / 1000;
        source.start(scheduledPlayTime);
        sourcesCreatedInThisCall.add(source);
        activeSoundSourcesRef.current.add(source);
        if (isTestSoundContext) {
          currentTestSoundSourcesRef.current.add(source);
        }
        source.onended = () => {
          activeSoundSourcesRef.current.delete(source);
          if (isTestSoundContext) {
            currentTestSoundSourcesRef.current.delete(source);
            if (
              internalActiveTestSoundIdRef.current ===
                currentTestIdForCancellation &&
              currentTestSoundSourcesRef.current.size === 0
            ) {
              setUiActiveTestSoundId(null);
              internalActiveTestSoundIdRef.current = null;
            }
          }
        };
      }
    },
    []
  );

  useEffect(() => {
    if (isRunning && timeLeftInSeconds > 0) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remainingMilliseconds = Math.max(0, targetTimeRef.current - now);
        const newTimeLeftSeconds = Math.ceil(remainingMilliseconds / 1000);
        setTimeLeftInSeconds(newTimeLeftSeconds);
        const elapsedMilliseconds = now - timerStartTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
        chimes.forEach((chime) => {
          if (!chime.triggered) {
            const chimeTriggerTimeSeconds =
              chime.timeFromStart.m * 60 + chime.timeFromStart.s;
            if (
              elapsedSeconds >= chimeTriggerTimeSeconds &&
              !chimesPlaybackInitiatedRef.current.has(chime.id)
            ) {
              chimesPlaybackInitiatedRef.current.add(chime.id);
              setChimes((prevChimes) =>
                prevChimes.map((c) =>
                  c.id === chime.id ? { ...c, triggered: true } : c
                )
              );
              playSound("bell", chime.bellCount, PRELIMINARY_CHIME_INTERVAL_MS);
            }
          }
        });
        if (remainingMilliseconds <= 0) {
          setIsRunning(false);
          setIsMainTimerFinished(true);
          setTimeLeftInSeconds(0);
          setIsMainAlarmAnimationActive(true);
          if (alarmAnimationTimeoutRef.current)
            clearTimeout(alarmAnimationTimeoutRef.current);
          alarmAnimationTimeoutRef.current = setTimeout(
            () => setIsMainAlarmAnimationActive(false),
            MAIN_ALARM_ANIMATION_DURATION_MS
          );
          const soundTypeToPlay =
            mainAlarmSoundType === "bell" ? "bell" : "chime";
          const alarmCount =
            mainAlarmSoundType === "bell" ? mainAlarmBellCount : 1;
          const alarmInterval =
            mainAlarmSoundType === "bell"
              ? INTER_BELL_SHOT_INTERVAL_MS
              : MAIN_ALARM_CHIME_INTERVAL_MS;
          playSound(soundTypeToPlay, alarmCount, alarmInterval);
          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("Presentation Timer Finished!");
          }
        }
      }, TIMER_UPDATE_INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    isRunning,
    timeLeftInSeconds,
    chimes,
    playSound,
    mainAlarmSoundType,
    mainAlarmBellCount,
  ]);

  useEffect(() => {
    if (isMainTimerFinished && timeLeftInSeconds === 0) {
      if (targetTimeRef.current === 0 && timerStartTimeRef.current !== 0) {
        targetTimeRef.current =
          timerStartTimeRef.current + getCurrentTotalInitialSeconds() * 1000;
      }
      overtimeIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const currentOvertime = Math.max(
          0,
          Math.floor((now - targetTimeRef.current) / 1000)
        );
        setOvertimeInSeconds(currentOvertime);
      }, OVERTIME_UPDATE_INTERVAL_MS);
    } else {
      if (overtimeIntervalRef.current)
        clearInterval(overtimeIntervalRef.current);
    }
    return () => {
      if (overtimeIntervalRef.current)
        clearInterval(overtimeIntervalRef.current);
    };
  }, [isMainTimerFinished, timeLeftInSeconds, getCurrentTotalInitialSeconds]);

  useEffect(() => {
    if (!isMainTimerFinished) {
      const newTotalSeconds = getCurrentTotalInitialSeconds();
      setTimeLeftInSeconds(newTotalSeconds);
    }
    if (!isRunning && !isMainTimerFinished) {
      setChimes((prevChimes) =>
        prevChimes.map((chime) => ({ ...chime, triggered: false }))
      );
      setOvertimeInSeconds(0);
      chimesPlaybackInitiatedRef.current.clear();
      if (isMainAlarmAnimationActive) setIsMainAlarmAnimationActive(false);
      if (alarmAnimationTimeoutRef.current) {
        clearTimeout(alarmAnimationTimeoutRef.current);
        alarmAnimationTimeoutRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialMainTime,
    getCurrentTotalInitialSeconds,
    isMainTimerFinished,
    isMainAlarmAnimationActive,
  ]);

  const handleMainTimeChange = useCallback(
    (unit: "h" | "m" | "s", newValue: number) => {
      setInitialMainTime((prev) => ({ ...prev, [unit]: newValue }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsMainTimerFinished(false);
    stopAllPlayingAudios();
    setTimeLeftInSeconds(getTotalSeconds(initialMainTime));
    setOvertimeInSeconds(0);
    setChimes((prevChimes) =>
      prevChimes.map((chime) => ({ ...chime, triggered: false }))
    );
    chimesPlaybackInitiatedRef.current.clear();
    if (alarmAnimationTimeoutRef.current) {
      clearTimeout(alarmAnimationTimeoutRef.current);
      alarmAnimationTimeoutRef.current = null;
    }
    setIsMainAlarmAnimationActive(false);
    targetTimeRef.current = 0;
    timerStartTimeRef.current = 0;
  }, [initialMainTime, stopAllPlayingAudios]);

  const handleStartPause = useCallback(() => {
    if (isMainTimerFinished) {
      handleReset();
      return;
    }
    const totalInitialSec = getCurrentTotalInitialSeconds();
    if (
      totalInitialSec === 0 &&
      !isRunning &&
      timeLeftInSeconds === 0 &&
      !isMainTimerFinished
    ) {
      return;
    }
    if (
      audioContextRef.current &&
      audioContextRef.current.state === "suspended"
    ) {
      audioContextRef.current
        .resume()
        .catch((e) =>
          console.error("Failed to resume audio context on start/pause", e)
        );
    }
    setIsRunning((prevIsRunning) => {
      const newIsRunning = !prevIsRunning;
      if (newIsRunning) {
        targetTimeRef.current = Date.now() + timeLeftInSeconds * 1000;
        const effectivelyElapsedMs =
          (totalInitialSec - timeLeftInSeconds) * 1000;
        timerStartTimeRef.current = Date.now() - effectivelyElapsedMs;
        if (
          timeLeftInSeconds === totalInitialSec &&
          !isMainTimerFinished &&
          !prevIsRunning
        ) {
          stopAllPlayingAudios();
          setChimes((prevChimes) =>
            prevChimes.map((chime) => ({ ...chime, triggered: false }))
          );
          chimesPlaybackInitiatedRef.current.clear();
        }
      } else {
      }
      return newIsRunning;
    });
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, [
    isRunning,
    isMainTimerFinished,
    timeLeftInSeconds,
    getCurrentTotalInitialSeconds,
    handleReset,
    stopAllPlayingAudios,
  ]);

  const handleAddChime = () =>
    setChimes((prev) => [
      ...prev,
      {
        id: uuidv4(),
        timeFromStart: { m: 1, s: 0 },
        bellCount: 1,
        triggered: false,
        name: `Chime ${prev.length + 1}`,
      },
    ]);
  const handleRemoveChime = (id: string) =>
    setChimes((prev) => prev.filter((chime) => chime.id !== id));
  const handleChimeValueChange = (
    id: string,
    field: "m" | "s" | "bellCount",
    value: number
  ) => {
    setChimes((prev) =>
      prev.map((chime) => {
        if (chime.id === id) {
          if (field === "bellCount") return { ...chime, bellCount: value };
          return {
            ...chime,
            timeFromStart: { ...chime.timeFromStart, [field]: value },
          };
        }
        return chime;
      })
    );
  };
  const handleChimeNameChange = (id: string, name: string) =>
    setChimes((prev) =>
      prev.map((chime) => (chime.id === id ? { ...chime, name } : chime))
    );

  const handleTestSoundPlayback = useCallback(
    async (
      testId: string,
      soundTypeToPlay: "chime" | "bell",
      count: number,
      intervalMsForSound: number
    ) => {
      currentTestSoundSourcesRef.current.forEach((source) => {
        try {
          source.onended = null;
          source.stop();
        } catch {}
      });
      currentTestSoundSourcesRef.current.clear();
      if (internalActiveTestSoundIdRef.current === testId) {
        setUiActiveTestSoundId(null);
        internalActiveTestSoundIdRef.current = null;
      } else {
        setUiActiveTestSoundId(testId);
        internalActiveTestSoundIdRef.current = testId;
        playSound(soundTypeToPlay, count, intervalMsForSound, true, testId);
      }
    },
    [playSound]
  );

  const triggerTestMainAlarm = () => {
    const soundTypeToPlay = mainAlarmSoundType === "bell" ? "bell" : "chime";
    const alarmCount = mainAlarmSoundType === "bell" ? mainAlarmBellCount : 1;
    const intervalForAlarm =
      mainAlarmSoundType === "bell"
        ? INTER_BELL_SHOT_INTERVAL_MS
        : MAIN_ALARM_CHIME_INTERVAL_MS;
    handleTestSoundPlayback(
      "main_alarm",
      soundTypeToPlay,
      alarmCount,
      intervalForAlarm
    );
  };
  const triggerTestChimeSound = (chimeId: string, bellCount: number) => {
    handleTestSoundPlayback(
      `chime_${chimeId}`,
      "bell",
      bellCount,
      INTER_BELL_SHOT_INTERVAL_MS
    );
  };

  const handleSavePreset = () => {
    try {
      const presetData: TimerPreset = {
        version: CURRENT_PRESET_VERSION,
        initialMainTime,
        mainAlarmSoundType,
        mainAlarmBellCount,
        chimes: chimes.map(({ ...rest }) => rest),
      };
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presetData));
      displayFeedback("プリセットを保存しました。");
    } catch (error) {
      console.error("Failed to save preset:", error);
      displayFeedback("プリセットの保存に失敗しました。");
    }
  };
  const handleLoadPreset = () => {
    try {
      const savedData = localStorage.getItem(PRESET_STORAGE_KEY);
      if (savedData) {
        const preset: TimerPreset = JSON.parse(savedData);
        if (preset.version === CURRENT_PRESET_VERSION) {
          handleReset();
          setTimeout(() => {
            setInitialMainTime(preset.initialMainTime);
            setMainAlarmSoundType(preset.mainAlarmSoundType);
            setMainAlarmBellCount(preset.mainAlarmBellCount);
            setChimes(
              preset.chimes.map((chime) => ({ ...chime, triggered: false }))
            );
            displayFeedback("プリセットを読み込みました。");
          }, 50);
        } else {
          displayFeedback("プリセットのバージョンが異なります。");
        }
      } else {
        displayFeedback("保存されたプリセットが見つかりません。");
      }
    } catch (error) {
      console.error("Failed to load preset:", error);
      displayFeedback("プリセットの読み込みに失敗しました。");
    }
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prevIsFullscreen) => !prevIsFullscreen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key === "Escape") {
        if (isFullscreen) {
          event.preventDefault();
          toggleFullscreen();
        }
      } else if (event.code === "Space") {
        event.preventDefault();
        handleStartPause();
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        handleReset();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStartPause, handleReset, isFullscreen, toggleFullscreen]);

  const progressDisplayValue = useMemo(() => {
    const totalSec = getCurrentTotalInitialSeconds();
    if (totalSec > 0) {
      if (isMainTimerFinished) return 100;
      return (timeLeftInSeconds / totalSec) * 100;
    }
    return isMainTimerFinished ? 0 : 100;
  }, [timeLeftInSeconds, getCurrentTotalInitialSeconds, isMainTimerFinished]);
  const chimeMarkers = useMemo(() => {
    const totalSeconds = getCurrentTotalInitialSeconds();
    if (totalSeconds === 0 || chimes.length === 0) return [];
    return chimes.map((chime) => {
      const chimeTimeInSeconds =
        chime.timeFromStart.m * 60 + chime.timeFromStart.s;
      const effectiveChimeTime = Math.min(chimeTimeInSeconds, totalSeconds);
      const percentageFromStart = (effectiveChimeTime / totalSeconds) * 100;
      const defaultName = `チャイム (${chime.timeFromStart.m}分 ${chime.timeFromStart.s}秒)`;
      return {
        id: chime.id,
        name: chime.name || defaultName,
        left: `${100 - percentageFromStart}%`,
        triggered: chime.triggered,
        time: `${chime.timeFromStart.m}分 ${chime.timeFromStart.s}秒`,
      };
    });
  }, [chimes, getCurrentTotalInitialSeconds]);

  const alarmClockClassName = useMemo(() => {
    const baseClasses = "mx-auto transition-all duration-300 ease-in-out";
    let colorClass = "text-sky-300";
    let animationClass = "";
    if (isMainTimerFinished) {
      colorClass = overtimeInSeconds > 0 ? "text-red-400" : "text-yellow-400";
      if (isMainAlarmAnimationActive) animationClass = "animate-ping";
    }
    return `${baseClasses} ${colorClass} ${animationClass}`.trim();
  }, [isMainTimerFinished, overtimeInSeconds, isMainAlarmAnimationActive]);

  const timerTextClassName = useMemo(() => {
    const baseClasses =
      "font-mono tabular-nums select-none transition-colors duration-300";
    let colorClass = "text-slate-100";
    let animationClass = "";
    let layoutClasses =
      showMainSettings || showChimeSettingsPanel || showPresetPanel
        ? "pt-0"
        : "pt-4";
    let sizeClass = "text-6xl lg:text-7xl";

    if (isFullscreen) {
      sizeClass = "text-[18vw] sm:text-[17vw] md:text-[15vw] lg:text-[13vw]";
      layoutClasses = "pt-8 mb-0";
    }

    if (isMainTimerFinished) {
      colorClass = overtimeInSeconds > 0 ? "text-red-400" : "text-yellow-400";
      if (isMainAlarmAnimationActive) animationClass = "animate-pulse";
    }
    return `${baseClasses} ${colorClass} ${animationClass} ${sizeClass} ${layoutClasses}`.trim();
  }, [
    isMainTimerFinished,
    overtimeInSeconds,
    isMainAlarmAnimationActive,
    showMainSettings,
    showChimeSettingsPanel,
    showPresetPanel,
    isFullscreen,
  ]);

  const cardContainerClass = useMemo(() => {
    return isFullscreen
      ? "fixed inset-0 w-screen h-screen bg-slate-900 flex flex-col items-center justify-center p-0 rounded-none max-w-none overflow-auto z-[9999] border-none outline-none ring-0"
      : "w-full max-w-lg lg:max-w-xl mx-auto bg-slate-800/70 backdrop-blur-xl border border-slate-700/60 shadow-2xl rounded-2xl";
  }, [isFullscreen]);

  return (
    <TooltipProvider delayDuration={100}>
      <Card
        ref={cardRef}
        className={`${cardContainerClass} text-slate-50 flex flex-col ${
          !isFullscreen
            ? "outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            : "outline-none ring-0"
        }`}
      >
        {!isFullscreen && (
          <CardHeader className="pt-5 pb-3 items-center">
            <div className="flex items-center justify-between w-full px-2">
              <div className="w-20 flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="text-slate-400 hover:text-sky-300"
                      aria-label={isFullscreen ? "拡大表示終了" : "拡大表示"}
                    >
                      {isFullscreen ? (
                        <Minimize size={20} />
                      ) : (
                        <Maximize size={20} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>
                      {isFullscreen
                        ? "拡大表示終了 (F or ESC)"
                        : "拡大表示 (F)"}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowPresetPanel((p) => !p);
                        if (showChimeSettingsPanel)
                          setShowChimeSettingsPanel(false); // Close other panel
                      }}
                      className="text-slate-400 hover:text-sky-300"
                      aria-label="プリセット管理"
                    >
                      <Archive size={20} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>プリセット管理</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <AlarmClock size={32} className={alarmClockClassName} />
              <div className="w-20 flex justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowChimeSettingsPanel((p) => !p);
                        if (showPresetPanel) setShowPresetPanel(false); // Close other panel
                      }}
                      className="text-slate-400 hover:text-sky-300"
                      aria-label="チャイム設定"
                    >
                      <Settings2 size={20} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>
                      {showChimeSettingsPanel
                        ? "チャイム設定を隠す"
                        : "チャイム設定を表示"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
        )}

        <CardContent
          className={`flex flex-col items-center space-y-4 flex-grow ${
            isFullscreen
              ? "justify-center w-full p-4" // Fullscreen specific padding
              : "px-4 md:px-6 lg:px-8 pb-2" // Normal padding
          }`}
        >
          <div className={timerTextClassName}>
            {isMainTimerFinished && timeLeftInSeconds === 0
              ? `-${formatTimerTime(overtimeInSeconds)}`
              : formatTimerTime(timeLeftInSeconds)}
          </div>

          {isMainTimerFinished &&
            timeLeftInSeconds === 0 &&
            !isRunning &&
            !isFullscreen && ( // Only show if timer finished, not running, and not fullscreen
              <BellRing
                size={40}
                className="text-yellow-400 opacity-80 my-1 animate-bounce" // Or other appropriate animation
              />
            )}

          <div
            className={`w-full relative pt-2 pb-2 ${
              isFullscreen ? "px-4 sm:px-8 md:px-12 lg:px-16" : "" // Wider padding for progress in fullscreen
            }`}
          >
            <Progress
              value={progressDisplayValue}
              className="w-full h-3 bg-slate-700/80 rounded-full [&>div]:bg-sky-400 transition-all duration-150"
            />
            {chimeMarkers.map((marker) => (
              <Tooltip key={marker.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute top-[-2px] -translate-x-1/2 w-1.5 h-4 rounded-full ${
                      marker.triggered
                        ? "bg-sky-400 opacity-70" // Triggered chime color
                        : "bg-yellow-400 opacity-90" // Pending chime color
                    } cursor-pointer hover:opacity-100 hover:scale-125 transition-transform z-10`}
                    style={{ left: marker.left }}
                    aria-label={`チャイム: ${marker.name} 時刻: ${marker.time}`}
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 text-white border-slate-700 shadow-xl">
                  <p className="text-xs whitespace-nowrap">
                    {marker.name}
                    <br />
                    時刻: {marker.time}
                    <br />
                    {marker.triggered ? "状態: 鳴動済み" : "状態: 未鳴動"}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div
            className={`flex w-full sm:w-auto sm:space-x-3 flex-col sm:flex-row space-y-3 sm:space-y-0 ${
              isFullscreen ? "mt-6 order-last" : "pt-2"
            }`}
          >
            <Button
              onClick={handleStartPause}
              size={"lg"}
              disabled={
                getCurrentTotalInitialSeconds() === 0 &&
                !isRunning &&
                timeLeftInSeconds === 0 &&
                !isMainTimerFinished
              }
              className={`w-full sm:w-auto bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300 hover:text-sky-200 transition-colors duration-200 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                isFullscreen ? "px-10 py-4 text-xl" : "px-8 py-3 text-lg"
              }`}
            >
              {isRunning ? (
                <Pause
                  className={isFullscreen ? "mr-3 h-6 w-6" : "mr-2 h-5 w-5"}
                />
              ) : (
                <Play
                  className={isFullscreen ? "mr-3 h-6 w-6" : "mr-2 h-5 w-5"}
                />
              )}
              {isRunning ? "Pause" : isMainTimerFinished ? "Dismiss" : "Start"}
            </Button>
            <Button
              onClick={handleReset}
              size={"lg"}
              className={`w-full sm:w-auto bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 text-pink-300 hover:text-pink-200 transition-colors duration-200 rounded-lg ${
                isFullscreen ? "px-10 py-4 text-xl" : "px-8 py-3 text-lg"
              }`}
            >
              <RotateCcw
                className={isFullscreen ? "mr-3 h-6 w-6" : "mr-2 h-5 w-5"}
              />
              Reset
            </Button>
          </div>

          {!isFullscreen && (
            <>
              {showPresetPanel && (
                <div className="w-full pt-4 pb-0 mb-0">
                  <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <h3 className="text-md font-semibold text-sky-200 text-center mb-2">
                      プリセット管理
                    </h3>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button
                        onClick={handleSavePreset}
                        variant="outline"
                        size="sm"
                        className="text-purple-300 border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-200 w-full sm:w-auto"
                      >
                        <Save size={16} className="mr-2" /> 現在の設定を保存
                      </Button>
                      <Button
                        onClick={handleLoadPreset}
                        variant="outline"
                        size="sm"
                        className="text-green-300 border-green-500/50 hover:bg-green-500/10 hover:text-green-200 w-full sm:w-auto"
                      >
                        <Download size={16} className="mr-2" />
                        保存した設定を読込
                      </Button>
                    </div>
                    <div className="text-xs text-center text-slate-400 pt-2 h-6">
                      {feedbackMessage && <p>{feedbackMessage}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`w-full transition-all duration-500 ease-in-out overflow-hidden grid ${
                  showMainSettings &&
                  !showChimeSettingsPanel &&
                  !showPresetPanel
                    ? "grid-rows-[1fr] opacity-100 pt-4"
                    : "grid-rows-[0fr] opacity-0"
                }`}
                aria-hidden={
                  !showMainSettings || showChimeSettingsPanel || showPresetPanel
                }
              >
                <div className="overflow-hidden min-h-0 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2 text-center">
                      Set Main Timer Duration
                    </h3>
                    <div className="flex space-x-1 sm:space-x-2 items-center justify-center w-full">
                      {(["h", "m", "s"] as const).map((unit, idx) => (
                        <React.Fragment key={`main-${unit}`}>
                          <div className="flex flex-col items-center w-[calc(100%/3-0.5rem)] sm:w-[calc(100%/3-1rem)] max-w-[5rem] sm:max-w-[6rem]">
                            <ScrollPicker
                              label={unit.toUpperCase()}
                              values={
                                unit === "h"
                                  ? hoursValues
                                  : unit === "m"
                                  ? minutesValues
                                  : secondsValues
                              }
                              currentValue={initialMainTime[unit]}
                              onChange={(newVal) =>
                                handleMainTimeChange(unit, newVal)
                              }
                            />
                            <span className="mt-1 text-xs text-slate-400 capitalize">
                              {unit === "h"
                                ? "Hrs"
                                : unit === "m"
                                ? "Min"
                                : "Sec"}
                            </span>
                          </div>
                          {idx < 2 && (
                            <span className="text-3xl lg:text-4xl text-slate-500 shrink-0 select-none self-center pb-3 sm:pb-3 md:pb-4 mb-3">
                              :
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3 text-center">
                      Main Alarm Sound (本鈴)
                    </h3>
                    <div className="flex flex-col items-center space-y-3">
                      <ToggleGroup
                        type="single"
                        value={mainAlarmSoundType}
                        onValueChange={(value) => {
                          if (value)
                            setMainAlarmSoundType(value as "chime" | "bell");
                        }}
                        className="rounded-lg border border-slate-700/60 bg-slate-900/30 p-0.5"
                      >
                        <ToggleGroupItem
                          value="chime"
                          className="px-4 py-1.5 data-[state=on]:bg-sky-600 data-[state=on]:text-white hover:bg-slate-700/50 text-slate-300 rounded-l-md text-sm"
                          aria-label="Chime Sound for Main Alarm"
                        >
                          <Volume2 size={16} className="mr-2" /> Chime
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="bell"
                          className="px-4 py-1.5 data-[state=on]:bg-sky-600 data-[state=on]:text-white hover:bg-slate-700/50 text-slate-300 rounded-r-md text-sm border-l border-slate-700/60"
                          aria-label="Bell Sound for Main Alarm"
                        >
                          <RadioTower size={16} className="mr-2" /> Bell
                        </ToggleGroupItem>
                      </ToggleGroup>
                      {mainAlarmSoundType === "bell" && (
                        <div className="flex flex-col items-center space-y-1 w-32">
                          <Label
                            htmlFor="main-bell-count-picker"
                            className="text-xs text-slate-400"
                          >
                            Bell Count:
                          </Label>
                          <ScrollPicker
                            label="Main Alarm Bell Count"
                            values={bellCountValues}
                            currentValue={mainAlarmBellCount}
                            onChange={setMainAlarmBellCount}
                          />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={triggerTestMainAlarm}
                        className="text-slate-400 hover:text-sky-300 hover:bg-slate-700/50 mt-1 px-3 py-1.5 rounded-md"
                      >
                        {uiActiveTestSoundId === "main_alarm" ? (
                          <StopCircle size={16} className="mr-2 text-red-400" />
                        ) : (
                          <PlayCircle size={16} className="mr-2" />
                        )}
                        {uiActiveTestSoundId === "main_alarm"
                          ? "Stop"
                          : "Test Sound"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {showChimeSettingsPanel && (
                <div className="w-full pt-0 pb-2">
                  <div className="space-y-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-semibold text-sky-200">
                        Preliminary Chime Settings (予鈴)
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddChime}
                        className="text-sky-300 border-sky-500/50 hover:bg-sky-500/10"
                      >
                        <PlusCircle size={16} className="mr-2" /> Add Chime
                      </Button>
                    </div>
                    {chimes.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">
                        No chimes. Add one to get alerts during the timer.
                      </p>
                    )}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 simple-scrollbar">
                      {chimes.map((chime, chimeIdx) => {
                        const testChimeId = `chime_${chime.id}`;
                        const chimeDisplayName =
                          chime.name || `Chime ${chimeIdx + 1}`;
                        return (
                          <div
                            key={chime.id}
                            className="p-3 bg-slate-700/30 rounded-md border border-slate-600/50 space-y-3"
                          >
                            <div className="flex justify-between items-center">
                              <input
                                type="text"
                                value={chimeDisplayName}
                                onChange={(e) =>
                                  handleChimeNameChange(
                                    chime.id,
                                    e.target.value
                                  )
                                }
                                className="text-sm font-medium text-slate-200 bg-transparent border-b border-slate-600 focus:border-sky-400 focus:ring-0 p-0 w-1/2 outline-none"
                                placeholder={`Chime ${chimeIdx + 1}`}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveChime(chime.id)}
                                className="text-pink-400 hover:text-pink-300 w-7 h-7"
                                aria-label={`Delete ${chimeDisplayName}`}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                            <p className="text-xs text-slate-400 -mt-1 mb-1">
                              Ring
                              <span className="text-sky-300">
                                {chime.bellCount}
                              </span>
                              time(s) (bell sound) at
                              <span className="text-sky-300">
                                {chime.timeFromStart.m}m {chime.timeFromStart.s}
                                s
                              </span>
                              from start.
                            </p>
                            <div className="flex items-end space-x-2">
                              <div className="flex-1">
                                <span className="text-xs text-slate-300 mb-0.5 block">
                                  Time from Start:
                                </span>
                                <div className="flex items-center space-x-1">
                                  <ScrollPicker
                                    label={`Minutes for ${chimeDisplayName}`}
                                    values={minutesValues}
                                    currentValue={chime.timeFromStart.m}
                                    onChange={(newVal) =>
                                      handleChimeValueChange(
                                        chime.id,
                                        "m",
                                        newVal
                                      )
                                    }
                                  />
                                  <span className="text-slate-400 text-xl pb-0.5">
                                    :
                                  </span>
                                  <ScrollPicker
                                    label={`Seconds for ${chimeDisplayName}`}
                                    values={secondsValues}
                                    currentValue={chime.timeFromStart.s}
                                    onChange={(newVal) =>
                                      handleChimeValueChange(
                                        chime.id,
                                        "s",
                                        newVal
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              <div className="w-24">
                                <span className="text-xs text-slate-300 mb-0.5 block">
                                  Bell Count:
                                </span>
                                <ScrollPicker
                                  label={`Bell count for ${chimeDisplayName}`}
                                  values={bellCountValues}
                                  currentValue={chime.bellCount}
                                  onChange={(newVal) =>
                                    handleChimeValueChange(
                                      chime.id,
                                      "bellCount",
                                      newVal
                                    )
                                  }
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  triggerTestChimeSound(
                                    chime.id,
                                    chime.bellCount
                                  )
                                }
                                className="text-slate-400 hover:text-sky-300 hover:bg-slate-700/50 self-end pb-1 w-8 h-8 rounded-md"
                                aria-label={`Test ${chimeDisplayName}`}
                              >
                                {uiActiveTestSoundId === testChimeId ? (
                                  <StopCircle
                                    size={20}
                                    className="text-red-400"
                                  />
                                ) : (
                                  <PlayCircle size={20} />
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>

        {!isFullscreen && (
          <>
            <div className="text-center text-xs text-slate-400 mt-auto pb-2 gap-0">
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
            <CardFooter className="hidden lg:flex justify-center items-center pt-3 pb-3 border-t border-slate-700/50">
              <Tooltip>
                <TooltipTrigger className="flex items-center space-x-2 text-xs text-slate-400 opacity-80 cursor-default p-1 rounded-md hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500">
                  <span className="border border-slate-600 bg-slate-700/50 px-2 py-0.5 rounded shadow-sm">
                    SPACE
                  </span>
                  <span className="text-slate-500">/</span>
                  <span className="border border-slate-600 bg-slate-700/50 px-1.5 py-0.5 rounded shadow-sm">
                    R
                  </span>
                  <span className="text-slate-500">/</span>
                  <span className="border border-slate-600 bg-slate-700/50 px-1.5 py-0.5 rounded shadow-sm">
                    F
                  </span>
                  <span className="text-slate-500">/</span>
                  <span className="border border-slate-600 bg-slate-700/50 px-1.5 py-0.5 rounded shadow-sm">
                    ESC
                  </span>
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
                    <span className="font-semibold">[F]:</span> Toggle
                    Fullscreen
                  </p>
                  <p>
                    <span className="font-semibold">[ESC]:</span> Exit
                    Fullscreen
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          </>
        )}
        {isFullscreen && (
          <div className="fixed right-4 bottom-4 z-[10000] md:absolute md:bottom-4 md:right-4 md:z-auto pb-[env(safe-area-inset-bottom,0px)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-slate-300 hover:text-sky-300 bg-slate-700/50 hover:bg-slate-600/70 rounded-full p-2"
                  style={{
                    marginBottom:
                      "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)",
                  }}
                >
                  <Minimize size={24} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>拡大表示終了 (F or ESC)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}
