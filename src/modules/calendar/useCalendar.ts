// Calendar events for screens: loads from storage and saves in date order.
import { useCallback, useState } from "react";
import { CalendarEvent, sortEvents } from "./model";
import { loadEvents, saveEvents } from "./storage";

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const refresh = useCallback(async () => {
    setEvents(sortEvents(await loadEvents()));
  }, []);
  const persist = useCallback((next: CalendarEvent[]) => {
    const sorted = sortEvents(next);
    setEvents(sorted);
    void saveEvents(sorted);
  }, []);
  return { events, refresh, persist };
}
