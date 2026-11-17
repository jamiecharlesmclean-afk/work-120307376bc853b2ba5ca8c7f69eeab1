import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ChevronLeft, ChevronRight, Download, FileUp, Plus } from "../components/icons";
import { COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { downloadFile } from "../lib/download";
import { teamEyebrow, useTeam } from "../lib/team";
import { ActionButton } from "../modules/roster/controls";
import {
  CALENDAR_PHONE_NOTE,
  CalendarEvent,
  CalendarGrid,
  EventForm,
  EXAMPLE_CALENDAR_CSV,
  KIND_COLORS,
  KIND_DESTINATIONS,
  KIND_LABELS,
  EVENT_KINDS,
  calendarStyles,
  eventTiming,
  eventsFromFile,
  eventsOn,
  eventsToCsv,
  formatDate,
  mergeEvents,
  monthLabel,
  newEventId,
  pickCalendarFile,
  todayKey,
  upcoming,
  useCalendar,
} from "../modules/calendar";

const styles = calendarStyles;

// One event: tap the text to edit; the side button opens the module for its type.
function EventRow({ event, meta, onEdit, onOpen }: { event: CalendarEvent; meta: string; onEdit: () => void; onOpen: () => void }) {
  const destination = KIND_DESTINATIONS[event.kind];
  return (
    <View style={styles.eventRow}>
      <View style={[styles.kindBar, { backgroundColor: KIND_COLORS[event.kind] }]} />
      <Pressable accessibilityRole="button" onPress={onEdit} style={styles.eventCopy}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventMeta}>{meta}</Text>
      </Pressable>
      <Pressable accessibilityLabel={`Open ${destination.label}`} accessibilityRole="button" onPress={onOpen} style={styles.openButton}>
        <Text style={styles.openText}>{destination.label}</Text>
        <ChevronRight color={COLORS.orange} size={16} />
      </Pressable>
    </View>
  );
}

export default function CalendarScreen() {
  const { team } = useTeam();
  const { events, refresh, persist } = useCalendar();
  const today = todayKey();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)) - 1);
  const [selected, setSelected] = useState(today);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const dayEvents = eventsOn(events, selected);
  const nextEvents = upcoming(events, today, 6);

  function shiftMonth(step: number) {
    const date = new Date(year, month + step, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
  }

  function selectDate(date: string) {
    setSelected(date);
    setEditing(null);
    setMessage("");
  }

  function startNew() {
    setIsNew(true);
    setImportOpen(false);
    setMessage("");
    setEditing({ id: newEventId(), kind: "practice", title: "", date: selected, startTime: "", endTime: "", location: "", notes: "" });
  }

  function startEdit(event: CalendarEvent) {
    setIsNew(false);
    setImportOpen(false);
    setMessage("");
    setEditing(event);
  }

  // Game and tournament open In-Game Stats, practice opens the Training Planner, and meetings, team activities and social events open Announcements for that event.
  function openEvent(event: CalendarEvent) {
    const destination = KIND_DESTINATIONS[event.kind];
    if (destination.path === "/announcements") router.push({ pathname: "/announcements", params: { eventId: event.id } });
    else router.push(destination.path);
  }

  function saveEvent(event: CalendarEvent) {
    const next = isNew ? [...events, event] : events.map((item) => (item.id === event.id ? event : item));
    persist(next);
    // Jump to the saved day so the person sees where it landed.
    setYear(Number(event.date.slice(0, 4)));
    setMonth(Number(event.date.slice(5, 7)) - 1);
    setSelected(event.date);
    setEditing(null);
    setMessage(isNew ? "Event added." : "Event saved.");
  }

  function deleteEvent() {
    if (!editing) return;
    persist(events.filter((item) => item.id !== editing.id));
    setEditing(null);
    setMessage("Event deleted.");
  }

  async function importFile() {
    setErrors([]);
    setMessage("");
    try {
      const text = await pickCalendarFile();
      if (text === null) return;
      const result = eventsFromFile(text);
      const merged = mergeEvents(events, result.events);
      persist(merged.events);
      setErrors(result.errors);
      const skippedText = merged.skipped ? `, skipped ${merged.skipped} already in the calendar` : "";
      setMessage(`Added ${merged.added} event${merged.added === 1 ? "" : "s"}${skippedText}.`);
    } catch (problem) {
      setErrors([problem instanceof Error ? problem.message : "The file could not be read."]);
    }
  }

  function exportEvents() {
    const saved = downloadFile(`hoopstats-calendar-${today}.csv`, eventsToCsv(events), "text/csv;charset=utf-8");
    setMessage(saved ? "Calendar CSV saved." : CALENDAR_PHONE_NOTE);
  }

  function downloadExample() {
    const saved = downloadFile("calendar-example.csv", EXAMPLE_CALENDAR_CSV, "text/csv;charset=utf-8");
    setMessage(saved ? "Example CSV saved." : CALENDAR_PHONE_NOTE);
  }

  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{teamEyebrow(team, "SCHEDULE")}</Text>
        <Text style={styles.title}>Calendar</Text>

        <View style={styles.monthNav}>
          <Pressable accessibilityLabel="Previous month" accessibilityRole="button" onPress={() => shiftMonth(-1)} style={styles.navButton}>
            <ChevronLeft color={COLORS.navy} size={20} />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel(year, month)}</Text>
          <Pressable accessibilityLabel="Next month" accessibilityRole="button" onPress={() => shiftMonth(1)} style={styles.navButton}>
            <ChevronRight color={COLORS.navy} size={20} />
          </Pressable>
        </View>

        <View style={{ marginTop: 12 }}>
          <CalendarGrid year={year} month={month} selected={selected} today={today} events={events} onSelect={selectDate} />
        </View>

        <View style={styles.legend}>
          {EVENT_KINDS.map((kind) => (
            <View key={kind} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: KIND_COLORS[kind] }]} />
              <Text style={styles.legendText}>{KIND_LABELS[kind]}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.dayHeading}>{formatDate(selected)}</Text>
        {dayEvents.length === 0 ? <Text style={styles.hint}>Nothing scheduled this day.</Text> : null}
        {dayEvents.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            meta={`${KIND_LABELS[event.kind]} · ${eventTiming(event)}${event.location ? ` · ${event.location}` : ""}`}
            onEdit={() => startEdit(event)}
            onOpen={() => openEvent(event)}
          />
        ))}

        <View style={styles.actions}>
          <ActionButton label="Add event" onPress={startNew} primary Icon={Plus} />
          <ActionButton label="Import file" onPress={() => { setEditing(null); setImportOpen((value) => !value); setMessage(""); setErrors([]); }} Icon={FileUp} />
          <ActionButton label="Export CSV" onPress={exportEvents} Icon={Download} />
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {editing ? (
          <EventForm
            key={editing.id}
            initial={editing}
            isNew={isNew}
            onSave={saveEvent}
            onCancel={() => setEditing(null)}
            onDelete={deleteEvent}
          />
        ) : null}

        {importOpen ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Import dates and times</Text>
            <Text style={styles.hint}>
              Choose a CSV or a calendar (.ics) file. CSV needs columns: date, start_time, end_time, type, title, location, notes. Type is one of: {EVENT_KINDS.join(", ")}. Dates can be 2025-03-08 or 08/03/2025; times 17:00 or 5:00 PM.
            </Text>
            <View style={styles.actions}>
              <ActionButton label="Choose file" onPress={() => void importFile()} primary Icon={FileUp} />
              <ActionButton label="Download example" onPress={downloadExample} Icon={Download} />
            </View>
            {errors.length > 0 ? (
              <View style={{ gap: 4 }}>
                {errors.slice(0, 8).map((problem) => (
                  <Text key={problem} style={styles.error}>{problem}</Text>
                ))}
                {errors.length > 8 ? <Text style={styles.error}>…and {errors.length - 8} more.</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.subLabel}>UPCOMING</Text>
        {nextEvents.length === 0 ? <Text style={styles.hint}>No upcoming events. Add a game, practice or event above.</Text> : null}
        {nextEvents.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            meta={`${formatDate(event.date)} · ${KIND_LABELS[event.kind]} · ${eventTiming(event)}`}
            onEdit={() => { setSelected(event.date); startEdit(event); }}
            onOpen={() => openEvent(event)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}
