import { router } from "expo-router";
import { BookOpen, CalendarDays, ChevronRight, Dumbbell, FileText, PencilRuler, Radio, CalendarRange, UsersRound } from "../components/icons";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { BottomNav, COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { CalendarEvent, KIND_LABELS, formatDate, formatTime, loadEvents, todayKey, upcoming } from "../modules/calendar";

export default function HomeScreen() {
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);

  useFocusEffect(useCallback(() => {
    void loadEvents().then((events) => setNextEvent(upcoming(events, todayKey(), 1)[0] ?? null));
  }, []));

  return (
    <Screen>
      <HoopHeader />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.push("/game")} style={({ pressed }) => [styles.gameCard, pressed && styles.pressed]}>
          <Text style={styles.eyebrowLight}>NEXT GAME</Text>
          <View style={styles.cardRow}>
            <Text style={styles.ball}>🏀</Text>
            <View style={styles.cardCopy}>
              <Text style={styles.gameTitle}>vs. Riverside</Text>
              <Text style={styles.gameSub}>Friday · 7:00 PM</Text>
            </View>
            <ChevronRight color="#fff" size={22} />
          </View>
        </Pressable>

        <Pressable onPress={() => router.push("/calendar")} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <Text style={styles.eyebrow}>CALENDAR</Text>
          <View style={styles.cardRow}>
            <CalendarDays color={COLORS.navy} size={36} strokeWidth={2.1} />
            <View style={styles.cardCopy}>
              <Text numberOfLines={1} style={styles.playerName}>{nextEvent ? nextEvent.title : "Schedule your season"}</Text>
              <Text numberOfLines={1} style={styles.secondary}>
                {nextEvent ? `${KIND_LABELS[nextEvent.kind]} · ${formatDate(nextEvent.date)}${nextEvent.startTime ? ` · ${formatTime(nextEvent.startTime)}` : ""}` : "Add games, practices and events"}
              </Text>
            </View>
            <ChevronRight color={COLORS.navy} size={22} />
          </View>
        </Pressable>

        <Pressable onPress={() => setPracticeStarted((value) => !value)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionBall}>🏀</Text>
          <Text style={styles.actionText}>{practiceStarted ? "Practice Started" : "Start Practice"}</Text>
        </Pressable>

        <Text style={styles.sectionHeading}>COACHING TOOLKIT</Text>
        <Pressable onPress={() => router.push("/playbook")} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
          <View style={styles.toolIcon}><BookOpen color={COLORS.orange} size={23} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.toolTitle}>Team Playbook</Text>
            <Text style={styles.toolDescription}>Plays, sets &amp; situations</Text>
          </View>
          <ChevronRight color={COLORS.navy} size={22} />
        </Pressable>
        <Pressable onPress={() => router.push("/players")} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
          <View style={styles.toolIcon}><UsersRound color={COLORS.orange} size={23} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.toolTitle}>Roster</Text>
            <Text style={styles.toolDescription}>Players, profiles &amp; stat sheets</Text>
          </View>
          <ChevronRight color={COLORS.navy} size={22} />
        </Pressable>
        <Pressable onPress={() => router.push("/drills")} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
          <View style={styles.toolIcon}><Dumbbell color={COLORS.orange} size={23} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.toolTitle}>Drill Book</Text>
            <Text style={styles.toolDescription}>Practice plans &amp; skill work</Text>
          </View>
          <ChevronRight color={COLORS.navy} size={22} />
        </Pressable>
        <Pressable onPress={() => router.push("/library")} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
          <View style={styles.toolIcon}><FileText color={COLORS.orange} size={23} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.toolTitle}>Documents Library</Text>
            <Text style={styles.toolDescription}>Plans, scouting, policies &amp; notes</Text>

          </View>
          <ChevronRight color={COLORS.navy} size={22} />
        </Pressable>
        <Pressable onPress={() => router.push("/game")} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
          <View style={styles.toolIcon}><Radio color={COLORS.orange} size={23} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.toolTitle}>In-Game Stats</Text>
            <Text style={styles.toolDescription}>Live score, clock &amp; box score</Text>
          </View>
          <ChevronRight color={COLORS.navy} size={22} />
        </Pressable>
        <Pressable onPress={() => router.push("/whiteboard")} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
          <View style={styles.toolIcon}><PencilRuler color={COLORS.orange} size={23} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.toolTitle}>Whiteboard</Text>
            <Text style={styles.toolDescription}>Draw and save a play diagram</Text>
          </View>
          <ChevronRight color={COLORS.navy} size={22} />
        </Pressable>
        <Pressable onPress={() => router.push("/planner")} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
          <View style={styles.toolIcon}><CalendarRange color={COLORS.orange} size={23} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.toolTitle}>Training Planner</Text>
            <Text style={styles.toolDescription}>Build this week's practice schedule</Text>
          </View>
          <ChevronRight color={COLORS.navy} size={22} />
        </Pressable>
      </ScrollView>
      <BottomNav active="home" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", gap: 15, maxWidth: 500, paddingBottom: 20, paddingHorizontal: 15, paddingTop: 9, width: "100%" },
  gameCard: { backgroundColor: COLORS.navy, borderRadius: 7, minHeight: 109, paddingHorizontal: 18, paddingVertical: 14 },
  eyebrowLight: { color: "#e7edf7", fontSize: 11, fontWeight: "500", letterSpacing: 0.1, marginBottom: 8 },
  card: { backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, minHeight: 115, paddingHorizontal: 18, paddingVertical: 14 },
  practiceCard: { minHeight: 104 },
  eyebrow: { color: COLORS.muted, fontSize: 11, fontWeight: "500", marginBottom: 8 },
  cardRow: { alignItems: "center", flexDirection: "row", gap: 15 },
  ball: { fontSize: 43, height: 49, textAlign: "center", textAlignVertical: "center", width: 50 },
  cardCopy: { flex: 1 },
  gameTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  gameSub: { color: "#f0f3f8", fontSize: 15, marginTop: 3 },
  numberCircle: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 30, height: 58, justifyContent: "center", width: 58 },
  number: { color: "#fff", fontSize: 25, fontWeight: "700" },
  playerName: { color: COLORS.navy, fontSize: 21, fontWeight: "700" },
  secondary: { color: COLORS.muted, fontSize: 16, marginTop: 3 },
  action: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 7, flexDirection: "row", gap: 10, height: 50, justifyContent: "center", marginTop: 0 },
  actionBall: { color: "#fff", fontSize: 22 },
  actionText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionHeading: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: -7, marginTop: 2 },
  toolCard: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 13, minHeight: 76, paddingHorizontal: 13 },
  toolIcon: { alignItems: "center", backgroundColor: "#fff2e9", borderRadius: 24, height: 46, justifyContent: "center", width: 46 },
  toolTitle: { color: COLORS.navy, fontSize: 16, fontWeight: "700" },
  toolDescription: { color: COLORS.muted, fontSize: 13, marginTop: 3 },
  pressed: { opacity: 0.78 },
});
