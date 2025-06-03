// utils/formatTime.ts
export const formatTime = (timeInMilliseconds: number): string => {
  // ミリ秒を1/100秒単位に変換 (小数点以下2桁表示のため)
  const centiseconds = Math.floor(timeInMilliseconds / 10) % 100;

  const totalSeconds = Math.floor(timeInMilliseconds / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  // 各単位を2桁の文字列にフォーマット (例: 5 -> "05")
  const paddedHours = String(hours).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");
  const paddedCentiseconds = String(centiseconds).padStart(2, "0");

  let formattedTime = "";

  if (hours > 0) {
    formattedTime += `${paddedHours}:`;
  }

  formattedTime += `${paddedMinutes}:${paddedSeconds}.${paddedCentiseconds}`;

  return formattedTime;
};

export function formatTimerTime(timeInSeconds: number): string {
  const seconds = String(timeInSeconds % 60).padStart(2, "0");
  const minutes = String(Math.floor(timeInSeconds / 60) % 60).padStart(2, "0");
  const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
