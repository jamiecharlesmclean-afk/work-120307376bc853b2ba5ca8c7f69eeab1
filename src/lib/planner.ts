import AsyncStorage from "@react-native-async-storage/async-storage";

export type PracticeSession = {
  id: string;
  day: string;
  time: string;
  focus: string;
  duration: number;
  drillIds: string[];
  notes: string;
  complete: boolean;
};

const KEY = "hoopstats:training-planner";

export const plannerApi = {
  async load(): Promise<PracticeSession[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed as PracticeSession[] : [];
    } catch {
      return [];
    }
  },
  save(sessions: PracticeSession[]): Promise<void> {
    return AsyncStorage.setItem(KEY, JSON.stringify(sessions));
  },
};
