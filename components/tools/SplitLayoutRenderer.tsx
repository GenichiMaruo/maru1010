"use client";

import React, { useCallback } from "react";
import { Editor } from "@tiptap/react";
import { SplitEditorPane } from "./SplitEditorPane";
import { SplitContainer } from "./SplitContainer";
import type { SplitLayout } from "@/hooks/useEditorLayout";
import type { FileTab } from "@/hooks/useFileManager";

interface SplitLayoutRendererProps {
  layout: SplitLayout;
  files: FileTab[];
  activePaneId: string;
  onPaneActivate: (paneId: string) => void;
  onPaneClose: (paneId: string) => void;
  onPaneSplit: (paneId: string, direction: "horizontal" | "vertical") => void;
  onContentChange: (fileId: string, content: string) => void;
  onFileTabClose: (paneId: string, fileId: string) => void;
  onFileTabActivate: (paneId: string, fileId: string) => void;
  onTabReorder: (paneId: string, fromIndex: number, toIndex: number) => void;
  onTabMove: (
    sourcePane: string,
    targetPane: string,
    fileId: string,
    targetIndex?: number
  ) => void;
  onUpdateSplitSizes: (splitId: string, sizes: number[]) => void;
  onEditorReady?: (paneId: string, editor: Editor | null) => void;
  showNewlineMarkers?: boolean;
  showFullWidthSpaces?: boolean;
  className?: string;
}

export function SplitLayoutRenderer({
  layout,
  files,
  activePaneId,
  onPaneActivate,
  onPaneClose,
  onPaneSplit,
  onContentChange,
  onFileTabClose,
  onFileTabActivate,
  onTabReorder,
  onTabMove,
  onUpdateSplitSizes,
  onEditorReady,
  showNewlineMarkers = false,
  showFullWidthSpaces = false,
  className = "",
}: SplitLayoutRendererProps) {
  const renderLayout = useCallback(
    (currentLayout: SplitLayout): React.ReactNode => {
      if (currentLayout.type === "pane" && currentLayout.pane) {
        const pane = currentLayout.pane;

        return (
          <SplitEditorPane
            key={pane.id}
            pane={pane}
            files={files}
            isActive={activePaneId === pane.id}
            onActivate={() => onPaneActivate(pane.id)}
            onClose={() => onPaneClose(pane.id)}
            onSplit={(direction) => onPaneSplit(pane.id, direction)}
            onContentChange={onContentChange}
            onFileTabClose={(fileId) => onFileTabClose(pane.id, fileId)}
            onFileTabActivate={(fileId) => onFileTabActivate(pane.id, fileId)}
            onTabReorder={(fromIndex, toIndex) =>
              onTabReorder(pane.id, fromIndex, toIndex)
            }
            onTabMove={onTabMove}
            onEditorReady={onEditorReady}
            showNewlineMarkers={showNewlineMarkers}
            showFullWidthSpaces={showFullWidthSpaces}
          />
        );
      }

      if (currentLayout.type === "split" && currentLayout.children) {
        const children = currentLayout.children.map(renderLayout);

        return (
          <SplitContainer
            key={currentLayout.id}
            layout={currentLayout}
            onResize={(sizes) => onUpdateSplitSizes(currentLayout.id, sizes)}
          >
            {children}
          </SplitContainer>
        );
      }

      return null;
    },
    [
      files,
      activePaneId,
      onPaneActivate,
      onPaneClose,
      onPaneSplit,
      onContentChange,
      onFileTabClose,
      onFileTabActivate,
      onTabReorder,
      onTabMove,
      onUpdateSplitSizes,
      onEditorReady,
      showNewlineMarkers,
      showFullWidthSpaces,
    ]
  );

  return (
    <div className={`h-full min-w-0 ${className}`}>{renderLayout(layout)}</div>
  );
}
