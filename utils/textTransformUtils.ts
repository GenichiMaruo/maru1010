// テキスト変換とフォーマット用ユーティリティ

// Type definitions
export type CaseConversionType =
  | "camelCase"
  | "PascalCase"
  | "snake_case"
  | "kebab-case";
export type CommentLanguage =
  | "generic_block_line"
  | "hash_comments"
  | "html_comments";

export const toWords = (str: string): string[] => {
  if (!str) return [];
  str = str.replace(/([a-z])([A-Z])/g, "$1 $2");
  str = str.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
  str = str.replace(/[\s_-]+/g, " ");
  str = str.trim();
  if (!str) return [];
  return str.split(" ").map((word) => word.toLowerCase());
};

export const toCamelCase = (words: string[]): string =>
  words
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");

export const toPascalCase = (words: string[]): string =>
  words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");

export const toSnakeCase = (words: string[]): string => words.join("_");

export const toKebabCase = (words: string[]): string => words.join("-");

// 句読点変換
// 「、」「。」の後ろには半角スペースを入れる。ただし行末・既存の空白の前には入れない
export const jpToEnPunctuation = (text: string): string =>
  text
    .replace(/、(?=\s|$)/g, ",")
    .replace(/、/g, ", ")
    .replace(/。(?=\s|$)/g, ".")
    .replace(/。/g, ". ");

// 句読点としての「,」「.」だけを変換する。
// 3.14 / 1,000 / example.com のように前後が文字で挟まれているものは変えない。
// 句読点の直後の半角スペースは日本語では不要なので取り除く
export const enToJpPunctuation = (text: string): string =>
  text
    .replace(/,(?=[ \t]|$|\n|[^\d\w])[ \t]?/g, "、")
    .replace(/\.(?=[ \t]|$|\n)[ \t]?/g, "。");

// コメント削除
export const removeComments = (text: string, language: string): string => {
  switch (language) {
    case "generic_block_line":
      // 「https://」のように「:」の直後の「//」は URL なのでコメント扱いしない
      return text.replace(/\/\*[\s\S]*?\*\/|(?<!:)\/\/.*/g, "");
    case "hash_comments":
      // 行頭か空白の直後の「#」だけをコメントとみなす（#fff や URL の # は残す）
      return text.replace(/(^|[ \t])#.*/gm, "$1");
    case "html_comments":
      return text.replace(/<!--[\s\S]*?-->/g, "");
    default:
      return text;
  }
};

// 改行・空白処理
export const removeNewlinesFromText = (text: string): string =>
  text.replace(/(\r?\n|\u2028|\u2029)/g, " ");

export const removeWhitespace = (
  text: string,
  normalize: boolean = false
): string => {
  if (normalize) {
    // 空白を1つにまとめてtrim
    return text.replace(/[ \t\u3000]+/g, " ").trim();
  } else {
    // 空白をすべて削除
    return text.replace(/[ \t\u3000]/g, "");
  }
};

// 空白文字の正規化（様々な空白を半角スペース1つにまとめる）
export const normalizeWhitespace = (text: string): string => {
  // 様々な空白文字を正規化
  // \s: 標準空白文字（スペース、タブ、改行など）
  // \u3000: 全角スペース
  // \u00A0: ノーブレークスペース
  // \u2000-\u200F: 各種Unicode空白文字
  // \u2028-\u2029: ライン/パラグラフセパレータ
  return text
    .replace(/[\s\u3000\u00A0\u2000-\u200F\u2028-\u2029]+/g, " ")
    .trim();
};
