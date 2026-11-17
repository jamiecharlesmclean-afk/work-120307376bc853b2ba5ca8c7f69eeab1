// Team announcements stored on the phone (AsyncStorage). An announcement can be linked to a calendar event.
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  eventId: string; // "" when not linked to an event
  eventTitle: string;
  createdAt: string; // ISO timestamp
};

const KEY = "hoopstats:announcements";

export async function loadAnnouncements(): Promise<Announcement[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Announcement[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function saveAnnouncements(items: Announcement[]): Promise<void> {
  return AsyncStorage.setItem(KEY, JSON.stringify(items));
}
