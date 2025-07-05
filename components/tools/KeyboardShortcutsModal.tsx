import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "基本操作",
    shortcuts: [
      { keys: ["Ctrl", "S"], description: "ファイルを保存" },
      { keys: ["Ctrl", "Z"], description: "元に戻す" },
      { keys: ["Ctrl", "Y"], description: "やり直し" },
      { keys: ["Ctrl", "A"], description: "全選択" },
      { keys: ["Ctrl", "X"], description: "切り取り" },
      { keys: ["Ctrl", "C"], description: "コピー" },
      { keys: ["Ctrl", "V"], description: "貼り付け" },
    ],
  },
  {
    title: "文字装飾",
    shortcuts: [
      { keys: ["Ctrl", "B"], description: "太字" },
      { keys: ["Ctrl", "I"], description: "斜体" },
      { keys: ["Ctrl", "U"], description: "下線" },
      { keys: ["Ctrl", "Shift", "S"], description: "取り消し線" },
      { keys: ["Ctrl", "`"], description: "インラインコード" },
    ],
  },
  {
    title: "見出し",
    shortcuts: [
      { keys: ["Ctrl", "Alt", "1"], description: "見出し1" },
      { keys: ["Ctrl", "Alt", "2"], description: "見出し2" },
      { keys: ["Ctrl", "Alt", "3"], description: "見出し3" },
      { keys: ["Ctrl", "Alt", "4"], description: "見出し4" },
      { keys: ["Ctrl", "Alt", "5"], description: "見出し5" },
      { keys: ["Ctrl", "Alt", "6"], description: "見出し6" },
    ],
  },
  {
    title: "リスト",
    shortcuts: [
      { keys: ["Ctrl", "Shift", "8"], description: "箇条書きリスト" },
      { keys: ["Ctrl", "Shift", "7"], description: "番号付きリスト" },
      { keys: ["Ctrl", "Shift", "9"], description: "タスクリスト" },
      { keys: ["Tab"], description: "リストのインデント" },
      { keys: ["Shift", "Tab"], description: "リストのインデント解除" },
    ],
  },
  {
    title: "引用・コード",
    shortcuts: [
      { keys: ["Ctrl", "Shift", "."], description: "引用" },
      { keys: ["Ctrl", "Alt", "C"], description: "コードブロック" },
      { keys: ["Ctrl", "Enter"], description: "改行挿入" },
      { keys: ["Ctrl", "Shift", "\\"], description: "水平線" },
    ],
  },
  {
    title: "エディタ操作",
    shortcuts: [
      { keys: ["Ctrl", "/"], description: "コメント切り替え" },
      { keys: ["Ctrl", "D"], description: "行の複製" },
      { keys: ["Ctrl", "L"], description: "行の選択" },
      { keys: ["Ctrl", "K"], description: "リンクの挿入/編集" },
      { keys: ["F11"], description: "フルスクリーン切り替え" },
    ],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");

  const formatKey = (key: string) => {
    if (!isMac) return key;
    // macOSでの表示用にキーを変換
    const macKeyMap: Record<string, string> = {
      Ctrl: "⌘",
      Alt: "⌥",
      Shift: "⇧",
      Enter: "⏎",
      Tab: "⇥",
    };
    return macKeyMap[key] || key;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                clipRule="evenodd"
              />
            </svg>
            キーボードショートカット
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, shortcutIndex) => (
                  <div
                    key={shortcutIndex}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1 ml-4">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 mx-1">
                              +
                            </span>
                          )}
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm">
                            {formatKey(key)}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                ヒント
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                {isMac
                  ? "macOSでは「Ctrl」キーは「⌘ (Command)」キーに読み替えてください。"
                  : "一部のショートカットはブラウザやOSの設定によって動作しない場合があります。"}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
