// Writes a text-only PDF (US Letter, Helvetica) for training entries and notes.
// No dependency: the file is built as plain ASCII, so byte offsets are exact.
import type { TrainingEntry } from "../components/training-library";
import { parseMarkup, parseInline } from "./markup";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type Line = { text: string; bold?: boolean; size: number; gap: number };

// Helvetica is a WinAnsi font; keep the output to printable ASCII.
function ascii(value: string): string {
  return value
    .replace(/[·•]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "?");
}

function escapePdf(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, size: number): string[] {
  const maxChars = Math.floor(CONTENT_WIDTH / (size * 0.55));
  const words = ascii(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function addText(lines: Line[], text: string, size: number, options: { bold?: boolean; gap?: number } = {}) {
  for (const line of wrap(text, size)) {
    lines.push({ text: line, size, bold: options.bold, gap: options.gap ?? size + 4 });
  }
}

function entryLines(entry: TrainingEntry, index: number): Line[] {
  const lines: Line[] = [];
  addText(lines, `${index + 1}. ${entry.name}`, 14, { bold: true, gap: 18 });
  addText(lines, `${entry.category} - ${entry.time}`, 9, { gap: 13 });
  addText(lines, entry.summary, 10);
  addText(lines, "Setup", 10, { bold: true, gap: 14 });
  addText(lines, entry.setup, 10);
  addText(lines, "How it runs", 10, { bold: true, gap: 14 });
  entry.steps.forEach((step, stepIndex) => addText(lines, `${stepIndex + 1}. ${step}`, 10));
  addText(lines, "Coaching point", 10, { bold: true, gap: 14 });
  addText(lines, entry.coaching, 10);
  lines.push({ text: "", size: 10, gap: 14 });
  return lines;
}

function inlineText(text: string): string {
  return parseInline(text).map((part) => (part.href ? `${part.text} (${part.href})` : part.text)).join("");
}

// Notes: headings, bullets, tables and links become lines; images become a label.
function markupLines(source: string): Line[] {
  const lines: Line[] = [];
  for (const block of parseMarkup(source)) {
    switch (block.type) {
      case "h1":
        addText(lines, inlineText(block.text), 16, { bold: true, gap: 22 });
        break;
      case "h2":
        addText(lines, inlineText(block.text), 12, { bold: true, gap: 18 });
        break;
      case "bullet":
        addText(lines, `- ${inlineText(block.text)}`, 10);
        break;
      case "p":
        addText(lines, inlineText(block.text), 10);
        break;
      case "table":
        for (const row of block.rows) addText(lines, row.join("  |  "), 9, { gap: 13 });
        lines.push({ text: "", size: 10, gap: 8 });
        break;
      case "image":
        addText(lines, `[Image${block.alt ? `: ${block.alt}` : ""}]`, 10, { gap: 14 });
        break;
    }
  }
  return lines;
}

function renderPdf(title: string, lines: Line[]): Uint8Array {
  // Lay the text out into pages, starting a new page when the next line does not fit.
  const pages: Array<Array<{ text: string; bold?: boolean; size: number; x: number; y: number }>> = [[]];
  let y = PAGE_HEIGHT - MARGIN;
  const place = (line: Line) => {
    if (y - line.size < MARGIN) {
      pages.push([]);
      y = PAGE_HEIGHT - MARGIN;
    }
    if (line.text) pages[pages.length - 1].push({ text: line.text, bold: line.bold, size: line.size, x: MARGIN, y });
    y -= line.gap;
  };

  const heading: Line[] = [];
  addText(heading, title, 20, { bold: true, gap: 28 });
  heading.push({ text: "", size: 10, gap: 8 });
  [...heading, ...lines].forEach(place);

  // Object layout: 1 catalog, 2 pages, 3 regular font, 4 bold font, then a page and content stream per page.
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 5 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  pages.forEach((texts, index) => {
    const pageId = pageIds[index];
    const streamId = pageId + 1;
    const stream = texts
      .map((item) => `BT /${item.bold ? "F2" : "F1"} ${item.size} Tf ${item.x} ${item.y} Td (${escapePdf(ascii(item.text))}) Tj ET`)
      .join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`;
    objects[streamId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index += 1) bytes[index] = pdf.charCodeAt(index) & 0xff;
  return bytes;
}

export function entriesToPdf(title: string, entries: TrainingEntry[]): Uint8Array {
  return renderPdf(title, entries.flatMap((entry, index) => entryLines(entry, index)));
}

// A library note or document. `source` is the note markup or the extracted text.
export function documentToPdf(title: string, source: string): Uint8Array {
  return renderPdf(title, markupLines(source));
}
