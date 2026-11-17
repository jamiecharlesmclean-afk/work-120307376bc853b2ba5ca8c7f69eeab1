import { router } from "expo-router";
import { ArrowLeft, CalendarDays, Check, ChevronDown, ChevronUp, Clock3, Plus, Trash2 } from "../components/icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { teamSubtitle, useTeam } from "../lib/team";
import { PracticeSession, plannerApi } from "../lib/planner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FOCUSES = ["Shooting", "Finishing", "Ball handling", "Defense", "Rebounding", "Team offense", "Game prep"];
const DRILLS = [
  { id: "form-shooting", name: "Form Shooting", minutes: 8 },
  { id: "mikan-finishes", name: "Mikan Finishes", minutes: 6 },
  { id: "closeout-contain", name: "Closeout to Contain", minutes: 10 },
  { id: "continuous-3v2", name: "3-on-2 Continuous", minutes: 12 },
];

function newId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }

export default function PlannerScreen() {
  const { team } = useTeam();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("new");
  const [day, setDay] = useState("Monday");
  const [time, setTime] = useState("5:00 PM");
  const [focus, setFocus] = useState("Shooting");
  const [duration, setDuration] = useState(90);
  const [drillIds, setDrillIds] = useState<string[]>(["form-shooting", "mikan-finishes"]);
  const [notes, setNotes] = useState("");

  useEffect(() => { void plannerApi.load().then((items) => { setSessions(items); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) void plannerApi.save(sessions); }, [sessions, loaded]);

  const totalDrillMinutes = drillIds.reduce((sum, id) => sum + (DRILLS.find((drill) => drill.id === id)?.minutes ?? 0), 0);
  const orderedSessions = [...sessions].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.time.localeCompare(b.time));

  function addSession() {
    const session: PracticeSession = { id: newId(), day, time: time.trim() || "5:00 PM", focus, duration, drillIds, notes: notes.trim(), complete: false };
    setSessions((current) => [...current, session]);
    setExpanded(session.id);
    setNotes("");
    setDrillIds(["form-shooting", "mikan-finishes"]);
  }

  function toggleDrill(id: string) {
    setDrillIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function removeSession(session: PracticeSession) {
    Alert.alert("Delete practice?", `${session.day} · ${session.focus}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setSessions((current) => current.filter((item) => item.id !== session.id)) },
    ]);
  }

  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft color={COLORS.navy} size={19} /><Text style={styles.backText}>Dashboard</Text></Pressable>
        <View style={styles.headingRow}>
          <View style={styles.headingIcon}><CalendarDays color={COLORS.orange} size={23} /></View>
          <View style={styles.headingCopy}><Text style={styles.title}>Training Planner</Text><Text style={styles.subtitle}>{teamSubtitle(team, "Build this week's practice plan")}</Text></View>
        </View>

        <View style={styles.weekCard}>
          <Text style={styles.weekLabel}>THIS WEEK</Text>
          <Text style={styles.weekValue}>{sessions.length} {sessions.length === 1 ? "practice" : "practices"} planned</Text>
          <View style={styles.weekDays}>{DAYS.map((label, index) => {
            const initials = ["M", "T", "W", "T", "F", "S", "S"];
            const hasSession = sessions.some((session) => session.day === label);
            return <View key={label} style={styles.weekDay}><View style={[styles.dayDot, hasSession && styles.dayDotActive]}><Text style={[styles.dayInitial, hasSession && styles.dayInitialActive]}>{initials[index]}</Text></View><View style={[styles.dayMarker, hasSession && styles.dayMarkerActive]} /></View>;
          })}</View>
        </View>

        <Text style={styles.sectionTitle}>SCHEDULE</Text>
        {orderedSessions.map((session) => {
          const isExpanded = expanded === session.id;
          return (
            <View key={session.id} style={styles.sessionCard}>
              <Pressable onPress={() => setExpanded(isExpanded ? null : session.id)} style={styles.sessionHeader}>
                <Pressable accessibilityLabel={session.complete ? "Mark practice incomplete" : "Mark practice complete"} onPress={() => setSessions((current) => current.map((item) => item.id === session.id ? { ...item, complete: !item.complete } : item))} style={[styles.completeButton, session.complete && styles.completeButtonActive]}>
                  {session.complete ? <Check color="#fff" size={15} strokeWidth={3} /> : <Text style={styles.completeDay}>{session.day.slice(0, 1)}</Text>}
                </Pressable>
                <View style={styles.sessionCopy}>
                  <Text style={styles.sessionDay}>{session.day} · {session.time}</Text>
                  <Text style={[styles.sessionFocus, session.complete && styles.completedText]}>{session.focus}</Text>
                  <Text style={styles.sessionMeta}>{session.duration} min · {session.drillIds.length} drills</Text>
                </View>
                {isExpanded ? <ChevronUp color={COLORS.muted} size={19} /> : <ChevronDown color={COLORS.muted} size={19} />}
              </Pressable>
              {isExpanded ? <View style={styles.sessionDetails}>
                {session.drillIds.map((id) => <Text key={id} style={styles.drillItem}>•  {DRILLS.find((drill) => drill.id === id)?.name ?? id}</Text>)}
                {session.notes ? <Text style={styles.sessionNotes}>{session.notes}</Text> : null}
                <Pressable onPress={() => removeSession(session)} style={styles.deleteButton}><Trash2 color="#a5463e" size={15} /><Text style={styles.deleteText}>Delete practice</Text></Pressable>
              </View> : null}
            </View>
          );
        })}
        {sessions.length === 0 ? <View style={styles.empty}><CalendarDays color={COLORS.muted} size={27} /><Text style={styles.emptyTitle}>Your week is open</Text><Text style={styles.emptyCopy}>Add a practice below and choose drills for the team.</Text></View> : null}

        <Text style={styles.sectionTitle}>BUILD A PRACTICE</Text>
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>DAY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
            {DAYS.map((value) => <Choice key={value} label={value.slice(0, 3)} active={day === value} onPress={() => setDay(value)} />)}
          </ScrollView>
          <Text style={styles.fieldLabel}>START TIME</Text>
          <View style={styles.timeRow}><Clock3 color={COLORS.muted} size={17} /><TextInput accessibilityLabel="Practice start time" onChangeText={setTime} placeholder="5:00 PM" placeholderTextColor={COLORS.muted} style={styles.timeInput} value={time} /></View>
          <Text style={styles.fieldLabel}>PRACTICE FOCUS</Text>
          <View style={styles.focusChoices}>{FOCUSES.map((value) => <Choice key={value} label={value} active={focus === value} onPress={() => setFocus(value)} />)}</View>
          <Text style={styles.fieldLabel}>SESSION LENGTH</Text>
          <View style={styles.durationRow}>{[60, 75, 90, 120].map((value) => <Choice key={value} label={`${value} min`} active={duration === value} onPress={() => setDuration(value)} />)}</View>
          <Text style={styles.fieldLabel}>ADD DRILLS · {totalDrillMinutes} MIN SELECTED</Text>
          {DRILLS.map((drill) => {
            const selected = drillIds.includes(drill.id);
            return <Pressable key={drill.id} onPress={() => toggleDrill(drill.id)} style={styles.drillChoice}><View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected ? <Check color="#fff" size={13} strokeWidth={3} /> : null}</View><Text style={styles.drillName}>{drill.name}</Text><Text style={styles.drillMinutes}>{drill.minutes}m</Text></Pressable>;
          })}
          <Text style={styles.fieldLabel}>COACH NOTES</Text>
          <TextInput accessibilityLabel="Coach notes" multiline onChangeText={setNotes} placeholder="Key reminders, groups, equipment..." placeholderTextColor={COLORS.muted} style={styles.notesInput} textAlignVertical="top" value={notes} />
          <Pressable accessibilityRole="button" onPress={addSession} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Plus color="#fff" size={19} /><Text style={styles.addText}>Add to weekly plan</Text></Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 560, paddingBottom: 34, paddingHorizontal: 18, paddingTop: 12, width: "100%" },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, marginBottom: 12 },
  backText: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  headingRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  headingIcon: { alignItems: "center", backgroundColor: "#fff2e9", borderRadius: 25, height: 48, justifyContent: "center", width: 48 },
  headingCopy: { flex: 1 },
  title: { color: COLORS.navyDark, fontSize: 26, fontWeight: "800" },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 3 },
  weekCard: { backgroundColor: COLORS.navy, borderRadius: 9, marginTop: 18, padding: 15 },
  weekLabel: { color: "#ffb583", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  weekValue: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 },
  weekDays: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  weekDay: { alignItems: "center", gap: 5 },
  dayDot: { alignItems: "center", backgroundColor: "#ffffff20", borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
  dayDotActive: { backgroundColor: COLORS.orange },
  dayInitial: { color: "#d9e2ee", fontSize: 11, fontWeight: "700" },
  dayInitialActive: { color: "#fff" },
  dayMarker: { backgroundColor: "transparent", borderRadius: 3, height: 4, width: 4 },
  dayMarkerActive: { backgroundColor: "#ffb583" },
  sectionTitle: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 8, marginTop: 21 },
  sessionCard: { backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  sessionHeader: { alignItems: "center", flexDirection: "row", gap: 11, minHeight: 75, paddingHorizontal: 12, paddingVertical: 10 },
  completeButton: { alignItems: "center", backgroundColor: "#edf2f8", borderRadius: 20, height: 38, justifyContent: "center", width: 38 },
  completeButtonActive: { backgroundColor: "#39805b" },
  completeDay: { color: COLORS.navy, fontSize: 14, fontWeight: "800" },
  sessionCopy: { flex: 1 },
  sessionDay: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  sessionFocus: { color: COLORS.navy, fontSize: 16, fontWeight: "800", marginTop: 2 },
  completedText: { textDecorationLine: "line-through" },
  sessionMeta: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  sessionDetails: { borderTopColor: COLORS.border, borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  drillItem: { color: COLORS.navy, fontSize: 12, lineHeight: 21 },
  sessionNotes: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  deleteButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 5, marginTop: 8 },
  deleteText: { color: "#a5463e", fontSize: 11, fontWeight: "600" },
  empty: { alignItems: "center", backgroundColor: "#f6f8fb", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 22 },
  emptyTitle: { color: COLORS.navy, fontSize: 15, fontWeight: "700", marginTop: 8 },
  emptyCopy: { color: COLORS.muted, fontSize: 12, marginTop: 4, textAlign: "center" },
  form: { backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 9, borderWidth: 1, padding: 14 },
  fieldLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.7, marginBottom: 8, marginTop: 11 },
  choices: { flexDirection: "row", gap: 6 },
  choice: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 32, paddingHorizontal: 11 },
  choiceActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  choiceText: { color: COLORS.navy, fontSize: 11, fontWeight: "600" },
  choiceTextActive: { color: "#fff" },
  timeRow: { alignItems: "center", backgroundColor: "#f8fafc", borderColor: COLORS.border, borderRadius: 6, borderWidth: 1, flexDirection: "row", gap: 9, height: 40, paddingHorizontal: 10 },
  timeInput: { color: COLORS.navy, flex: 1, fontSize: 13 },
  focusChoices: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  durationRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  drillChoice: { alignItems: "center", borderBottomColor: "#eef1f5", borderBottomWidth: 1, flexDirection: "row", gap: 9, minHeight: 38 },
  checkbox: { alignItems: "center", borderColor: "#b7c4d3", borderRadius: 4, borderWidth: 1, height: 19, justifyContent: "center", width: 19 },
  checkboxSelected: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  drillName: { color: COLORS.navy, flex: 1, fontSize: 12, fontWeight: "600" },
  drillMinutes: { color: COLORS.muted, fontSize: 11 },
  notesInput: { backgroundColor: "#f8fafc", borderColor: COLORS.border, borderRadius: 6, borderWidth: 1, color: COLORS.navy, fontSize: 12, height: 68, padding: 9 },
  addButton: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 7, flexDirection: "row", gap: 7, height: 43, justifyContent: "center", marginTop: 14 },
  addText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.78 },
});
