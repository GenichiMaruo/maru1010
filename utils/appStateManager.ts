// CharCountPro用の状態管理ユーティリティ

// ファイルタブの情報
export interface SavedFileTab {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
  lastSaved: string; // Date.toISOString()
}

// 分割レイアウトの情報
export interface SavedSplitLayout {
  id: string;
  type: "pane" | "split";
  direction?: "horizontal" | "vertical";
  pane?: {
    id: string;
    fileIds: string[];
    activeFileId: string | null;
  };
  children?: SavedSplitLayout[];
  sizes?: number[];
}

export interface AppState {
  // パネル状態
  sidebarWidth: number;
  statisticsHeight: number;
  sidebarCollapsed: boolean;

  // 表示設定
  showNewlineMarkers: boolean;
  showFullWidthSpaces: boolean;
  targetLength: number;
  showAdvancedStats: boolean;
  isPreviewVisible: boolean;

  // レイアウト設定
  splitLayout: SavedSplitLayout;
  activePaneId: string;

  // ファイル管理
  activeFileId: string | null;
  fileTabs: SavedFileTab[];
  fileTabsOrder: string[];

  // 最後の保存時刻
  lastSaved: number;

  // バージョン管理
  version?: string;
}

const STORAGE_KEY = "charCountPro_appState";
const STORAGE_VERSION = "1.0";

export function saveAppState(state: Partial<AppState>): void {
  try {
    const stateWithMeta = {
      ...state,
      version: STORAGE_VERSION,
      lastSaved: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithMeta));
  } catch (error) {
    console.warn("Failed to save app state:", error);
  }
}

export function loadAppState(): Partial<AppState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // バージョンチェック
    if (parsed.version !== STORAGE_VERSION) {
      console.warn("App state version mismatch, clearing state");
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // 24時間以上古い状態は破棄
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - parsed.lastSaved > maxAge) {
      console.warn("App state too old, clearing state");
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to load app state:", error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearAppState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear app state:", error);
  }
}

// デバウンス関数
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
