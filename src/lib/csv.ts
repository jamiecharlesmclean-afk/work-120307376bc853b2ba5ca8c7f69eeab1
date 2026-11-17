// CSV reading and writing for training entries (drills and plays).
//
// Columns (header row required, names are case-insensitive):
//   name, category, summary, time, setup, steps, coaching
// `steps` holds several steps separated by " | ". Only `name` is required.
import type { TrainingEntry } from "../components/training-library";

const COLUMNS = ["name", "category", "summary", "time", "setup", "steps", "coaching"] as const;
const MAX_ROWS = 200;

// RFC 4180 style parser: quoted fields, doubled quotes, CRLF or LF line endings.
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
}

export function entriesFromCsv(text: string): TrainingEntry[] {
  const [header = [], ...body] = parseCsv(text);
  const columns = header.map((cell) => cell.trim().toLowerCase());
  if (!columns.includes("name")) {
    throw new Error('The CSV needs a header row with a "name" column.');
  }
  const index = (column: string) => columns.indexOf(column);
  const cell = (cells: string[], column: string) => {
    const at = index(column);
    return at >= 0 ? (cells[at] ?? "").trim() : "";
  };

  const entries = body
    .map((cells): TrainingEntry | null => {
      const name = cell(cells, "name");
      if (!name) return null;
      const steps = cell(cells, "steps").split("|").map((step) => step.trim()).filter(Boolean);
      return {
        name,
        category: cell(cells, "category") || "Imported from CSV",
        summary: cell(cells, "summary") || name,
        time: cell(cells, "time") || "10 MIN",
        setup: cell(cells, "setup") || "Imported from CSV. Review the setup for your team.",
        steps: steps.length ? steps : ["Review this imported item and add the steps."],
        coaching: cell(cells, "coaching") || "Review this imported material and adapt the coaching cues for your team.",
      };
    })
    .filter((entry): entry is TrainingEntry => entry !== null);

  if (!entries.length) throw new Error("No rows with a name were found in that CSV.");
  return entries.slice(0, MAX_ROWS);
}

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function entriesToCsv(entries: TrainingEntry[]): string {
  const lines = [COLUMNS.join(",")];
  for (const entry of entries) {
    const values: Record<(typeof COLUMNS)[number], string> = {
      name: entry.name,
      category: entry.category,
      summary: entry.summary,
      time: entry.time,
      setup: entry.setup,
      steps: entry.steps.join(" | "),
      coaching: entry.coaching,
    };
    lines.push(COLUMNS.map((column) => csvField(values[column])).join(","));
  }
  // A byte-order mark lets Excel read accents and symbols correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
