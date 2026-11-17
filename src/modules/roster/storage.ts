// Roster storage on the phone (AsyncStorage) and the CSV file picker.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { BUILT_IN_TEMPLATES, Player, SEED_ROSTER, StatTemplate } from "./model";

const ROSTER_KEY = "hoopstats:roster";
const TEMPLATES_KEY = "hoopstats:roster-templates";

export async function loadRoster(): Promise<Player[]> {
  try {
    const raw = await AsyncStorage.getItem(ROSTER_KEY);
    if (!raw) return SEED_ROSTER;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_ROSTER;
    // Drop medical notes saved by an earlier version; the roster no longer holds them.
    return (parsed as Array<Player & { medicalNotes?: string }>).map(({ medicalNotes: _dropped, ...player }) => player);
  } catch {
    return SEED_ROSTER;
  }
}

export function saveRoster(players: Player[]): Promise<void> {
  return AsyncStorage.setItem(ROSTER_KEY, JSON.stringify(players));
}

async function loadCustomTemplates(): Promise<StatTemplate[]> {
  try {
    const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
    const custom: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(custom) ? (custom as StatTemplate[]) : [];
  } catch {
    return [];
  }
}

export async function loadTemplates(): Promise<StatTemplate[]> {
  return [...BUILT_IN_TEMPLATES, ...(await loadCustomTemplates())];
}

export async function saveCustomTemplate(template: StatTemplate): Promise<void> {
  const custom = await loadCustomTemplates();
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify([...custom, { ...template, builtIn: false }]));
}

// Opens the phone or browser file picker and returns the CSV text, or null if cancelled.
export async function pickRosterCsv(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["text/csv", "text/comma-separated-values", "text/plain"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > 1024 * 1024) throw new Error("Choose a CSV file smaller than 1 MB.");
  if (asset.file) return asset.file.text();
  const response = await fetch(asset.uri);
  return response.text();
}
