// Colour for each event type, used on the grid, the legend and the event rows.
import { EventKind } from "./model";

export const KIND_COLORS: Record<EventKind, string> = {
  game: "#1d4f91",
  practice: "#e67e22",
  tournament: "#8e44ad",
  meeting: "#2c7a7b",
  activity: "#2e8b57",
  social: "#c2185b",
};
