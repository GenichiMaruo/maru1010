import { useState, useCallback, useRef } from "react";

export function useEditorLayout() {
  // VS Code風レイアウト管理
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statisticsHeight, setStatisticsHeight] = useState(300);
  const [isStatisticsResizing, setIsStatisticsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const statisticsResizeRef = useRef<HTMLDivElement>(null);

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

    // Handlers
    handleResizeStart,
    handleStatisticsResizeStart,
  };
}
