import AsyncStorage from "@react-native-async-storage/async-storage";

export type BoardPoint = { x: number; y: number };
export type BoardMark = { id: string; kind: "player" | "ball"; point: BoardPoint; label: string };
export type BoardLine = { id: string; points: BoardPoint[] };
export type BoardState = { marks: BoardMark[]; lines: BoardLine[] };

const KEY = "hoopstats:coach-whiteboard";
export const STARTING_BOARD: BoardState = {
  marks: [
    { id: "p1", kind: "player", point: { x: 180, y: 135 }, label: "1" },
    { id: "p2", kind: "player", point: { x: 72, y: 215 }, label: "2" },
    { id: "p3", kind: "player", point: { x: 288, y: 215 }, label: "3" },
    { id: "p4", kind: "player", point: { x: 95, y: 355 }, label: "4" },
    { id: "p5", kind: "player", point: { x: 265, y: 355 }, label: "5" },
    { id: "ball", kind: "ball", point: { x: 180, y: 80 }, label: "" },
  ],
  lines: [],
};

export const boardApi = {
  async load(): Promise<BoardState> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return STARTING_BOARD;
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== "object" || !Array.isArray((value as BoardState).marks) || !Array.isArray((value as BoardState).lines)) return STARTING_BOARD;
      return value as BoardState;
    } catch {
      return STARTING_BOARD;
    }
  },
  save(board: BoardState): Promise<void> {
    return AsyncStorage.setItem(KEY, JSON.stringify(board));
  },
};
