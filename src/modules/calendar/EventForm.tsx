// Add or edit one event. Validation is in model.ts (validateEvent).
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { COLORS } from "../../components/hoopstats-ui";
import { Trash2, Save } from "../../components/icons";
import { ActionButton, Chip } from "../roster/controls";
import { CalendarEvent, EVENT_KINDS, KIND_LABELS, formatTime, parseTime, validateEvent } from "./model";
import { styles } from "./styles";

export function EventForm({
  initial,
  isNew,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: CalendarEvent;
  isNew: boolean;
  onSave: (event: CalendarEvent) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  // Saved 24-hour times show as 5:30 PM while editing.
  const [draft, setDraft] = useState({ ...initial, startTime: formatTime(initial.startTime), endTime: formatTime(initial.endTime) });
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function update<K extends keyof CalendarEvent>(key: K, value: CalendarEvent[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function save() {
    // Times are typed as 5:30 PM or 17:30 and stored as 24-hour HH:MM.
    const startTime = parseTime(draft.startTime);
    const endTime = parseTime(draft.endTime);
    if (startTime === null || endTime === null) {
      setError("Times look like 5:30 PM.");
      return;
    }
    const cleaned: CalendarEvent = {
      ...draft,
      title: draft.title.trim(),
      date: draft.date.trim(),
      startTime,
      endTime,
      location: draft.location.trim(),
      notes: draft.notes.trim(),
    };
    const problem = validateEvent(cleaned);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(cleaned);
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{isNew ? "New event" : "Edit event"}</Text>

      <Text style={styles.subLabel}>TYPE</Text>
      <View style={styles.chips}>
        {EVENT_KINDS.map((kind) => (
          <Chip key={kind} label={KIND_LABELS[kind]} active={draft.kind === kind} onPress={() => update("kind", kind)} />
        ))}
      </View>

      <Text style={styles.subLabel}>TITLE</Text>
      <TextInput accessibilityLabel="Event title" onChangeText={(value) => update("title", value)} placeholder="e.g. Home game vs Lakeside" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.title} />

      <Text style={styles.subLabel}>DATE</Text>
      <TextInput accessibilityLabel="Event date" autoCapitalize="none" onChangeText={(value) => update("date", value)} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.date} />

      <View style={styles.fieldRow}>
        <View style={styles.fieldHalf}>
          <Text style={styles.subLabel}>START</Text>
          <TextInput accessibilityLabel="Start time" autoCapitalize="none" onChangeText={(value) => update("startTime", value)} placeholder="5:00 PM" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.startTime} />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={styles.subLabel}>END</Text>
          <TextInput accessibilityLabel="End time" autoCapitalize="none" onChangeText={(value) => update("endTime", value)} placeholder="6:30 PM" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.endTime} />
        </View>
      </View>

      <Text style={styles.subLabel}>LOCATION</Text>
      <TextInput accessibilityLabel="Event location" onChangeText={(value) => update("location", value)} placeholder="e.g. Main gym" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.location} />

      <Text style={styles.subLabel}>NOTES</Text>
      <TextInput accessibilityLabel="Event notes" multiline onChangeText={(value) => update("notes", value)} placeholder="Kit, arrival time, what to bring" placeholderTextColor={COLORS.muted} style={[styles.input, styles.multiline]} value={draft.notes} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <ActionButton label={isNew ? "Add event" : "Save changes"} onPress={save} primary Icon={Save} />
        <ActionButton label="Cancel" onPress={onCancel} />
      </View>

      {!isNew ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              return;
            }
            onDelete();
          }}
          style={styles.deleteButton}
        >
          <Trash2 color="#c0392b" size={16} />
          <Text style={styles.deleteText}>{confirmDelete ? "Tap again to delete" : "Delete event"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
