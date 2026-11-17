// Roster model: player profiles, validation, search/filter/sort, CSV, and stat-sheet templates.
// Pure functions only: storage lives in storage.ts. The first three players match the live game ids (1, 2, 3).
import { parseCsv } from "../../lib/csv";

export const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
export type Position = (typeof POSITIONS)[number];

export type Player = {
  id: number;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  position: Position | "";
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD or ""
  contactDetails: string;
  active: boolean;
};

export const MAX_IMPORT_ROWS = 200;

export const SEED_ROSTER: Player[] = [
  { id: 1, firstName: "Jaylen", lastName: "", jerseyNumber: 12, position: "SF", phone: "", dateOfBirth: "", contactDetails: "", active: true },
  { id: 2, firstName: "Marcus", lastName: "", jerseyNumber: null, position: "", phone: "", dateOfBirth: "", contactDetails: "", active: true },
  { id: 3, firstName: "Devin", lastName: "", jerseyNumber: null, position: "", phone: "", dateOfBirth: "", contactDetails: "", active: true },
];

export const fullName = (player: Pick<Player, "firstName" | "lastName">) => [player.firstName, player.lastName].filter(Boolean).join(" ");

export function nextId(players: Player[]): number {
  return players.reduce((max, player) => Math.max(max, player.id), 0) + 1;
}

export function emptyPlayer(id: number): Player {
  return { id, firstName: "", lastName: "", jerseyNumber: null, position: "", phone: "", dateOfBirth: "", contactDetails: "", active: true };
}

// ---- Validation ----

export function validatePlayer(player: Player): string | null {
  if (!player.firstName.trim()) return "Enter a first name.";
  if (player.jerseyNumber !== null && (!Number.isInteger(player.jerseyNumber) || player.jerseyNumber < 0 || player.jerseyNumber > 99)) {
    return "Jersey number must be a whole number from 0 to 99.";
  }
  if (player.dateOfBirth && !isValidDate(player.dateOfBirth)) return "Date of birth must look like 2012-05-31.";
  return null;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// ---- Search, filter, sort ----

export type SortBy = "jersey" | "name";

export function visiblePlayers(players: Player[], options: { query: string; position: Position | "all"; showInactive: boolean; sortBy: SortBy; descending: boolean }): Player[] {
  const query = options.query.trim().toLowerCase();
  const filtered = players.filter((player) => {
    if (!options.showInactive && !player.active) return false;
    if (options.position !== "all" && player.position !== options.position) return false;
    if (!query) return true;
    return [fullName(player), player.jerseyNumber === null ? "" : String(player.jerseyNumber), player.position, player.phone]
      .some((value) => value.toLowerCase().includes(query));
  });
  const direction = options.descending ? -1 : 1;
  return [...filtered].sort((a, b) => {
    if (options.sortBy === "jersey") {
      // Players without a number always go last.
      if (a.jerseyNumber === null && b.jerseyNumber === null) return fullName(a).localeCompare(fullName(b));
      if (a.jerseyNumber === null) return 1;
      if (b.jerseyNumber === null) return -1;
      return (a.jerseyNumber - b.jerseyNumber) * direction;
    }
    return fullName(a).localeCompare(fullName(b)) * direction;
  });
}

// ---- CSV ----

export const ROSTER_COLUMNS = ["first_name", "last_name", "jersey_number", "position", "phone", "date_of_birth", "contact_details", "status"] as const;

export const EXAMPLE_ROSTER_CSV = [
  ROSTER_COLUMNS.join(","),
  "Jaylen,Brooks,12,SF,555-0101,2013-04-18,Parent: Dana Brooks 555-0102,active",
  "Marcus,Reed,7,PG,555-0110,2013-09-02,dana.reed@example.com,active",
  "Devin,Cole,,C,,2014-01-22,,inactive",
].join("\r\n") + "\r\n";

export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function rosterToCsv(players: Player[]): string {
  const lines = [ROSTER_COLUMNS.join(",")];
  for (const player of players) {
    const values = [
      player.firstName,
      player.lastName,
      player.jerseyNumber === null ? "" : String(player.jerseyNumber),
      player.position,
      player.phone,
      player.dateOfBirth,
      player.contactDetails,
      player.active ? "active" : "inactive",
    ];
    lines.push(values.map(csvField).join(","));
  }
  // A byte-order mark lets Excel read accents and symbols correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export type ImportResult = { players: Player[]; added: number; updated: number; errors: string[] };

// Adds rows to the roster. A row with the same first and last name as an existing player updates that player.
export function rosterFromCsv(text: string, existing: Player[]): ImportResult {
  const [header = [], ...body] = parseCsv(text);
  const columns = header.map((cell) => cell.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  if (!columns.includes("first_name")) {
    throw new Error('The CSV needs a header row with a "first_name" column. See the example.');
  }
  if (body.length > MAX_IMPORT_ROWS) throw new Error(`Import up to ${MAX_IMPORT_ROWS} rows at a time.`);

  const cell = (cells: string[], column: string) => {
    const at = columns.indexOf(column);
    return at >= 0 ? (cells[at] ?? "").trim() : "";
  };

  const players = [...existing];
  const errors: string[] = [];
  let added = 0;
  let updated = 0;

  body.forEach((cells, rowIndex) => {
    const line = rowIndex + 2; // header is line 1
    const jersey = cell(cells, "jersey_number");
    const statusText = cell(cells, "status").toLowerCase();
    const positionText = cell(cells, "position").toUpperCase();
    const draft: Player = {
      id: 0,
      firstName: cell(cells, "first_name"),
      lastName: cell(cells, "last_name"),
      jerseyNumber: jersey === "" ? null : Number(jersey),
      position: (POSITIONS as readonly string[]).includes(positionText) ? (positionText as Position) : "",
      phone: cell(cells, "phone"),
      dateOfBirth: cell(cells, "date_of_birth"),
      contactDetails: cell(cells, "contact_details"),
      active: statusText !== "inactive",
    };
    if (!draft.firstName) return; // blank line
    if (positionText && !draft.position) errors.push(`Line ${line}: position "${cell(cells, "position")}" is not one of ${POSITIONS.join(", ")}.`);
    const problem = validatePlayer(draft);
    if (problem) {
      errors.push(`Line ${line}: ${problem}`);
      return;
    }
    const match = players.findIndex((player) => player.firstName.toLowerCase() === draft.firstName.toLowerCase() && player.lastName.toLowerCase() === draft.lastName.toLowerCase());
    if (match >= 0) {
      players[match] = { ...draft, id: players[match].id };
      updated += 1;
    } else {
      players.push({ ...draft, id: nextId(players) });
      added += 1;
    }
  });

  if (added + updated === 0 && errors.length === 0) throw new Error("No player rows were found in that CSV.");
  return { players, added, updated, errors };
}

// ---- Stat-preparation templates ----

export const STAT_COLUMNS = {
  points: "Points",
  rebounds: "Rebounds",
  assists: "Assists",
  steals: "Steals",
  blocks: "Blocks",
  turnovers: "Turnovers",
  fouls: "Fouls",
} as const;
export type StatColumn = keyof typeof STAT_COLUMNS;
export const STAT_KEYS = Object.keys(STAT_COLUMNS) as StatColumn[];

export type StatTemplate = { id: string; name: string; columns: StatColumn[]; builtIn: boolean };

export const BUILT_IN_TEMPLATES: StatTemplate[] = [
  { id: "game-sheet", name: "Game sheet", columns: ["points", "rebounds", "assists", "steals", "blocks", "turnovers", "fouls"], builtIn: true },
  { id: "scoring", name: "Scoring and rebounds", columns: ["points", "rebounds", "assists"], builtIn: true },
  { id: "defence", name: "Defence", columns: ["steals", "blocks", "fouls"], builtIn: true },
];

// A blank stat sheet for the game: one row per active player, with the template's stat columns empty to fill in.
export function statSheetCsv(players: Player[], template: StatTemplate): string {
  const header = ["jersey_number", "first_name", "last_name", "position", ...template.columns.map((column) => STAT_COLUMNS[column])];
  const lines = [header.join(",")];
  for (const player of players.filter((item) => item.active)) {
    const row = [
      player.jerseyNumber === null ? "" : String(player.jerseyNumber),
      player.firstName,
      player.lastName,
      player.position,
      ...template.columns.map(() => ""),
    ];
    lines.push(row.map(csvField).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
