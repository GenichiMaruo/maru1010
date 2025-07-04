import { useState, useCallback, useRef } from "react";

export type SplitDirection = "horizontal" | "vertical";

export interface EditorPane {
  id: string;
  fileIds: string[]; // 複数ファイルをサポート
  activeFileId: string | null; // アクティブなファイル
}

export interface SplitLayout {
  id: string;
  type: "pane" | "split";
  direction?: SplitDirection;
  pane?: EditorPane;
  children?: SplitLayout[];
  sizes?: number[]; // 分割サイズの比率
}

export function useEditorLayout() {
  // VS Code風レイアウト管理
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statisticsHeight, setStatisticsHeight] = useState(300);
  const [isStatisticsResizing, setIsStatisticsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const statisticsResizeRef = useRef<HTMLDivElement>(null);

  // 分割レイアウト管理
  const [splitLayout, setSplitLayout] = useState<SplitLayout>({
    id: "root",
    type: "pane",
    pane: { id: "main", fileIds: [], activeFileId: null },
  });
  const [activePaneId, setActivePaneId] = useState<string>("main");

  // 分割レイアウト関数
  const generatePaneId = () =>
    `pane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const findPane = useCallback(
    (layout: SplitLayout, paneId: string): SplitLayout | null => {
      if (layout.type === "pane" && layout.pane?.id === paneId) {
        return layout;
      }
      if (layout.type === "split" && layout.children) {
        for (const child of layout.children) {
          const found = findPane(child, paneId);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const splitPane = useCallback((paneId: string, direction: SplitDirection) => {
    setSplitLayout((currentLayout) => {
      const splitPaneRecursive = (layout: SplitLayout): SplitLayout => {
        if (layout.type === "pane" && layout.pane?.id === paneId) {
          // 新しいペインを作成
          const newPaneId = generatePaneId();
          return {
            id: `split-${Date.now()}`,
            type: "split",
            direction,
            children: [
              layout,
              {
                id: newPaneId,
                type: "pane",
                pane: { id: newPaneId, fileIds: [], activeFileId: null },
              },
            ],
            sizes: [50, 50],
          };
        }
        if (layout.type === "split" && layout.children) {
          return {
            ...layout,
            children: layout.children.map(splitPaneRecursive),
          };
        }
        return layout;
      };

      return splitPaneRecursive(currentLayout);
    });
  }, []);

  const closePane = useCallback(
    (paneId: string) => {
      if (paneId === "main") return; // メインペインは閉じられない

      setSplitLayout((currentLayout) => {
        const closePaneRecursive = (
          layout: SplitLayout,
          parent?: SplitLayout
        ): SplitLayout | null => {
          if (layout.type === "split" && layout.children) {
            const newChildren = layout.children
              .map((child) => {
                if (child.type === "pane" && child.pane?.id === paneId) {
                  return null; // このペインを削除
                }
                return closePaneRecursive(child, layout) || child;
              })
              .filter(Boolean) as SplitLayout[];

            // 子が1つだけになった場合、その子を直接返す
            if (newChildren.length === 1) {
              return newChildren[0];
            }
            // 子がなくなった場合、null を返す
            if (newChildren.length === 0) {
              return null;
            }

            return { ...layout, children: newChildren };
          }
          return layout;
        };

        const result = closePaneRecursive(currentLayout);
        return (
          result || {
            id: "root",
            type: "pane",
            pane: { id: "main", fileIds: [], activeFileId: null },
          }
        );
      });

      // アクティブペインが閉じられた場合、メインペインをアクティブにする
      if (activePaneId === paneId) {
        setActivePaneId("main");
      }
    },
    [activePaneId]
  );

  const assignFileToPane = useCallback(
    (paneId: string, fileId: string | null) => {
      setSplitLayout((currentLayout) => {
        const assignFileRecursive = (layout: SplitLayout): SplitLayout => {
          if (layout.type === "pane" && layout.pane?.id === paneId) {
            const currentPane = layout.pane;
            if (fileId === null) {
              // ファイルをクリア
              return {
                ...layout,
                pane: { ...currentPane, fileIds: [], activeFileId: null },
              };
            } else {
              // ファイルを追加または既存の場合はアクティブにする
              const newFileIds = currentPane.fileIds.includes(fileId)
                ? currentPane.fileIds
                : [...currentPane.fileIds, fileId];
              return {
                ...layout,
                pane: {
                  ...currentPane,
                  fileIds: newFileIds,
                  activeFileId: fileId,
                },
              };
            }
          }
          if (layout.type === "split" && layout.children) {
            return {
              ...layout,
              children: layout.children.map(assignFileRecursive),
            };
          }
          return layout;
        };

        return assignFileRecursive(currentLayout);
      });
    },
    []
  );

  const removeFileFromPane = useCallback((paneId: string, fileId: string) => {
    setSplitLayout((currentLayout) => {
      const removeFileRecursive = (layout: SplitLayout): SplitLayout => {
        if (layout.type === "pane" && layout.pane?.id === paneId) {
          const currentPane = layout.pane;
          const newFileIds = currentPane.fileIds.filter((id) => id !== fileId);
          const newActiveFileId =
            currentPane.activeFileId === fileId
              ? newFileIds.length > 0
                ? newFileIds[newFileIds.length - 1]
                : null
              : currentPane.activeFileId;
          return {
            ...layout,
            pane: {
              ...currentPane,
              fileIds: newFileIds,
              activeFileId: newActiveFileId,
            },
          };
        }
        if (layout.type === "split" && layout.children) {
          return {
            ...layout,
            children: layout.children.map(removeFileRecursive),
          };
        }
        return layout;
      };

      return removeFileRecursive(currentLayout);
    });
  }, []);

  const setActiveFileInPane = useCallback((paneId: string, fileId: string) => {
    setSplitLayout((currentLayout) => {
      const setActiveFileRecursive = (layout: SplitLayout): SplitLayout => {
        if (layout.type === "pane" && layout.pane?.id === paneId) {
          const currentPane = layout.pane;
          if (currentPane.fileIds.includes(fileId)) {
            return {
              ...layout,
              pane: { ...currentPane, activeFileId: fileId },
            };
          }
        }
        if (layout.type === "split" && layout.children) {
          return {
            ...layout,
            children: layout.children.map(setActiveFileRecursive),
          };
        }
        return layout;
      };

      return setActiveFileRecursive(currentLayout);
    });
  }, []);

  const reorderTabsInPane = useCallback(
    (paneId: string, fromIndex: number, toIndex: number) => {
      setSplitLayout((currentLayout) => {
        const reorderTabsRecursive = (layout: SplitLayout): SplitLayout => {
          if (layout.type === "pane" && layout.pane?.id === paneId) {
            const currentPane = layout.pane;
            const newFileIds = [...currentPane.fileIds];

            // 配列要素を移動
            const [movedItem] = newFileIds.splice(fromIndex, 1);
            newFileIds.splice(toIndex, 0, movedItem);

            return {
              ...layout,
              pane: { ...currentPane, fileIds: newFileIds },
            };
          }
          if (layout.type === "split" && layout.children) {
            return {
              ...layout,
              children: layout.children.map(reorderTabsRecursive),
            };
          }
          return layout;
        };

        return reorderTabsRecursive(currentLayout);
      });
    },
    []
  );

  const moveTabBetweenPanes = useCallback(
    (
      sourcePane: string,
      targetPane: string,
      fileId: string,
      targetIndex?: number
    ) => {
      setSplitLayout((currentLayout) => {
        const moveTabRecursive = (layout: SplitLayout): SplitLayout => {
          if (layout.type === "pane" && layout.pane) {
            const currentPane = layout.pane;

            if (currentPane.id === sourcePane) {
              // ソースペインからファイルを削除
              const newFileIds = currentPane.fileIds.filter(
                (id) => id !== fileId
              );
              const newActiveFileId =
                currentPane.activeFileId === fileId
                  ? newFileIds.length > 0
                    ? newFileIds[newFileIds.length - 1]
                    : null
                  : currentPane.activeFileId;

              return {
                ...layout,
                pane: {
                  ...currentPane,
                  fileIds: newFileIds,
                  activeFileId: newActiveFileId,
                },
              };
            }

            if (currentPane.id === targetPane) {
              // ターゲットペインにファイルを追加
              const newFileIds = [...currentPane.fileIds];
              if (!newFileIds.includes(fileId)) {
                if (
                  targetIndex !== undefined &&
                  targetIndex >= 0 &&
                  targetIndex <= newFileIds.length
                ) {
                  newFileIds.splice(targetIndex, 0, fileId);
                } else {
                  newFileIds.push(fileId);
                }
              }

              return {
                ...layout,
                pane: {
                  ...currentPane,
                  fileIds: newFileIds,
                  activeFileId: fileId, // 移動したファイルをアクティブにする
                },
              };
            }
          }

          if (layout.type === "split" && layout.children) {
            return {
              ...layout,
              children: layout.children.map(moveTabRecursive),
            };
          }

          return layout;
        };

        return moveTabRecursive(currentLayout);
      });
    },
    []
  );

  const getAllPanesRecursive = useCallback(
    (layout: SplitLayout): EditorPane[] => {
      if (layout.type === "pane" && layout.pane) {
        return [layout.pane];
      }
      if (layout.type === "split" && layout.children) {
        return layout.children.flatMap(getAllPanesRecursive);
      }
      return [];
    },
    []
  );

  const getAllPanes = useCallback((): EditorPane[] => {
    return getAllPanesRecursive(splitLayout);
  }, [splitLayout, getAllPanesRecursive]);

  const updateSplitSizes = useCallback((splitId: string, sizes: number[]) => {
    setSplitLayout((currentLayout) => {
      const updateSizesRecursive = (layout: SplitLayout): SplitLayout => {
        if (layout.type === "split" && layout.id === splitId) {
          return { ...layout, sizes };
        }
        if (layout.type === "split" && layout.children) {
          return {
            ...layout,
            children: layout.children.map(updateSizesRecursive),
          };
        }
        return layout;
      };

      return updateSizesRecursive(currentLayout);
    });
  }, []);

  // VS Code風サイドバーリサイザー
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(600, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  // VS Code風統計パネルリサイザー
  const handleStatisticsResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsStatisticsResizing(true);

      // 初期マウス位置を記録
      const startY = e.clientY;
      const startHeight = statisticsHeight;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // マウスの移動距離を計算
        const deltaY = startY - moveEvent.clientY;
        const newHeight = Math.max(180, Math.min(800, startHeight + deltaY));
        setStatisticsHeight(newHeight);
      };

      const handleMouseUp = () => {
        setIsStatisticsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [statisticsHeight]
  );

  return {
    // State
    sidebarWidth,
    isResizing,
    sidebarCollapsed,
    setSidebarCollapsed,
    statisticsHeight,
    isStatisticsResizing,
    resizeRef,
    statisticsResizeRef,

    // Split Layout
    splitLayout,
    activePaneId,
    setActivePaneId,

    // Handlers
    handleResizeStart,
    handleStatisticsResizeStart,

    // Split Layout Functions
    splitPane,
    closePane,
    assignFileToPane,
    removeFileFromPane,
    setActiveFileInPane,
    reorderTabsInPane,
    moveTabBetweenPanes,
    getAllPanes,
    updateSplitSizes,
    findPane,
  };
}
