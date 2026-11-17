// Calendar model: games, practices, tournaments, meetings, team activities and social events.
// Pure functions: storage is in storage.ts. Dates are YYYY-MM-DD and times are 24-hour HH:MM, both in local time.
import { parseCsv } from "../../lib/csv";

export const EVENT_KINDS = ["game", "practice", "tournament", "meeting", "activity", "social"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const KIND_LABELS: Record<EventKind, string> = {
  game: "Game",
  practice: "Practice",
  tournament: "Tournament",
  meeting: "Meeting",
  activity: "Team activity",
  social: "Social event",
};

export type CalendarEvent = {
  id: string;
  kind: EventKind;
  title: string;
  date: string;
  startTime: string; // HH:MM or ""
  endTime: string; // HH:MM or ""
  location: string;
  notes: string;
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MAX_IMPORT_ROWS = 300;

const pad = (value: number) => String(value).padStart(2, "0");

// month is 0-based (January = 0).
export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function todayKey(now: Date = new Date()): string {
  return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isValidTime(value: string): boolean {
  return value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_FULL[month]} ${year}`;
}

// Cells for a Sunday-first month grid. Blank cells are null.
export function monthGrid(year: number, month: number): (string | null)[] {
  const leading = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= days; day += 1) cells.push(dateKey(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title));
}

export function eventsOn(events: CalendarEvent[], date: string): CalendarEvent[] {
  return sortEvents(events.filter((event) => event.date === date));
}

export function upcoming(events: CalendarEvent[], from: string, limit: number): CalendarEvent[] {
  return sortEvents(events.filter((event) => event.date >= from)).slice(0, limit);
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${DAY_NAMES[new Date(year, month - 1, day).getDay()]} ${day} ${MONTH_SHORT[month - 1]}`;
}

// "17:05" becomes "5:05 PM". Empty stays empty.
export function formatTime(time: string): string {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${pad(minute)} ${suffix}`;
}

export function eventTiming(event: CalendarEvent): string {
  const start = formatTime(event.startTime);
  const end = formatTime(event.endTime);
  if (start && end) return `${start} – ${end}`;
  return start || "All day";
}

export function validateEvent(event: CalendarEvent): string | null {
  if (!event.title.trim()) return "Enter a title.";
  if (!(EVENT_KINDS as readonly string[]).includes(event.kind)) return "Choose an event type.";
  if (!isValidDate(event.date)) return "Date must look like 2025-03-06.";
  if (!isValidTime(event.startTime) || !isValidTime(event.endTime)) return "Times must look like 5:30 PM.";
  if (event.endTime && event.startTime && event.endTime < event.startTime) return "The end time is before the start time.";
  return null;
}

export function newEventId(): string {
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Adds incoming events unless the same date, start time, type and title already exist.
export function mergeEvents(existing: CalendarEvent[], incoming: CalendarEvent[]): { events: CalendarEvent[]; added: number; skipped: number } {
  const keyOf = (event: CalendarEvent) => [event.date, event.startTime, event.kind, event.title.trim().toLowerCase()].join("|");
  const seen = new Set(existing.map(keyOf));
  const events = [...existing];
  let added = 0;
  let skipped = 0;
  for (const event of incoming) {
    const key = keyOf(event);
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    events.push(event);
    added += 1;
  }
  return { events, added, skipped };
}

// ---- Parsing helpers for imports ----

// Accepts 2025-03-08 or 08/03/2025 (day first).
export function parseDate(value: string): string | null {
  const text = value.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  const dayFirst = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(text);
  let candidate: string | null = null;
  if (iso) candidate = dateKey(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  else if (dayFirst) candidate = dateKey(Number(dayFirst[3]), Number(dayFirst[2]) - 1, Number(dayFirst[1]));
  return candidate && isValidDate(candidate) ? candidate : null;
}

// Accepts 17:00, 5:00 PM, 5pm. Empty returns "". Unrecognised returns null.
export function parseTime(value: string): string | null {
  const text = value.trim().toLowerCase();
  if (!text) return "";
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/.exec(text);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const suffix = match[3];
  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    if (suffix === "pm" && hour !== 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
  }
  if (hour > 23 || minute > 59) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

const KIND_SYNONYMS: Record<string, EventKind> = {
  training: "practice",
  match: "game",
  league: "game",
  cup: "tournament",
  meet: "meeting",
  team: "activity",
  teamactivity: "activity",
  party: "social",
  dinner: "social",
  socialevent: "social",
};

export function parseKind(value: string): EventKind | null {
  const key = value.toLowerCase().replace(/[^a-z]/g, "");
  if (!key) return null;
  for (const kind of EVENT_KINDS) {
    if (kind === key || KIND_LABELS[kind].toLowerCase().replace(/[^a-z]/g, "") === key) return kind;
  }
  return KIND_SYNONYMS[key] ?? null;
}

// ---- CSV ----

export const CALENDAR_COLUMNS = ["date", "start_time", "end_time", "type", "title", "location", "notes"] as const;

export const EXAMPLE_CALENDAR_CSV = [
  CALENDAR_COLUMNS.join(","),
  "2025-03-08,17:00,18:30,practice,Ball handling,Main gym,Bring cones",
  "2025-03-15,09:00,17:00,tournament,Riverside Invitational,City Sports Centre,Under 14 bracket",
  "2025-03-20,19:00,,meeting,Parent meeting,Clubhouse,Season plan",
  "2025-03-22,,,social,Team dinner,Pizza Palace,Families welcome",
].join("\r\n") + "\r\n";

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function eventsToCsv(events: CalendarEvent[]): string {
  const lines = [CALENDAR_COLUMNS.join(",")];
  for (const event of sortEvents(events)) {
    lines.push([event.date, event.startTime, event.endTime, KIND_LABELS[event.kind], event.title, event.location, event.notes].map(csvField).join(","));
  }
  // A byte-order mark lets Excel read accents and symbols correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export type ImportResult = { events: CalendarEvent[]; errors: string[] };

export function eventsFromCsv(text: string): ImportResult {
  const [header = [], ...body] = parseCsv(text);
  const columns = header.map((cell) => cell.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  if (!columns.includes("date") || !columns.includes("title")) {
    throw new Error('The CSV needs a header row with "date" and "title" columns. See the example.');
  }
  if (body.length > MAX_IMPORT_ROWS) throw new Error(`Import up to ${MAX_IMPORT_ROWS} rows at a time.`);

  const cell = (cells: string[], column: string) => {
    const at = columns.indexOf(column);
    return at >= 0 ? (cells[at] ?? "").trim() : "";
  };

  const events: CalendarEvent[] = [];
  const errors: string[] = [];
  body.forEach((cells, rowIndex) => {
    const line = rowIndex + 2; // header is line 1
    if (cells.every((item) => !item.trim())) return;
    const date = parseDate(cell(cells, "date"));
    const startTime = parseTime(cell(cells, "start_time"));
    const endTime = parseTime(cell(cells, "end_time"));
    const typeText = cell(cells, "type") || "activity";
    const kind = parseKind(typeText);
    if (!cell(cells, "title")) return errors.push(`Line ${line}: a title is required.`);
    if (!date) return errors.push(`Line ${line}: date "${cell(cells, "date")}" is not recognised. Use 2025-03-08.`);
    if (startTime === null) return errors.push(`Line ${line}: start time "${cell(cells, "start_time")}" is not recognised. Use 17:00 or 5:00 PM.`);
    if (endTime === null) return errors.push(`Line ${line}: end time "${cell(cells, "end_time")}" is not recognised. Use 17:00 or 5:00 PM.`);
    if (!kind) return errors.push(`Line ${line}: type "${typeText}" is not known. Use ${EVENT_KINDS.join(", ")}.`);
    const event: CalendarEvent = {
      id: newEventId(),
      kind,
      title: cell(cells, "title"),
      date,
      startTime,
      endTime,
      location: cell(cells, "location"),
      notes: cell(cells, "notes"),
    };
    const problem = validateEvent(event);
    if (problem) return errors.push(`Line ${line}: ${problem}`);
    events.push(event);
  });

  if (events.length === 0 && errors.length === 0) throw new Error("No event rows were found in that file.");
  return { events, errors };
}

// ---- ICS (calendar files exported from Google, Outlook, Apple Calendar) ----

function unescapeIcs(value: string): string {
  return value.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();
}

// 20250306T170000 or 20250306T170000Z (times are read as local) or 20250306 (all day).
function icsDateTime(value: string | undefined): { date: string; time: string } | null {
  if (!value) return null;
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(?:\d{2})?Z?)?$/.exec(value.trim());
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  if (!isValidDate(date)) return null;
  return { date, time: match[4] ? `${match[4]}:${match[5]}` : "" };
}

export function eventsFromIcs(text: string): ImportResult {
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: CalendarEvent[] = [];
  const errors: string[] = [];
  let props: Record<string, string> | null = null;
  let index = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") {
      props = {};
      index += 1;
      continue;
    }
    if (line === "END:VEVENT") {
      if (props) {
        const start = icsDateTime(props.DTSTART);
        const title = unescapeIcs(props.SUMMARY ?? "");
        if (!start) errors.push(`Event ${index}: the start date is missing or not recognised.`);
        else {
          const end = icsDateTime(props.DTEND);
          const kind = parseKind(unescapeIcs(props.CATEGORIES ?? "").split(",")[0] ?? "") ?? "activity";
          events.push({
            id: newEventId(),
            kind,
            title: title || "Untitled event",
            date: start.date,
            startTime: start.time,
            endTime: end && end.date === start.date ? end.time : "",
            location: unescapeIcs(props.LOCATION ?? ""),
            notes: unescapeIcs(props.DESCRIPTION ?? ""),
          });
        }
      }
      props = null;
      continue;
    }
    if (!props) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const name = line.slice(0, colon).split(";")[0].toUpperCase();
    props[name] = line.slice(colon + 1);
  }

  if (events.length === 0 && errors.length === 0) throw new Error("No events were found in that calendar file.");
  return { events, errors };
}

// Chooses the parser from the file contents.
export function eventsFromFile(text: string): ImportResult {
  return text.includes("BEGIN:VCALENDAR") || text.includes("BEGIN:VEVENT") ? eventsFromIcs(text) : eventsFromCsv(text);
}

// Where each event type leads when opened from the calendar.
export type EventDestination = { path: "/game" | "/planner" | "/announcements"; label: string };

export const KIND_DESTINATIONS: Record<EventKind, EventDestination> = {
  game: { path: "/game", label: "In-Game Stats" },
  tournament: { path: "/game", label: "In-Game Stats" },
  practice: { path: "/planner", label: "Training Planner" },
  meeting: { path: "/announcements", label: "Announcements" },
  activity: { path: "/announcements", label: "Announcements" },
  social: { path: "/announcements", label: "Announcements" },
};
