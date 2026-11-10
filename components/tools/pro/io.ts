import type { JSONContent } from "@tiptap/core";
import { marked } from "marked";

// ---- 読み込み ----

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** プレーンテキスト → 1 行 1 段落の HTML（以前はそのまま HTML として読んでいたため、改行が消えていた） */
export const textToHtml = (text: string) =>
  text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

export interface ImportedFile {
  name: string;
  content: string;
}

/** ファイルを読み込んで、新しい文書として返す（開いている文書は上書きしない） */
export async function readImportFile(file: File): Promise<ImportedFile[]> {
  const text = await file.text();
  const base = file.name.replace(/\.[^/.]+$/, "") || "無題";
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "json") {
    try {
      const data = JSON.parse(text);
      // このツールのバックアップ（複数の文書）
      if (Array.isArray(data?.files)) {
        return data.files
          .filter((f: unknown): f is ImportedFile => typeof (f as ImportedFile)?.content === "string")
          .map((f: ImportedFile) => ({ name: f.name || base, content: f.content }));
      }
      // 旧バージョンの 1 文書の書き出し
      if (typeof data?.content === "string") return [{ name: data.name || base, content: data.content }];
    } catch {}
    return [{ name: base, content: textToHtml(text) }];
  }
  if (ext === "md" || ext === "markdown") {
    return [{ name: base, content: await marked.parse(text, { gfm: true, breaks: true }) }];
  }
  if (ext === "html" || ext === "htm") {
    const doc = new DOMParser().parseFromString(text, "text/html");
    doc.querySelectorAll("script, style").forEach((el) => el.remove());
    return [{ name: base, content: doc.body.innerHTML }];
  }
  return [{ name: base, content: textToHtml(text) }];
}

export const IMPORT_ACCEPT = ".txt,.md,.markdown,.html,.htm,.json,text/plain,text/markdown,text/html,application/json";

// ---- 書き出し ----

export function download(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/[\\/:*?"<>|]/g, "_");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const wrapHtml = (title: string, body: string) =>
  `<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<title>${escapeHtml(title)}</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;

// ---- Markdown への変換（Tiptap の JSON から） ----

function inline(nodes: JSONContent[] | undefined): string {
  return (nodes ?? [])
    .map((node) => {
      if (node.type === "hardBreak") return "  \n";
      if (node.type === "inlineMath") return `$${node.attrs?.latex ?? ""}$`;
      if (node.type === "image") return `![${node.attrs?.alt ?? ""}](${node.attrs?.src ?? ""})`;
      if (node.type !== "text") return inline(node.content);
      let text = node.text ?? "";
      const marks = node.marks ?? [];
      const has = (type: string) => marks.some((m) => m.type === type);
      if (has("code")) return `\`${text}\``;
      // 記号をそのまま出すと書式として解釈されるものだけエスケープする
      text = text.replace(/([\\`*_[\]])/g, "\\$1");
      // 前後の空白は記号の外に出す（"** 太字**" のような形は Markdown として無効なため）
      const [, lead, body, trail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? ["", "", text, ""];
      if (!body) return text;
      let out = body;
      if (has("bold")) out = `**${out}**`;
      if (has("italic")) out = `*${out}*`;
      if (has("strike")) out = `~~${out}~~`;
      if (has("underline")) out = `<u>${out}</u>`;
      const link = marks.find((m) => m.type === "link");
      if (link) out = `[${out}](${link.attrs?.href ?? ""})`;
      return lead + out + trail;
    })
    .join("");
}

const indent = (text: string, prefix: string) =>
  text
    .split("\n")
    .map((line) => (line ? prefix + line : line))
    .join("\n");

function list(node: JSONContent, marker: (index: number, item: JSONContent) => string): string {
  return (node.content ?? [])
    .map((item, i) => {
      const m = marker(i, item);
      const body = blocks(item.content).trim();
      const [first, ...rest] = body.split("\n");
      return [m + first, ...rest.map((line) => (line ? " ".repeat(m.length) + line : line))].join("\n");
    })
    .join("\n");
}

function table(node: JSONContent): string {
  const rows = (node.content ?? []).map((row) =>
    (row.content ?? []).map((cell) => blocks(cell.content).trim().replace(/\n+/g, "<br>").replace(/\|/g, "\\|"))
  );
  if (rows.length === 0) return "";
  const cols = Math.max(...rows.map((r) => r.length));
  const line = (cells: string[]) => `| ${Array.from({ length: cols }, (_, i) => cells[i] ?? "").join(" | ")} |`;
  return [line(rows[0]), line(Array(cols).fill("---")), ...rows.slice(1).map(line)].join("\n");
}

function block(node: JSONContent): string {
  switch (node.type) {
    case "paragraph":
      return inline(node.content);
    case "heading":
      return `${"#".repeat(node.attrs?.level ?? 1)} ${inline(node.content)}`;
    case "bulletList":
      return list(node, () => "- ");
    case "orderedList":
      return list(node, (i) => `${(node.attrs?.start ?? 1) + i}. `);
    case "taskList":
      return list(node, (_, item) => `- [${item.attrs?.checked ? "x" : " "}] `);
    case "blockquote":
      return indent(blocks(node.content), "> ").replace(/\n\n/g, "\n>\n");
    case "codeBlock": {
      const lang = node.attrs?.language && node.attrs.language !== "plaintext" ? node.attrs.language : "";
      return `\`\`\`${lang}\n${(node.content ?? []).map((n) => n.text ?? "").join("")}\n\`\`\``;
    }
    case "horizontalRule":
      return "---";
    case "table":
      return table(node);
    case "image":
      return `![${node.attrs?.alt ?? ""}](${node.attrs?.src ?? ""})`;
    case "blockMath":
      return `$$\n${node.attrs?.latex ?? ""}\n$$`;
    default:
      return node.content ? blocks(node.content) : "";
  }
}

function blocks(nodes: JSONContent[] | undefined): string {
  return (nodes ?? []).map(block).join("\n\n");
}

export const toMarkdown = (doc: JSONContent) => blocks(doc.content).replace(/\n{3,}/g, "\n\n").trim() + "\n";
