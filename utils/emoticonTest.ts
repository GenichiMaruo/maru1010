// 顔文字テスト用の一時的なユーティリティファイル
export const testEmoticons = [
  // ASCII系顔文字
  ":)",
  ":(",
  ":D",
  ";)",
  ":P",
  ":|",
  ":/",
  ":\\",
  ">:(",
  ":o",
  ":-)",
  ":-(",
  ":-D",
  ";-)",
  ":-P",
  ":-|",
  ":-/",
  ":-\\",
  ">:-(",
  ":-o",

  // 日本語系顔文字
  "(^^)",
  "(^_^)",
  "(>_<)",
  "(T_T)",
  "(-_-)",
  "(=_=)",
  "(^o^)",
  "(>.<)",
  "(¬_¬)",
  "(°_°)",
  "(｡◕‿◕｡)",
  "ヽ(°〇°)ﾉ",
  "(╯°□°）╯",
  "¯\\_(ツ)_/¯",
  "(ಠ_ಠ)",

  // Unicode絵文字
  "😊",
  "😂",
  "😭",
  "🤔",
  "👍",
  "❤️",
  "🎉",
  "🔥",
  "💯",
  "🚀",
];

export const testInput = (text: string): boolean => {
  // 入力可能性をテストする関数
  try {
    // 基本的なUnicodeチェック
    const encoded = encodeURIComponent(text);
    const decoded = decodeURIComponent(encoded);
    return decoded === text;
  } catch (error) {
    console.error("Input test failed for:", text, error);
    return false;
  }
};
