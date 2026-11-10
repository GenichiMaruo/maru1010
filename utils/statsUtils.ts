import runes from "runes2";

export interface TextStats {
  /** 文字数（改行を除く。絵文字や結合文字も見た目の 1 文字と数える） */
  chars: number;
  /** 空白・改行を除いた文字数 */
  charsNoSpaces: number;
  /** 空白で区切った単語数（英文向け） */
  words: number;
  /** 空でない行の数 */
  lines: number;
  /** 文の数（。．.!?！？ で区切る） */
  sentences: number;
  /** UTF-8 でのバイト数 */
  bytes: number;
  /** 400 字詰め原稿用紙の枚数（文字数からの目安） */
  manuscriptPages: number;
  /** 読むのにかかる時間（分）。日本語は 500 字/分、英文は 200 語/分で概算 */
  readingMinutes: number;
}

export interface CharKinds {
  hiragana: number;
  katakana: number;
  kanji: number;
  alnum: number;
  other: number;
}

const JAPANESE = /[぀-ヿ㐀-鿿]/;

/** text は「段落の区切り = 改行 1 つ」のプレーンテキスト */
export function analyzeText(text: string): TextStats {
  const body = text.replace(/\n/g, "");
  const chars = runes(body).length;
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  return {
    chars,
    charsNoSpaces: runes(body.replace(/[\s　]/g, "")).length,
    words,
    lines: text.split("\n").filter((line) => line.trim()).length,
    sentences: text.split(/[。．.!?！？\n]+/).filter((s) => s.trim()).length,
    bytes: new TextEncoder().encode(text).length,
    manuscriptPages: Math.ceil(chars / 400),
    readingMinutes: chars === 0 ? 0 : Math.max(1, Math.round(JAPANESE.test(text) ? chars / 500 : words / 200)),
  };
}

/** 文字種ごとの数（空白・改行は数えない） */
export function countCharKinds(text: string): CharKinds {
  const kinds: CharKinds = { hiragana: 0, katakana: 0, kanji: 0, alnum: 0, other: 0 };
  for (const ch of text) {
    if (/\s/.test(ch)) continue;
    if (/[ぁ-ゟ]/.test(ch)) kinds.hiragana++;
    else if (/[゠-ヿｦ-ﾟ]/.test(ch)) kinds.katakana++;
    else if (/[㐀-鿿豈-﫿々〆]/.test(ch)) kinds.kanji++;
    else if (/[A-Za-z0-9Ａ-Ｚａ-ｚ０-９]/.test(ch)) kinds.alnum++;
    else kinds.other++;
  }
  return kinds;
}
