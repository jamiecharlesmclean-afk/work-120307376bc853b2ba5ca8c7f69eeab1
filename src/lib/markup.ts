// Light markup for library notes. The editor inserts it, RichText draws it, and
// the PDF and TXT exports read it.
//
//   # Heading            (large heading)
//   ## Subheading        (smaller heading)
//   - item  or  * item   (bullet)
//   | a | b |            (table row; a |---| line is ignored)
//   [text](https://...)  (link)
//   ![alt](data:image/...) (image, inline data or https)
export type Block =
  | { type: "h1" | "h2" | "p" | "bullet"; text: string }
  | { type: "table"; rows: string[][] }
  | { type: "image"; alt: string; src: string };

export type Inline = { text: string; href?: string }[];

const IMAGE = /^!\[([^\]]*)\]\((data:[^)\s]+|https?:\/\/[^)\s]+)\)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?\s*:?-{3,}/;

export function parseMarkup(source: string): Block[] {
  const blocks: Block[] = [];
  let table: string[][] | null = null;

  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();

    if (TABLE_ROW.test(line)) {
      if (TABLE_RULE.test(line)) continue;
      if (!table) {
        table = [];
        blocks.push({ type: "table", rows: table });
      }
      table.push(line.slice(1, -1).split("|").map((cell) => cell.trim()));
      continue;
    }
    table = null;

    if (!line) continue;
    const image = IMAGE.exec(line);
    if (image) {
      blocks.push({ type: "image", alt: image[1] ?? "", src: image[2] ?? "" });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3) });
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2) });
    } else if (/^[-*] /.test(line)) {
      blocks.push({ type: "bullet", text: line.slice(2) });
    } else {
      blocks.push({ type: "p", text: line });
    }
  }
  return blocks;
}

// Splits text into plain runs and links, so links can be tapped or printed with their address.
export function parseInline(text: string): Inline {
  const parts: Inline = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index) });
    parts.push({ text: match[1] ?? "", href: match[2] });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

// Plain text version of the markup, for TXT export and PDF text.
export function toPlainText(source: string): string {
  return parseMarkup(source)
    .map((block) => {
      switch (block.type) {
        case "h1":
        case "h2":
          return inlineToPlain(block.text).toUpperCase();
        case "bullet":
          return `- ${inlineToPlain(block.text)}`;
        case "p":
          return inlineToPlain(block.text);
        case "table":
          return block.rows.map((row) => row.join(" | ")).join("\n");
        case "image":
          return `[Image${block.alt ? `: ${block.alt}` : ""}]`;
      }
    })
    .join("\n\n");
}

function inlineToPlain(text: string): string {
  return parseInline(text)
    .map((part) => (part.href ? `${part.text} (${part.href})` : part.text))
    .join("");
}
