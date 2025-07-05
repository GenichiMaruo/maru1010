import runes from "runes2";

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  bytes: number;
  readingTime: number;
  syllables: number;
  readabilityScore: number;
}

export interface LanguageStats {
  hiragana: number;
  katakana: number;
  kanji: number;
  ascii: number;
  punctuation: number;
  whitespace: number;
}

export interface AdvancedStats {
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
  longestWord: string;
  mostFrequentWords: Array<{ word: string; count: number }>;
  wordLengthDistribution: Array<{ length: number; count: number }>;
  sentenceLengthDistribution: Array<{ length: number; count: number }>;
  complexityScore: number;
}

// 音節数推定
export const estimateSyllables = (text: string): number => {
  // 日本語の場合はひらがな・カタカナの数
  const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || [])
    .length;

  // 英語の場合は単語から推定
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  const englishSyllables = englishWords.reduce((count, word) => {
    return (
      count + Math.max(1, word.toLowerCase().match(/[aeiouy]+/g)?.length || 1)
    );
  }, 0);

  return japaneseChars + englishSyllables;
};

// 読みやすさスコア計算
export const calculateReadabilityScore = (
  text: string,
  sentences: number,
  words: number,
  syllables: number
): number => {
  if (sentences === 0 || words === 0) return 0;

  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  // Flesch Reading Ease の簡易版
  const score =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  return Math.max(0, Math.min(100, Math.round(score)));
};

// 基本統計計算
export const calculateTextStats = (text: string): TextStats => {
  // 基本統計
  const characters = runes(text).length;
  const charactersNoSpaces = runes(text.replace(/\s/g, "")).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.split(/[.!?。！？]/).filter((s) => s.trim()).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length || 1;
  const lines = text.split(/\n/).length;
  const bytes = new TextEncoder().encode(text).length;

  // 読書時間（日本語: 600文字/分、英語: 250語/分）
  const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
  const readingTime = isJapanese
    ? Math.ceil(characters / 600)
    : Math.ceil(words / 250);

  // 音節数の推定
  const syllables = estimateSyllables(text);

  // 読みやすさスコア
  const readabilityScore = calculateReadabilityScore(
    text,
    sentences,
    words,
    syllables
  );

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    bytes,
    readingTime,
    syllables,
    readabilityScore,
  };
};

// 言語別統計計算
export const calculateLanguageStats = (text: string): LanguageStats => {
  return {
    hiragana: (text.match(/[\u3040-\u309F]/g) || []).length,
    katakana: (text.match(/[\u30A0-\u30FF]/g) || []).length,
    kanji: (text.match(/[\u4E00-\u9FAF]/g) || []).length,
    ascii: (text.match(/[a-zA-Z0-9]/g) || []).length,
    punctuation: (text.match(/[.,!?;:。、！？；：]/g) || []).length,
    whitespace: (text.match(/\s/g) || []).length,
  };
};

// 詳細統計計算
export const calculateAdvancedStats = (text: string): AdvancedStats => {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const sentences = text.split(/[.!?。！？]/).filter((s) => s.trim()).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length || 1;

  // 平均値計算
  const averageWordsPerSentence = sentences > 0 ? words.length / sentences : 0;
  const averageSentencesPerParagraph =
    paragraphs > 0 ? sentences / paragraphs : 0;

  // 最長単語
  const longestWord = words.reduce(
    (longest, word) => (word.length > longest.length ? word : longest),
    ""
  );

  // 単語頻度分析
  const wordFreq = new Map<string, number>();
  words.forEach((word) => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");
    if (cleanWord.length > 2) {
      // 3文字以上の単語のみ
      wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1);
    }
  });

  const mostFrequentWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // 単語長分布
  const wordLengthMap = new Map<number, number>();
  words.forEach((word) => {
    const length = runes(word).length;
    wordLengthMap.set(length, (wordLengthMap.get(length) || 0) + 1);
  });

  const wordLengthDistribution = Array.from(wordLengthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([length, count]) => ({ length, count }));

  // 文長分布
  const sentenceLengthMap = new Map<number, number>();
  text.split(/[.!?。！？]/).forEach((sentence) => {
    const length = sentence.trim().split(/\s+/).length;
    if (length > 0) {
      sentenceLengthMap.set(length, (sentenceLengthMap.get(length) || 0) + 1);
    }
  });

  const sentenceLengthDistribution = Array.from(sentenceLengthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([length, count]) => ({ length, count }));

  // 複雑度スコア（単語の多様性、文の長さの変動など）
  const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;
  const lexicalDiversity = words.length > 0 ? uniqueWords / words.length : 0;
  const complexityScore = Math.round(lexicalDiversity * 100);

  return {
    averageWordsPerSentence,
    averageSentencesPerParagraph,
    longestWord,
    mostFrequentWords,
    wordLengthDistribution,
    sentenceLengthDistribution,
    complexityScore,
  };
};
