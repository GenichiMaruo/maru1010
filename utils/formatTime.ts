// utils/formatTime.ts

const pad = (n: number) => String(n).padStart(2, "0");

/** ストップウォッチ表示用：{ main: "mm:ss"（1時間以上は "h:mm:ss"）, fraction: "cc"(1/100秒) } */
export function splitStopwatch(ms: number): { main: string; fraction: string } {
  const safe = Math.max(0, ms);
  const centiseconds = Math.floor(safe / 10) % 100;
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const main = `${hours > 0 ? `${hours}:` : ""}${pad(Math.floor(totalSeconds / 60) % 60)}:${pad(totalSeconds % 60)}`;
  return { main, fraction: pad(centiseconds) };
}

/** "hh:mm:ss"。round="ceil" はカウントダウン向け（残り 0.2 秒は 1 秒と表示し、0 になった瞬間に終わる） */
export function formatClock(ms: number, round: "ceil" | "floor" = "floor"): string {
  const totalSeconds = Math.max(0, round === "ceil" ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor(totalSeconds / 60) % 60)}:${pad(totalSeconds % 60)}`;
}

export type Duration = { h: number; m: number; s: number };

export const durationToMs = ({ h, m, s }: Duration) => ((h * 60 + m) * 60 + s) * 1000;
