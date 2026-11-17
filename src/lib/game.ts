import AsyncStorage from "@react-native-async-storage/async-storage";

export type StatKey = "twoMade" | "twoMissed" | "threeMade" | "threeMissed" | "freeThrowMade" | "freeThrowMissed" | "rebounds" | "assists" | "steals" | "blocks" | "turnovers" | "fouls";
// Players in the live game are identified by a numeric id; `name` is only for display.
export type GamePlayer = { id: number; name: string };
export type GameEvent = { id: string; player: number; stat: StatKey; createdAt: number };
export type GameState = {
  opponent: string;
  period: number;
  seconds: number;
  events: GameEvent[];
};

const KEY = "hoopstats:live-game";
export const GAME_PLAYERS: GamePlayer[] = [
  { id: 1, name: "Jaylen" },
  { id: 2, name: "Marcus" },
  { id: 3, name: "Devin" },
];
export const playerName = (id: number) => GAME_PLAYERS.find((player) => player.id === id)?.name ?? `Player ${id}`;
export const EMPTY_GAME: GameState = { opponent: "Riverside", period: 1, seconds: 600, events: [] };

export const gameApi = {
  async load(): Promise<GameState> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return EMPTY_GAME;
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== "object" || !Array.isArray((value as GameState).events)) return EMPTY_GAME;
      const saved = value as GameState;
      // Games saved before numeric ids stored the player's name; map those to the roster id.
      const events = saved.events.map((event) => {
        const player: unknown = event.player;
        if (typeof player === "number") return event;
        const match = GAME_PLAYERS.find((roster) => roster.name === player);
        return { ...event, player: match ? match.id : 0 };
      });
      return { ...EMPTY_GAME, ...saved, events };
    } catch {
      return EMPTY_GAME;
    }
  },
  save(game: GameState): Promise<void> {
    return AsyncStorage.setItem(KEY, JSON.stringify(game));
  },
  clear(): Promise<void> {
    return AsyncStorage.removeItem(KEY);
  },
};

export function playerStats(events: GameEvent[], player: number) {
  return events.reduce<Record<StatKey, number>>((totals, event) => {
    if (event.player === player) totals[event.stat] += 1;
    return totals;
  }, {
    twoMade: 0, twoMissed: 0, threeMade: 0, threeMissed: 0,
    freeThrowMade: 0, freeThrowMissed: 0, rebounds: 0, assists: 0,
    steals: 0, blocks: 0, turnovers: 0, fouls: 0,
  });
}

export function teamScore(events: GameEvent[]) {
  return events.reduce((score, event) => score + (event.stat === "twoMade" ? 2 : event.stat === "threeMade" ? 3 : event.stat === "freeThrowMade" ? 1 : 0), 0);
}

export function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
