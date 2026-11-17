import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { CalendarDays, Plus, Trash2 } from "../components/icons";
import { Announcement, loadAnnouncements, saveAnnouncements } from "../lib/announcements";
import { teamEyebrow, useTeam } from "../lib/team";
import { ActionButton } from "../modules/roster/controls";
import { CalendarEvent, KIND_LABELS, calendarStyles, eventTiming, formatDate, loadEvents, newEventId } from "../modules/calendar";

const styles = calendarStyles;

// Opened from a calendar event (meeting, team activity or social event) with ?eventId=...
export default function AnnouncementsScreen() {
  const { team } = useTeam();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const eventId = typeof params.eventId === "string" ? params.eventId : "";
  const [items, setItems] = useState<Announcement[]>([]);
  const [linked, setLinked] = useState<CalendarEvent | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  useFocusEffect(useCallback(() => {
    void loadAnnouncements().then(setItems);
    void loadEvents().then((events) => setLinked(events.find((event) => event.id === eventId) ?? null));
  }, [eventId]));

  function post() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Enter a title.");
      return;
    }
    const item: Announcement = {
      id: newEventId(),
      title: cleanTitle,
      body: body.trim(),
      eventId: linked?.id ?? "",
      eventTitle: linked?.title ?? "",
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...items];
    setItems(next);
    void saveAnnouncements(next);
    setTitle("");
    setBody("");
    setError("");
  }

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    void saveAnnouncements(next);
  }

  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{teamEyebrow(team, "ANNOUNCEMENTS")}</Text>
        <Text style={styles.title}>Announcements</Text>

        {linked ? (
          <View style={styles.panel}>
            <Text style={styles.subLabel}>ABOUT THIS EVENT</Text>
            <Text style={styles.panelTitle}>{linked.title}</Text>
            <Text style={styles.hint}>
              {KIND_LABELS[linked.kind]} · {formatDate(linked.date)} · {eventTiming(linked)}{linked.location ? ` · ${linked.location}` : ""}
            </Text>
          </View>
        ) : null}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>New announcement</Text>
          <Text style={styles.subLabel}>TITLE</Text>
          <TextInput accessibilityLabel="Announcement title" onChangeText={(value) => { setTitle(value); setError(""); }} placeholder="e.g. Bring water bottles" placeholderTextColor={COLORS.muted} style={styles.input} value={title} />
          <Text style={styles.subLabel}>MESSAGE</Text>
          <TextInput accessibilityLabel="Announcement message" multiline onChangeText={setBody} placeholder="Details for the team and families" placeholderTextColor={COLORS.muted} style={[styles.input, styles.multiline]} value={body} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <ActionButton label="Post announcement" onPress={post} primary Icon={Plus} />
            <ActionButton label="Open calendar" onPress={() => router.push("/calendar")} Icon={CalendarDays} />
          </View>
        </View>

        <Text style={styles.subLabel}>POSTED</Text>
        {items.length === 0 ? <Text style={styles.hint}>No announcements yet.</Text> : null}
        {items.map((item) => (
          <View key={item.id} style={styles.panel}>
            <Text style={styles.panelTitle}>{item.title}</Text>
            {item.body ? <Text style={styles.hint}>{item.body}</Text> : null}
            <Text style={styles.eventMeta}>
              {formatDate(item.createdAt.slice(0, 10))}{item.eventTitle ? ` · About: ${item.eventTitle}` : ""}
            </Text>
            <Pressable accessibilityLabel={`Delete ${item.title}`} accessibilityRole="button" onPress={() => remove(item.id)} style={styles.deleteButton}>
              <Trash2 color="#c0392b" size={16} />
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
