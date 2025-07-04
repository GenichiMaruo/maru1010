"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FaPlus, FaTimes } from "react-icons/fa";
import { FileTab } from "@/hooks/useFileManager";

interface FileTabBarProps {
  fileTabs: FileTab[];
  activeFileId: string;
  setActiveFileId: (id: string) => void;
  closeFile: (id: string) => void;
  addNewFile: () => void;
}

export function FileTabBar({
  fileTabs,
  activeFileId,
  setActiveFileId,
  closeFile,
  addNewFile,
}: FileTabBarProps) {
  return (
    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 min-h-[35px]">
      <div className="flex overflow-x-auto">
        {fileTabs.map((file) => (
          <div
            key={file.id}
            className={`flex items-center gap-2 px-3 py-2 border-r border-slate-200 dark:border-slate-700 cursor-pointer text-sm transition-colors group min-w-0 ${
              file.id === activeFileId
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
            }`}
            onClick={() => setActiveFileId(file.id)}
          >
            <div className="w-3 h-3 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-sm"></div>
            </div>
            <span className="truncate max-w-[120px]">{file.name}</span>
            {file.isDirty && (
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"></div>
            )}
            {fileTabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ml-1 flex-shrink-0"
              >
                <FaTimes className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={addNewFile}
        className="h-6 w-6 p-0 ml-2 text-slate-600 dark:text-slate-300"
      >
        <FaPlus className="w-3 h-3" />
      </Button>
    </div>
  );
}
