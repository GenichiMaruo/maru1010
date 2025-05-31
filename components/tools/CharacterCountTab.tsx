"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added for Tabs
import runes from "runes2";
import {
  FaTextHeight,
  FaParagraph,
  FaAlignLeft,
  FaRegCopy,
  FaRegTrashCan,
  FaCheck,
  FaKeyboard,
  FaRegComments,
  FaLanguage,
} from "react-icons/fa6";
import { FaSyncAlt } from "react-icons/fa";

// StatDisplay component remains the same
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

// Helper functions for case conversion
const toWords = (str: string): string[] => {
  if (!str) return [];
  // Handle various delimiters and case changes to split into words
  str = str.replace(/([a-z])([A-Z])/g, "$1 $2"); // camelCase, PascalCase: insert space before uppercase
  str = str.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2"); // All caps followed by Pascal: NASAController -> NASA Controller
  str = str.replace(/[\s_-]+/g, " "); // Replace spaces, underscores, hyphens with a single space
  str = str.trim();
  if (!str) return [];
  return str.split(" ").map((word) => word.toLowerCase());
};

const toCamelCase = (words: string[]): string => {
  return words
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
};

const toPascalCase = (words: string[]): string => {
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

const toSnakeCase = (words: string[]): string => {
  return words.join("_");
};

const toKebabCase = (words: string[]): string => {
  return words.join("-");
};

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

  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  const languages = [
    { value: "generic_block_line", label: "標準 (// と /* */)" },
    { value: "hash_comments", label: "ハッシュ (#)" },
    { value: "html_comments", label: "HTML ()" }, // Corrected label
  ];

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!textareaRef.current) return;
      setIsResizing(true);
      resizeStartYRef.current = e.clientY;
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
      document.body.style.cursor = "";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleResizeMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  const textWithoutNewlines = text.replace(/\n/g, "");
  const runeCount = runes(textWithoutNewlines).length;
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const lineCount = text === "" ? 0 : text.split(/\n/).length;

  const handleRemoveNewlines = () => {
    setText((prev) => prev.replace(/\r?\n/g, ""));
  };

  const lastWhitespaceClickTimeRef = useRef(0);
  const DOUBLE_CLICK_THRESHOLD_MS = 300;

  const handleRemoveWhitespaces = () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastWhitespaceClickTimeRef.current;

    if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD_MS) {
      setText((prev) => {
        const consolidated = prev.replace(/[ \t\u3000]+/g, " ");
        return consolidated.trim();
      });
      lastWhitespaceClickTimeRef.current = 0;
    } else {
      setText((prev) => prev.replace(/[ \u3000\t]/g, ""));
      lastWhitespaceClickTimeRef.current = now;
    }
  };

  const [confirmClear, setConfirmClear] = useState(false);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      clearTimeoutRef.current = setTimeout(() => setConfirmClear(false), 3000);
    } else {
      setText("");
      setTextareaHeight(undefined);
      setConfirmClear(false);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    }
  };

  const handleCopyToClipboard = () => {
    if (typeof navigator.clipboard?.writeText === "function") {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text using navigator.clipboard: ", err);
          tryCopyLegacy();
        });
    } else {
      tryCopyLegacy();
    }
  };

  const tryCopyLegacy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error(
          "Fallback: Failed to copy text using document.execCommand"
        );
      }
    } catch (err) {
      console.error(
        "Fallback: Error copying text using document.execCommand",
        err
      );
    }
    document.body.removeChild(textArea);
  };

  const handleRemoveComments = () => {
    if (!selectedLanguage || !text) return;
    let newText = text;
    switch (selectedLanguage) {
      case "generic_block_line":
        newText = newText.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
        break;
      case "hash_comments":
        newText = newText.replace(/#.*/g, "");
        break;
      case "html_comments":
        newText = newText.replace(/<!--[\s\S]*?-->/g, ""); // Corrected regex for HTML comments
        break;
      default:
        console.warn(
          "Unsupported language for comment removal:",
          selectedLanguage
        );
        return;
    }
    newText = newText.replace(/^\s*[\r\n]/gm, "").trimEnd();
    setText(newText);
  };

  const handleJpToEnPunctuation = () => {
    setText((prev) => prev.replace(/、/g, ", ").replace(/。/g, ". "));
  };

  const handleEnToJpPunctuation = () => {
    setText((prev) => prev.replace(/,/g, "、").replace(/\./g, "。"));
  };

  // Case conversion handlers
  const applyCaseConversion = (conversionFunc: (words: string[]) => string) => {
    if (!text) return;
    const words = toWords(text);
    if (words.length === 0 && text.trim().length > 0) {
      // Handle cases where toWords might not split as expected for non-empty text
      // If toWords returns empty for a non-empty, non-whitespace string, it implies no typical word pattern was found.
      // In this scenario, we might decide to not change the text or apply a default transformation if sensible.
      // For now, we'll leave the text as is, or you could set a message.
      console.warn("Could not split text into words for case conversion.");
      return;
    }
    setText(conversionFunc(words));
  };

  const handleConvertToCamelCase = () => applyCaseConversion(toCamelCase);
  const handleConvertToPascalCase = () => applyCaseConversion(toPascalCase);
  const handleConvertToSnakeCase = () => applyCaseConversion(toSnakeCase);
  const handleConvertToKebabCase = () => applyCaseConversion(toKebabCase);

  const caseConversionOptions = [
    {
      label: "キャメル",
      handler: handleConvertToCamelCase,
      tooltip: "例: helloWorld",
      color:
        "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300 hover:text-sky-200",
    },
    {
      label: "パスカル",
      handler: handleConvertToPascalCase,
      tooltip: "例: HelloWorld",
      color:
        "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:text-emerald-200",
    },
    {
      label: "スネーク",
      handler: handleConvertToSnakeCase,
      tooltip: "例: hello_world",
      color:
        "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300 hover:text-rose-200",
    },
    {
      label: "ケバブ",
      handler: handleConvertToKebabCase,
      tooltip: "例: hello-world",
      color:
        "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 hover:text-amber-200",
    },
  ];

  // Add state for active tab
  const [activeTab, setActiveTab] = useState<string>("general");

  return (
    <Card className="w-full max-w-3xl mx-auto bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl text-slate-50 flex flex-col gap-0 py-3">
      <CardHeader className="px-6 pt-4 pb-2 flex justify-center items-center">
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
            className="min-h-[220px] md:min-h-[250px] text-base bg-slate-900/70 border-slate-700/80 focus:border-sky-500 ring-offset-slate-900 focus-visible:ring-sky-500 text-slate-100 placeholder:text-slate-400 rounded-xl p-4 shadow-inner resize-none"
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

      <Tabs
        defaultValue="general"
        className="w-full px-0"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="flex w-full justify-between gap-1 bg-slate-700/30 rounded-none px-2 md:px-4 py-0.5 border-y border-slate-700/50 flex-wrap">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-sky-600/30 data-[state=active]:text-sky-200 text-slate-300 hover:bg-slate-600/40 rounded-md py-1.5 text-xs sm:text-sm"
          >
            基本機能
          </TabsTrigger>
          <TabsTrigger
            value="formatting"
            className="data-[state=active]:bg-sky-600/30 data-[state=active]:text-sky-200 text-slate-300 hover:bg-slate-600/40 rounded-md py-1.5 text-xs sm:text-sm"
          >
            テキスト整形
          </TabsTrigger>
          <TabsTrigger
            value="programming"
            className="data-[state=active]:bg-sky-600/30 data-[state=active]:text-sky-200 text-slate-300 hover:bg-slate-600/40 rounded-md py-1.5 text-xs sm:text-sm"
          >
            プログラミング
          </TabsTrigger>
        </TabsList>

        <CardFooter className="flex flex-col gap-3 md:px-6 px-4 pt-3 pb-4">
          {" "}
          {/* Added min-h to prevent layout shifts */}
          <TabsContent value="general" className="w-full mt-0">
            <div className="w-full flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="w-full sm:w-auto bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300 hover:text-sky-200 transition-colors duration-200 rounded-lg"
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
          </TabsContent>
          <TabsContent value="formatting" className="w-full mt-0 space-y-3">
            <div className="w-full flex flex-col sm:flex-row gap-2 items-center pt-1">
              <Button
                onClick={handleRemoveNewlines}
                variant="outline"
                className="w-full sm:flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:text-yellow-200 transition-colors duration-200 rounded-lg"
                disabled={!text}
              >
                改行を削除
              </Button>
              <Button
                onClick={handleRemoveWhitespaces}
                variant="outline"
                className="w-full sm:flex-1 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300 hover:text-purple-200 transition-colors duration-200 rounded-lg"
                disabled={!text}
              >
                空白を削除
              </Button>
            </div>
            <div className="w-full flex flex-col sm:flex-row gap-2 items-center pt-2 border-t border-slate-700/50">
              <TooltipProvider delayDuration={100}>
                {" "}
                <Tooltip>
                  {" "}
                  <TooltipTrigger asChild>
                    <div className="w-full sm:flex-1">
                      <Button
                        onClick={handleJpToEnPunctuation}
                        variant="outline"
                        className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300 hover:text-cyan-200 transition-colors duration-200 rounded-lg px-3 py-2 flex items-center justify-center"
                        disabled={!text}
                      >
                        <FaLanguage className="mr-2 h-4 w-4 flex-shrink-0" />{" "}
                        <span className="truncate">「、。」→「, .」</span>
                      </Button>
                    </div>
                  </TooltipTrigger>{" "}
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                    <p>
                      日本語の句読点（、。）を英語スタイル（, .）に変換します。
                    </p>
                  </TooltipContent>{" "}
                </Tooltip>{" "}
              </TooltipProvider>
              <TooltipProvider delayDuration={100}>
                {" "}
                <Tooltip>
                  {" "}
                  <TooltipTrigger asChild>
                    <div className="w-full sm:flex-1">
                      <Button
                        onClick={handleEnToJpPunctuation}
                        variant="outline"
                        className="w-full bg-lime-500/10 hover:bg-lime-500/20 border-lime-500/30 text-lime-300 hover:text-lime-200 transition-colors duration-200 rounded-lg px-3 py-2 flex items-center justify-center"
                        disabled={!text}
                      >
                        <FaLanguage className="mr-2 h-4 w-4 flex-shrink-0" />{" "}
                        <span className="truncate">「, .」→「、。」</span>
                      </Button>
                    </div>
                  </TooltipTrigger>{" "}
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                    <p>
                      英語の句読点（, .）を日本語スタイル（、。）に変換します。
                    </p>
                  </TooltipContent>{" "}
                </Tooltip>{" "}
              </TooltipProvider>
            </div>
          </TabsContent>
          <TabsContent value="programming" className="w-full mt-0 space-y-3">
            <div className="w-full flex flex-col sm:flex-row gap-2 items-center pt-1">
              <div className="w-full sm:w-auto sm:flex-grow mb-2 sm:mb-0 sm:mr-2">
                <Select
                  onValueChange={setSelectedLanguage}
                  value={selectedLanguage}
                >
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectTrigger className="w-full bg-slate-700/50 border-slate-600/70 hover:bg-slate-700/80 text-slate-200 focus:ring-sky-500 rounded-lg">
                          <SelectValue placeholder="コメントタイプを選択..." />
                        </SelectTrigger>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                        <p>削除したいコメントのタイプを選択してください。</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100 rounded-lg shadow-lg">
                    {languages.map((lang) => (
                      <SelectItem
                        key={lang.value}
                        value={lang.value}
                        className="hover:bg-slate-700 focus:bg-sky-600/30 cursor-pointer"
                      >
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full sm:w-auto">
                      <Button
                        onClick={handleRemoveComments}
                        variant="outline"
                        className="w-full sm:w-auto bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30 text-teal-300 hover:text-teal-200 transition-colors duration-200 rounded-lg px-4 py-2 flex items-center justify-center"
                        disabled={!text || !selectedLanguage}
                      >
                        <FaRegComments className="mr-2 h-4 w-4" />{" "}
                        コメントを削除
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[200px] text-sm">
                    <p>
                      選択されたタイプのコメントをテキストから全て削除します。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/50">
              {caseConversionOptions.map((c) => (
                <TooltipProvider key={c.label} delayDuration={100}>
                  {" "}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          onClick={c.handler}
                          variant="outline"
                          className={`w-full ${c.color} transition-colors duration-200 rounded-lg px-3 py-2 flex items-center justify-center`}
                          disabled={!text}
                        >
                          <FaSyncAlt className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="text-xs sm:text-sm truncate">
                            {c.label}へ
                          </span>
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[180px] text-sm">
                      <p>
                        {c.label}ケースに変換します。
                        <br />
                        {c.tooltip}
                      </p>
                    </TooltipContent>
                  </Tooltip>{" "}
                </TooltipProvider>
              ))}
            </div>
          </TabsContent>
        </CardFooter>
      </Tabs>
    </Card>
  );
}
