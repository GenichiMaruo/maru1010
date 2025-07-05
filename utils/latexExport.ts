// LaTeX変換ユーティリティ

export interface LaTeXExportOptions {
  engine: "pdflatex" | "lualatex" | "xelatex";
  documentClass:
    | "article"
    | "report"
    | "book"
    | "jlreq"
    | "ltjsarticle"
    | "ltjsreport"
    | "ltjsbook";
  fontSize: "10pt" | "11pt" | "12pt" | "14pt";
  paperSize: "a4paper" | "letterpaper" | "a5paper" | "b5paper";
  margin: "narrow" | "normal" | "wide" | "custom";
  customMargin?: string;
  includeTitle: boolean;
  title?: string;
  author?: string;
  date?: string;
  includeToc: boolean;
  mathPackage: "amsmath" | "mathtools" | "none";
  encoding: "utf8" | "utf8x";
  language: "japanese" | "english" | "both";
  bibliography: boolean;
  hyperref: boolean;
  colorlinks: boolean;
}

// HTMLからプレーンテキストに変換（将来の拡張用）
export function htmlToPlainText(html: string): string {
  if (!html) return "";

  return html
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/div>/g, "\n")
    .replace(/<\/li>/g, "\n")
    .replace(/<h[1-6][^>]*>/g, "\n")
    .replace(/<\/h[1-6]>/g, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

// HTMLからLaTeX形式に変換
function htmlToLaTeX(html: string): string {
  if (!html) return "";

  let latex = html;

  // 基本的なHTMLタグをLaTeXに変換

  // 見出し
  latex = latex.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\\section{$1}\n");
  latex = latex.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\\subsection{$1}\n");
  latex = latex.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\\subsubsection{$1}\n");
  latex = latex.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\\paragraph{$1}\n");
  latex = latex.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "\\subparagraph{$1}\n");
  latex = latex.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "\\subparagraph{$1}\n");

  // 強調
  latex = latex.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "\\textbf{$1}");
  latex = latex.replace(/<b[^>]*>(.*?)<\/b>/gi, "\\textbf{$1}");
  latex = latex.replace(/<em[^>]*>(.*?)<\/em>/gi, "\\textit{$1}");
  latex = latex.replace(/<i[^>]*>(.*?)<\/i>/gi, "\\textit{$1}");
  latex = latex.replace(/<u[^>]*>(.*?)<\/u>/gi, "\\underline{$1}");

  // コード
  latex = latex.replace(/<code[^>]*>(.*?)<\/code>/gi, "\\texttt{$1}");
  latex = latex.replace(
    /<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi,
    (match, p1) => `\\begin{verbatim}\n${p1}\n\\end{verbatim}\n`
  );
  latex = latex.replace(
    /<pre[^>]*>(.*?)<\/pre>/gi,
    (match, p1) => `\\begin{verbatim}\n${p1}\n\\end{verbatim}\n`
  );

  // 引用
  latex = latex.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gi,
    (match, p1) => `\\begin{quote}\n${p1}\n\\end{quote}\n`
  );

  // リスト
  latex = latex.replace(
    /<ul[^>]*>(.*?)<\/ul>/gi,
    (match, p1) => `\\begin{itemize}\n${p1}\\end{itemize}\n`
  );
  latex = latex.replace(
    /<ol[^>]*>(.*?)<\/ol>/gi,
    (match, p1) => `\\begin{enumerate}\n${p1}\\end{enumerate}\n`
  );
  latex = latex.replace(/<li[^>]*>(.*?)<\/li>/gi, "\\item $1\n");

  // 数式（KaTeXからLaTeXへ）
  latex = latex.replace(
    /\$\$(.*?)\$\$/g,
    "\\begin{equation}\n$1\n\\end{equation}\n"
  );
  latex = latex.replace(/\$(.*?)\$/g, "$$$1$$");

  // 段落
  latex = latex.replace(/<p[^>]*>(.*?)<\/p>/gi, (match, p1) => `${p1}\n\n`);

  // 改行
  latex = latex.replace(/<br\s*\/?>/gi, "\\\\\n");

  // リンク
  latex = latex.replace(
    /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
    "\\href{$1}{$2}"
  );

  // HTMLタグを除去
  latex = latex.replace(/<[^>]*>/g, "");

  // HTML実体参照を変換
  latex = latex.replace(/&nbsp;/g, "~");
  latex = latex.replace(/&lt;/g, "<");
  latex = latex.replace(/&gt;/g, ">");
  latex = latex.replace(/&amp;/g, "\\&");
  latex = latex.replace(/&quot;/g, '"');

  // LaTeX特殊文字をエスケープ
  latex = latex.replace(/([#$%&_{}])/g, "\\$1");
  latex = latex.replace(/\^/g, "\\textasciicircum{}");
  latex = latex.replace(/~/g, "\\textasciitilde{}");
  latex = latex.replace(/\\/g, "\\textbackslash{}");

  // 複数の空行を整理
  latex = latex.replace(/\n\s*\n\s*\n/g, "\n\n");

  return latex.trim();
}

// 余白設定を生成
function generateMarginSettings(margin: string, customMargin?: string): string {
  switch (margin) {
    case "narrow":
      return "\\usepackage[margin=1cm]{geometry}";
    case "wide":
      return "\\usepackage[margin=3cm]{geometry}";
    case "custom":
      return customMargin
        ? `\\usepackage[margin=${customMargin}]{geometry}`
        : "\\usepackage[margin=2.5cm]{geometry}";
    default:
      return "\\usepackage[margin=2.5cm]{geometry}";
  }
}

// LaTeX文書を生成
export function generateLaTeXDocument(
  content: string,
  options: LaTeXExportOptions
): string {
  const isJapanese =
    options.language === "japanese" || options.language === "both";
  const documentClassOptions: string[] = [options.fontSize, options.paperSize];

  if (options.documentClass === "jlreq") {
    documentClassOptions.push("paper=a4");
  }

  let latex = "";

  // Document class
  latex += `\\documentclass[${documentClassOptions.join(",")}]{${
    options.documentClass
  }}\n\n`;

  // パッケージ
  if (
    isJapanese &&
    (options.engine === "lualatex" || options.engine === "xelatex")
  ) {
    if (options.documentClass === "jlreq") {
      latex += "% jlreqクラス使用時は日本語サポートが自動的に含まれます\n";
    } else {
      latex += "\\usepackage{luatexja}\n";
      latex += "\\usepackage{luatexja-fontspec}\n";
    }
  } else if (isJapanese) {
    latex += "\\usepackage[utf8]{inputenc}\n";
    latex += "\\usepackage[T1]{fontenc}\n";
    latex += "\\usepackage{lmodern}\n";
  }

  // エンコーディング（pdfLaTeX用）
  if (options.engine === "pdflatex") {
    latex += `\\usepackage[${options.encoding}]{inputenc}\n`;
    latex += "\\usepackage[T1]{fontenc}\n";
  }

  // 言語設定
  if (options.language === "japanese") {
    latex += "\\usepackage[japanese]{babel}\n";
  } else if (options.language === "both") {
    latex += "\\usepackage[english,japanese]{babel}\n";
  } else {
    latex += "\\usepackage[english]{babel}\n";
  }

  // 余白設定
  latex += generateMarginSettings(options.margin, options.customMargin) + "\n";

  // 数学パッケージ
  if (options.mathPackage !== "none") {
    latex += `\\usepackage{${options.mathPackage}}\n`;
    if (options.mathPackage === "amsmath") {
      latex += "\\usepackage{amssymb}\n";
      latex += "\\usepackage{amsthm}\n";
    }
  }

  // Hyperref
  if (options.hyperref) {
    if (options.colorlinks) {
      latex +=
        "\\usepackage[colorlinks=true,linkcolor=blue,urlcolor=blue,citecolor=blue]{hyperref}\n";
    } else {
      latex += "\\usepackage{hyperref}\n";
    }
  }

  // その他の有用なパッケージ
  latex += "\\usepackage{graphicx}\n";
  latex += "\\usepackage{url}\n";
  latex += "\\usepackage{listings}\n";
  latex += "\\usepackage{xcolor}\n";

  // Bibliography
  if (options.bibliography) {
    latex += "\\usepackage{natbib}\n";
  }

  latex += "\n";

  // タイトル情報
  if (options.includeTitle) {
    if (options.title) {
      latex += `\\title{${options.title}}\n`;
    }
    if (options.author) {
      latex += `\\author{${options.author}}\n`;
    }
    if (options.date) {
      latex += `\\date{${options.date}}\n`;
    }
    latex += "\n";
  }

  // 文書開始
  latex += "\\begin{document}\n\n";

  // タイトルページ
  if (options.includeTitle) {
    latex += "\\maketitle\n\n";
  }

  // 目次
  if (options.includeToc) {
    latex += "\\tableofcontents\n";
    latex += "\\newpage\n\n";
  }

  // 本文
  latex += htmlToLaTeX(content);

  // Bibliography
  if (options.bibliography) {
    latex += "\n\n\\bibliographystyle{plain}\n";
    latex += "\\bibliography{references}\n";
  }

  // 文書終了
  latex += "\n\\end{document}\n";

  return latex;
}

// ファイルダウンロード
export function downloadLaTeXFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".tex") ? filename : `${filename}.tex`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
