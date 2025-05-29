"use client";

import { useState, useRef, useEffect, useCallback } from "react"; // useRef, useEffect, useCallback を追加
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import runes from "runes2";
import {
  FaTextHeight,
  FaParagraph,
  FaAlignLeft,
  FaRegCopy,
  FaRegTrashCan,
  FaCheck,
  FaKeyboard,
} from "react-icons/fa6";

// StatDisplayコンポーネントは前回の修正を維持
const StatDisplay = ({
  icon,
  value,
  tooltipText,
}: {
  icon: React.ReactNode;
  value: string | number;
  tooltipText: string;
}) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center justify-center p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-300 ease-in-out cursor-default shadow-sm border border-white/10 min-w-0">
          <div className="text-xl md:text-2xl text-sky-400 mb-1">{icon}</div>
          <p className="text-base md:text-xl font-semibold text-slate-100 truncate">
            {value}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[150px] text-sm">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function CharacterCountTab() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const [textareaHeight, setTextareaHeight] = useState<number | undefined>(
    undefined
  );
  const [isResizing, setIsResizing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeStartYRef = useRef<number>(0);
  const resizeStartHeightRef = useRef<number>(0);

  const MIN_TEXTAREA_HEIGHT_PX = 220;

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!textareaRef.current) return;
      setIsResizing(true);
      resizeStartYRef.current = e.clientY;
      // 現在のTextareaの高さを取得
      resizeStartHeightRef.current = textareaRef.current.offsetHeight;
      document.body.style.cursor = "ns-resize";
    },
    []
  );

  useEffect(() => {
    const handleResizeMouseMove = (e: MouseEvent) => {
      if (!isResizing || !textareaRef.current) return;
      const deltaY = e.clientY - resizeStartYRef.current;
      let newHeight = resizeStartHeightRef.current + deltaY;
      const currentMinHeight =
        textareaRef.current.classList.contains("md:min-h-[250px]") &&
        window.innerWidth >= 768
          ? 250
          : MIN_TEXTAREA_HEIGHT_PX;

      if (newHeight < currentMinHeight) {
        newHeight = currentMinHeight;
      }

      setTextareaHeight(newHeight);
    };

    const handleResizeMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = ""; // カーソルを元に戻す
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleResizeMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
      document.body.style.cursor = ""; // クリーンアップ時にもカーソルを元に戻す
    };
  }, [isResizing]);

  const textWithoutNewlines = text.replace(/\n/g, "");
  const runeCount = runes(textWithoutNewlines).length;
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lineCount = text === "" ? 0 : text.split(/\n/).length;

  const handleRemoveNewlines = () => {
    setText((prev) => prev.replace(/\r?\n/g, ""));
  };

  const handleRemoveWhitespaces = () => {
    setText((prev) => prev.replace(/[ \u3000\t]/g, ""));
  };

  const [confirmClear, setConfirmClear] = useState(false);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimeoutRef.current = setTimeout(() => setConfirmClear(false), 3000); // 3秒で戻る
    } else {
      setText("");
      setTextareaHeight(undefined);
      setConfirmClear(false);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl text-slate-50 flex flex-col gap-0 py-3">
      <CardHeader className="px-6 pt-4 pb-2 flex justify-center">
        <FaKeyboard className="text-4xl text-sky-300/90 drop-shadow" />
        <CardTitle className="text-2xl md:text-3xl font-semibold text-slate-100 mx-2">
          文字数カウンター
        </CardTitle>
        <FaKeyboard className="text-4xl text-sky-300/90 drop-shadow" />
      </CardHeader>
      <CardContent className="space-y-3 px-4 md:px-6 py-3">
        <div>
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="テキストを入力..."
            className="min-h-[220px] md:min-h-[250px] text-base bg-slate-900/70 border-slate-700/80 focus:border-sky-500 ring-offset-slate-900 focus-visible:ring-sky-500 text-slate-100 placeholder:text-slate-400 rounded-xl p-4 shadow-inner resize-none" // resize-noneでデフォルトのリサイズハンドルを消す
            style={
              textareaHeight !== undefined
                ? { height: `${textareaHeight}px` }
                : {}
            }
          />
          <div
            onMouseDown={handleResizeMouseDown}
            className="w-full h-2.5 mt-[2px] bg-slate-600/30 hover:bg-slate-600/50 cursor-ns-resize rounded-b-md transition-colors duration-150 ease-in-out"
            title="テキストエリアの高さを調整"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <StatDisplay
            icon={<FaTextHeight />}
            value={runeCount}
            tooltipText="文字数 (改行を除く書記素単位)"
          />
          <StatDisplay
            icon={<FaParagraph />}
            value={wordCount}
            tooltipText="単語数"
          />
          <StatDisplay
            icon={<FaAlignLeft />}
            value={lineCount}
            tooltipText="行数"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 md:px-6 px-4 pt-2 pb-4">
        {/* 左側ボタン（スマホでは2列に） */}
        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
          <Button
            onClick={handleRemoveNewlines}
            variant="outline"
            className="bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:text-yellow-200 transition-colors duration-200 rounded-lg"
            disabled={!text}
          >
            改行を削除
          </Button>
          <Button
            onClick={handleRemoveWhitespaces}
            variant="outline"
            className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300 hover:text-purple-200 transition-colors duration-200 rounded-lg"
            disabled={!text}
          >
            空白を削除
          </Button>
        </div>

        {/* 右側ボタン（スマホでは2列に） */}
        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:justify-end">
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className="bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300 hover:text-sky-200 transition-colors duration-200 rounded-lg"
            disabled={!text}
          >
            {copied ? (
              <FaCheck className="mr-2 h-4 w-4 text-green-400" />
            ) : (
              <FaRegCopy className="mr-2 h-4 w-4" />
            )}
            {copied ? "コピー完了" : "テキストをコピー"}
          </Button>
          <Button
            onClick={handleClearClick}
            variant="outline"
            className={`w-full sm:w-auto transition-colors duration-200 rounded-lg ${
              confirmClear
                ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300 hover:text-red-200"
                : "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 text-pink-300 hover:text-pink-200"
            }`}
            disabled={!text}
          >
            {confirmClear ? (
              <>
                <FaRegTrashCan className="mr-2 h-4 w-4" /> 本当にクリア？
              </>
            ) : (
              <>
                <FaRegTrashCan className="mr-2 h-4 w-4" /> クリア
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
