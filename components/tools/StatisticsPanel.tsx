import React, { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { Editor } from "@tiptap/react";
import {
  calculateTextStats,
  calculateLanguageStats,
  calculateAdvancedStats,
  type TextStats,
  type LanguageStats,
  type AdvancedStats,
} from "@/utils/statsUtils";

interface StatisticsPanelProps {
  editor: Editor | null;
  targetLength: number;
  showAdvancedStats: boolean;
  onToggleAdvancedStats: () => void;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  editor,
  targetLength,
  showAdvancedStats,
  onToggleAdvancedStats,
}) => {
  const [cachedStats, setCachedStats] = useState<TextStats>({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    bytes: 0,
    readingTime: 0,
    syllables: 0,
    readabilityScore: 0,
  });

  const [cachedLanguageStats, setCachedLanguageStats] = useState<LanguageStats>(
    {
      hiragana: 0,
      katakana: 0,
      kanji: 0,
      ascii: 0,
      punctuation: 0,
      whitespace: 0,
    }
  );

  const [cachedAdvancedStats, setCachedAdvancedStats] = useState<AdvancedStats>(
    {
      averageWordsPerSentence: 0,
      averageSentencesPerParagraph: 0,
      longestWord: "",
      mostFrequentWords: [],
      wordLengthDistribution: [],
      sentenceLengthDistribution: [],
      complexityScore: 0,
    }
  );

  const statsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 統計計算の更新
  const updateStats = useCallback(() => {
    if (!editor) return;

    const text = editor.getText();
    const newStats = calculateTextStats(text);
    const newLanguageStats = calculateLanguageStats(text);
    const newAdvancedStats = calculateAdvancedStats(text);

    setCachedStats(newStats);
    setCachedLanguageStats(newLanguageStats);
    setCachedAdvancedStats(newAdvancedStats);
  }, [editor]);

  // エディター内容変更時の統計更新（遅延実行）
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (statsTimeoutRef.current) {
        clearTimeout(statsTimeoutRef.current);
      }
      statsTimeoutRef.current = setTimeout(updateStats, 150);
    };

    editor.on("update", handleUpdate);

    // 初期計算
    updateStats();

    return () => {
      editor.off("update", handleUpdate);
      if (statsTimeoutRef.current) {
        clearTimeout(statsTimeoutRef.current);
      }
    };
  }, [editor, updateStats]);

  const stats = cachedStats;
  const languageStats = cachedLanguageStats;
  const advancedStats = cachedAdvancedStats;
  const targetProgress =
    targetLength > 0 ? (stats.characters / targetLength) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* 基本統計 */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded text-center">
          <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
            {stats.characters.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Characters
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-1.5 rounded text-center">
          <div className="text-sm font-bold text-green-700 dark:text-green-300">
            {stats.words.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            Words
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-1.5 rounded text-center">
          <div className="text-sm font-bold text-purple-700 dark:text-purple-300">
            {stats.paragraphs}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            Paragraphs
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-1.5 rounded text-center">
          <div className="text-sm font-bold text-orange-700 dark:text-orange-300">
            {stats.readingTime}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            Min Read
          </div>
        </div>
      </div>

      {/* 目標設定 */}
      {targetLength > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Progress</span>
            <Badge
              variant={targetProgress >= 100 ? "default" : "secondary"}
              className="text-xs"
            >
              {Math.round(targetProgress)}%
            </Badge>
          </div>
          <Progress value={targetProgress} className="h-1.5" />
          <div className="text-xs text-muted-foreground mt-1">
            {stats.characters}/{targetLength}
          </div>
        </div>
      )}

      {/* 詳細統計ボタン */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleAdvancedStats}
        className="w-full h-6 text-xs"
      >
        <TrendingUp className="w-3 h-3 mr-1" />
        {showAdvancedStats ? "Hide" : "Show"} Advanced Stats
      </Button>

      {/* 詳細統計パネル */}
      {showAdvancedStats && (
        <div className="space-y-2">
          {/* 基本詳細統計 */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
            <h4 className="text-xs font-medium mb-2">Detailed Analysis</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Sentences:</span>
                <span className="font-medium">{stats.sentences}</span>
              </div>
              <div className="flex justify-between">
                <span>Lines:</span>
                <span className="font-medium">{stats.lines}</span>
              </div>
              <div className="flex justify-between">
                <span>Bytes:</span>
                <span className="font-medium">
                  {stats.bytes.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Syllables:</span>
                <span className="font-medium">{stats.syllables}</span>
              </div>
              <div className="flex justify-between">
                <span>Readability:</span>
                <span className="font-medium">{stats.readabilityScore}</span>
              </div>
              <div className="flex justify-between">
                <span>No Spaces:</span>
                <span className="font-medium">{stats.charactersNoSpaces}</span>
              </div>
            </div>
          </div>

          {/* 言語別統計 */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
            <h4 className="text-xs font-medium mb-2">Language Distribution</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex justify-between">
                <span>ひらがな:</span>
                <span className="font-medium">{languageStats.hiragana}</span>
              </div>
              <div className="flex justify-between">
                <span>カタカナ:</span>
                <span className="font-medium">{languageStats.katakana}</span>
              </div>
              <div className="flex justify-between">
                <span>漢字:</span>
                <span className="font-medium">{languageStats.kanji}</span>
              </div>
              <div className="flex justify-between">
                <span>ASCII:</span>
                <span className="font-medium">{languageStats.ascii}</span>
              </div>
              <div className="flex justify-between">
                <span>Punct:</span>
                <span className="font-medium">{languageStats.punctuation}</span>
              </div>
              <div className="flex justify-between">
                <span>Space:</span>
                <span className="font-medium">{languageStats.whitespace}</span>
              </div>
            </div>
          </div>

          {/* 高度な統計 */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
            <h4 className="text-xs font-medium mb-2">Advanced Metrics</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Avg Words/Sentence:</span>
                <span className="font-medium">
                  {advancedStats.averageWordsPerSentence.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Sentences/Para:</span>
                <span className="font-medium">
                  {advancedStats.averageSentencesPerParagraph.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Complexity Score:</span>
                <span className="font-medium">
                  {advancedStats.complexityScore.toFixed(1)}
                </span>
              </div>
              {advancedStats.longestWord && (
                <div className="flex justify-between">
                  <span>Longest Word:</span>
                  <span
                    className="font-medium truncate max-w-20"
                    title={advancedStats.longestWord}
                  >
                    {advancedStats.longestWord}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 頻出単語 */}
          {advancedStats.mostFrequentWords.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
              <h4 className="text-xs font-medium mb-2">Top Words</h4>
              <div className="space-y-1">
                {advancedStats.mostFrequentWords
                  .slice(0, 5)
                  .map((item, index) => (
                    <div
                      key={item.word}
                      className="flex justify-between text-xs"
                    >
                      <span className="truncate max-w-16" title={item.word}>
                        {index + 1}. {item.word}
                      </span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
