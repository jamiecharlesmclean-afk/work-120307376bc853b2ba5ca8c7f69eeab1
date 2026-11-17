// Calendar storage on the phone (AsyncStorage) and the file picker for CSV and ICS imports.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { CalendarEvent } from "./model";

const KEY = "hoopstats:calendar";

export async function loadEvents(): Promise<CalendarEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CalendarEvent[]) : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: CalendarEvent[]): Promise<void> {
  return AsyncStorage.setItem(KEY, JSON.stringify(events));
}

export async function pickCalendarFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["text/csv", "text/calendar", "text/plain"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > 2 * 1024 * 1024) throw new Error("Choose a file smaller than 2 MB.");
  if (asset.file) return asset.file.text();
  const response = await fetch(asset.uri);
  return response.text();
}
