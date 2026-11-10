import type { Duration } from "@/utils/formatTime";
import type { SoundName } from "@/hooks/useSoundPlayer";

/** 予鈴。開始からの経過時間で鳴らす */
export interface Chime {
  id: string;
  timeFromStart: { m: number; s: number };
  bellCount: number;
  name?: string;
}

export interface PresentationConfig {
  duration: Duration;
  alarmSound: SoundName;
  alarmBellCount: number;
  chimes: Chime[];
}

export const DEFAULT_CONFIG: PresentationConfig = {
  duration: { h: 0, m: 10, s: 0 },
  alarmSound: "chime",
  alarmBellCount: 3,
  chimes: [],
};

export const BELL_INTERVAL_MS = 500;
export const CHIME_INTERVAL_MS = 600;

export const chimeMs = (chime: Chime) => (chime.timeFromStart.m * 60 + chime.timeFromStart.s) * 1000;

export const alarmPlayback = (config: PresentationConfig) =>
  config.alarmSound === "bell"
    ? { name: "bell" as const, times: config.alarmBellCount, intervalMs: BELL_INTERVAL_MS }
    : { name: "chime" as const, times: 1, intervalMs: CHIME_INTERVAL_MS };

// ---- プリセット（旧バージョンと同じキー・形式で保存し、以前保存したものも読めるようにする） ----

const PRESET_KEY = "presentationTimerPreset_v1";
const PRESET_VERSION = 1;

interface StoredPreset {
  version: number;
  initialMainTime: Duration;
  mainAlarmSoundType: SoundName;
  mainAlarmBellCount: number;
  chimes: (Chime & { triggered?: boolean })[];
}

export function savePreset(config: PresentationConfig): boolean {
  const data: StoredPreset = {
    version: PRESET_VERSION,
    initialMainTime: config.duration,
    mainAlarmSoundType: config.alarmSound,
    mainAlarmBellCount: config.alarmBellCount,
    chimes: config.chimes,
  };
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadPreset(): PresentationConfig | "missing" | "invalid" {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PRESET_KEY);
  } catch {
    return "invalid";
  }
  if (!raw) return "missing";
  try {
    const data = JSON.parse(raw) as StoredPreset;
    if (data.version !== PRESET_VERSION) return "invalid";
    return {
      duration: data.initialMainTime,
      alarmSound: data.mainAlarmSoundType === "bell" ? "bell" : "chime",
      alarmBellCount: data.mainAlarmBellCount ?? 3,
      chimes: (data.chimes ?? []).map(({ id, timeFromStart, bellCount, name }) => ({ id, timeFromStart, bellCount, name })),
    };
  } catch {
    return "invalid";
  }
}
