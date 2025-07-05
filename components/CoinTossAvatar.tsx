"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CoinTossAvatarProps {
  className?: string;
}

export function CoinTossAvatar({ className }: CoinTossAvatarProps) {
  const [isCharging, setIsCharging] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<"heads" | "tails" | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);

  const chargeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const startCharging = useCallback(() => {
    // 長押し検出（500ms後に開始）
    longPressTimeoutRef.current = setTimeout(() => {
      setIsCharging(true);
      setChargeLevel(0);

      // チャージレベルを徐々に上げる
      chargeIntervalRef.current = setInterval(() => {
        setChargeLevel((prev) => {
          if (prev >= 100) return 100;
          return prev + 2;
        });
      }, 30);

      // 最大3秒でチャージ完了
      chargeTimeoutRef.current = setTimeout(() => {
        setChargeLevel(100);
        setIsVibrating(true);
        // 振動エフェクト終了
        setTimeout(() => setIsVibrating(false), 200);
        if (chargeIntervalRef.current) {
          clearInterval(chargeIntervalRef.current);
        }
      }, 3000);
    }, 500);
  }, []);

  const executeFlip = useCallback(() => {
    setIsFlipping(true);
    setShowResult(false);
    setIsVibrating(true);

    // 振動エフェクト終了
    setTimeout(() => setIsVibrating(false), 300);

    // 1.5秒後に結果を表示
    setTimeout(() => {
      const result = Math.random() < 0.5 ? "heads" : "tails";
      setCoinResult(result);
      setIsFlipping(false);
      setShowResult(true);

      // 4秒後に結果を非表示
      setTimeout(() => {
        setShowResult(false);
        setCoinResult(null);
      }, 3000);
    }, 1500);
  }, []);

  const stopCharging = useCallback(() => {
    // タイムアウトとインターバルをクリア
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    if (chargeTimeoutRef.current) {
      clearTimeout(chargeTimeoutRef.current);
    }
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
    }

    // チャージが一定以上の場合、コイントスを実行
    if (isCharging && chargeLevel >= 30) {
      executeFlip();
    }

    setIsCharging(false);
    setChargeLevel(0);
    setIsVibrating(false);
  }, [isCharging, chargeLevel, executeFlip]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current)
        clearTimeout(longPressTimeoutRef.current);
      if (chargeTimeoutRef.current) clearTimeout(chargeTimeoutRef.current);
      if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* アバター */}
      <div
        className={`relative select-none cursor-pointer transition-all duration-200 ${
          isCharging ? "scale-110" : "hover:scale-105"
        } ${isFlipping ? "animate-spin" : ""} ${
          isVibrating ? "" : ""
        } ${className}`}
        onMouseDown={startCharging}
        onMouseUp={stopCharging}
        onMouseLeave={stopCharging}
        onTouchStart={startCharging}
        onTouchEnd={stopCharging}
        style={{
          filter: isCharging
            ? `brightness(${1 + chargeLevel * 0.01}) saturate(${
                1 + chargeLevel * 0.02
              })`
            : "none",
          transformStyle: "preserve-3d",
          animation: isFlipping
            ? "flip3d 1.5s ease-in-out"
            : isVibrating
            ? "shake 0.3s ease-in-out"
            : undefined,
        }}
      >
        <Avatar
          className={`w-32 h-32 border-4 transition-all duration-200 ${
            isFlipping
              ? "animate-pulse border-yellow-400"
              : showResult && coinResult === "heads"
              ? "border-green-400 shadow-lg shadow-green-400/50"
              : showResult && coinResult === "tails"
              ? "border-red-400 shadow-lg shadow-red-400/50"
              : "border-blue-500 dark:border-blue-400"
          }`}
        >
          <AvatarImage
            src="/avatar.png"
            alt="Profile Picture"
            className={`transition-all duration-500 ${
              showResult && coinResult === "heads"
                ? "hue-rotate-90 saturate-150 brightness-110"
                : showResult && coinResult === "tails"
                ? "hue-rotate-180 saturate-150 brightness-90 contrast-125"
                : ""
            }`}
          />
          <AvatarFallback
            className={`transition-all duration-500 ${
              showResult && coinResult === "heads"
                ? "bg-green-100 text-green-800"
                : showResult && coinResult === "tails"
                ? "bg-red-100 text-red-800"
                : ""
            }`}
          >
            GM
          </AvatarFallback>
        </Avatar>

        {/* チャージエフェクト */}
        {isCharging && (
          <>
            {/* チャージリング */}
            <div
              className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-pulse"
              style={{
                borderWidth: `${2 + chargeLevel * 0.05}px`,
                opacity: chargeLevel * 0.01,
                animation:
                  chargeLevel > 50
                    ? "chargeGlow 0.8s ease-in-out infinite"
                    : undefined,
              }}
            />

            {/* チャージパーティクル */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                  style={{
                    top: `${20 + Math.sin((i * Math.PI) / 4) * 40}%`,
                    left: `${20 + Math.cos((i * Math.PI) / 4) * 40}%`,
                    animationDelay: `${i * 100}ms`,
                    opacity: chargeLevel * 0.01,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 結果表示 - 控えめなポップアップ */}
      {showResult && coinResult && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-10">
          <div
            className={`px-3 py-1 rounded-full text-white text-sm font-semibold shadow-lg ${
              coinResult === "heads" ? "bg-green-500" : "bg-red-500"
            }`}
            style={{
              animation: "fadeInBounce 0.5s ease-out",
            }}
          >
            {coinResult === "heads" ? "😊 表" : "😮 裏"}
          </div>
          {/* 小さな矢印 */}
          <div
            className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent ${
              coinResult === "heads" ? "border-t-green-500" : "border-t-red-500"
            }`}
          />
        </div>
      )}

      {/* チャージレベル表示 */}
      {isCharging && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 rounded-full px-3 py-1 text-xs text-white dark:text-gray-800 font-semibold">
          {chargeLevel >= 100 ? "READY!" : `${Math.floor(chargeLevel)}%`}
        </div>
      )}
    </div>
  );
}
