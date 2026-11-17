import { router } from "expo-router";
import { Plus, Trash2 } from "../components/icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { EMPTY_TEAM, StaffMember, TeamProfile, loadTeam, saveTeam, useTeam } from "../lib/team";

const AGE_GROUPS = ["U8", "U10", "U12", "U14", "U16", "U18", "Senior"];
const COMPETITIONS = ["League", "Cup", "Friendly", "Tournament"];
const ROLES = ["Head coach", "Assistant coach", "Trainer", "Team manager"];

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export default function SetupScreen() {
  const { team, loaded } = useTeam();
  const [form, setForm] = useState<TeamProfile>(EMPTY_TEAM);
  const [error, setError] = useState("");
  const [initialised, setInitialised] = useState(false);

  // Fill the form once from the saved details, so typing is not overwritten by later reloads.
  useEffect(() => {
    if (loaded && !initialised) {
      setForm(team);
      setInitialised(true);
    }
  }, [loaded, initialised, team]);

  const editing = team.setupDone;

  function update<K extends keyof TeamProfile>(key: K, value: TeamProfile[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateStaff(id: string, patch: Partial<StaffMember>) {
    setForm((current) => ({ ...current, staff: current.staff.map((member) => (member.id === id ? { ...member, ...patch } : member)) }));
  }

  function addStaff() {
    setForm((current) => ({ ...current, staff: [...current.staff, { id: newId(), name: "", role: "" }] }));
  }

  function removeStaff(id: string) {
    setForm((current) => ({ ...current, staff: current.staff.filter((member) => member.id !== id) }));
  }

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function save() {
    if (!form.teamName.trim()) {
      setError("Enter a team name, or skip for now.");
      return;
    }
    setError("");
    await saveTeam({
      teamName: form.teamName.trim(),
      season: form.season.trim(),
      competition: form.competition.trim(),
      ageGroup: form.ageGroup.trim(),
      staff: form.staff
        .map((member) => ({ ...member, name: member.name.trim(), role: member.role.trim() }))
        .filter((member) => member.name),
      setupDone: true,
    });
    leave();
  }

  async function skip() {
    // Keeps whatever was saved before; the setup is then not shown again on launch.
    const current = await loadTeam();
    await saveTeam({ ...current, setupDone: true });
    leave();
  }

  return (
    <Screen>
      <HoopHeader navy teamLink={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{editing ? "TEAM DETAILS" : "WELCOME"}</Text>
        <Text style={styles.title}>{editing ? "Edit your team" : "Set up your team"}</Text>
        <Text style={styles.description}>These details appear in the header. You can change them any time from the header or the dashboard.</Text>

        <Field label="TEAM NAME">
          <TextInput accessibilityLabel="Team name" onChangeText={(value) => update("teamName", value)} placeholder="e.g. Riverside Hawks" placeholderTextColor={COLORS.muted} style={styles.input} value={form.teamName} />
        </Field>

        <Field label="SEASON">
          <TextInput accessibilityLabel="Season" onChangeText={(value) => update("season", value)} placeholder="e.g. 2025/26" placeholderTextColor={COLORS.muted} style={styles.input} value={form.season} />
        </Field>

        <Field label="COMPETITION">
          <ChoiceInput label="Competition" onChange={(value) => update("competition", value)} placeholder="Choose or type" presets={COMPETITIONS} value={form.competition} />
        </Field>

        <Field label="AGE GROUP">
          <ChoiceInput label="Age group" onChange={(value) => update("ageGroup", value)} placeholder="Choose or type" presets={AGE_GROUPS} value={form.ageGroup} />
        </Field>

        <Field label="COACHING STAFF">
          {form.staff.map((member, index) => (
            <View key={member.id} style={styles.staffCard}>
              <View style={styles.staffHeader}>
                <Text style={styles.staffNumber}>{index + 1}</Text>
                <Pressable accessibilityLabel="Remove staff member" accessibilityRole="button" hitSlop={8} onPress={() => removeStaff(member.id)}>
                  <Trash2 color={COLORS.muted} size={17} />
                </Pressable>
              </View>
              <TextInput accessibilityLabel={`Staff name ${index + 1}`} onChangeText={(value) => updateStaff(member.id, { name: value })} placeholder="Name" placeholderTextColor={COLORS.muted} style={styles.input} value={member.name} />
              <ChoiceInput label={`Role ${index + 1}`} onChange={(value) => updateStaff(member.id, { role: value })} placeholder="Role, e.g. Head coach" presets={ROLES} value={member.role} />
            </View>
          ))}
          <Pressable accessibilityRole="button" onPress={addStaff} style={styles.addStaff}>
            <Plus color={COLORS.navy} size={16} />
            <Text style={styles.addStaffText}>Add staff member</Text>
          </Pressable>
        </Field>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <Pressable accessibilityRole="button" onPress={() => void save()} style={styles.primary}>
          <Text style={styles.primaryText}>{editing ? "Save changes" : "Save team"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void skip()} style={styles.secondary}>
          <Text style={styles.secondaryText}>{editing ? "Cancel" : "Skip for now"}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// A text box with suggested choices. Tapping a choice fills the box; typing sets any other value.
function ChoiceInput({ label, presets, value, onChange, placeholder }: { label: string; presets: string[]; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <View style={styles.choice}>
      <TextInput accessibilityLabel={label} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={COLORS.muted} style={styles.input} value={value} />
      <View style={styles.chips}>
        {presets.map((preset) => {
          const selected = value === preset;
          return (
            <Pressable key={preset} accessibilityRole="button" onPress={() => onChange(preset)} style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{preset}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 560, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 16, width: "100%" },
  eyebrow: { color: COLORS.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: COLORS.navyDark, fontSize: 28, fontWeight: "800", marginTop: 4 },
  description: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  field: { marginTop: 18 },
  label: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 6 },
  input: { borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, color: COLORS.navyDark, fontSize: 15, height: 44, paddingHorizontal: 12 },
  choice: { gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { color: COLORS.navy, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  staffCard: { backgroundColor: "#f8fafc", borderColor: COLORS.border, borderRadius: 9, borderWidth: 1, gap: 9, marginBottom: 10, padding: 12 },
  staffHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  staffNumber: { color: COLORS.navy, fontSize: 12, fontWeight: "800" },
  addStaff: { alignItems: "center", alignSelf: "flex-start", borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 38, paddingHorizontal: 12 },
  addStaffText: { color: COLORS.navy, fontSize: 13, fontWeight: "700" },
  error: { color: "#a5463e", fontSize: 13, marginTop: 14 },
  primary: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 8, marginTop: 22, minHeight: 48, justifyContent: "center" },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  secondary: { alignItems: "center", marginTop: 10, minHeight: 44, justifyContent: "center" },
  secondaryText: { color: COLORS.navy, fontSize: 14, fontWeight: "700" },
});
