import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Save, Trash2 } from "../components/icons";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { Player, POSITIONS, emptyPlayer, loadRoster, nextId, saveRoster, validatePlayer } from "../modules/roster";

export default function RosterPlayerScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isNew = id === undefined || id === "new";
  const [draft, setDraft] = useState<Player | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadRoster().then((players) => {
        setAllPlayers(players);
        setLoaded(true);
        if (isNew) {
          setDraft(emptyPlayer(nextId(players)));
          return;
        }
        const found = players.find((player) => String(player.id) === id);
        setDraft(found ?? null);
      });
    }, [id, isNew]),
  );

  function update<K extends keyof Player>(key: K, value: Player[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setError("");
  }

  function setJersey(text: string) {
    const digits = text.replace(/[^0-9]/g, "");
    update("jerseyNumber", digits === "" ? null : Number(digits));
  }

  async function save() {
    if (!draft) return;
    const cleaned: Player = {
      ...draft,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      phone: draft.phone.trim(),
      dateOfBirth: draft.dateOfBirth.trim(),
      contactDetails: draft.contactDetails.trim(),
    };
    const problem = validatePlayer(cleaned);
    if (problem) {
      setError(problem);
      return;
    }
    const others = allPlayers.filter((player) => player.id !== cleaned.id);
    const next = isNew ? [...others, cleaned] : allPlayers.map((player) => (player.id === cleaned.id ? cleaned : player));
    await saveRoster(next);
    leave();
  }

  async function remove() {
    if (!draft) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await saveRoster(allPlayers.filter((player) => player.id !== draft.id));
    leave();
  }

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace("/players");
  }

  return (
    <Screen>
      <HoopHeader navy teamLink={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={leave} style={styles.back}>
          <ArrowLeft color={COLORS.navy} size={20} />
          <Text style={styles.backText}>Roster</Text>
        </Pressable>

        {!loaded ? null : !draft ? (
          <Text style={styles.empty}>This player could not be found. They may have been removed.</Text>
        ) : (
          <>
            <Text style={styles.eyebrow}>{isNew ? "NEW PLAYER" : "PLAYER PROFILE"}</Text>
            <Text style={styles.title}>{draft.firstName.trim() || "New player"}{draft.lastName.trim() ? ` ${draft.lastName.trim()}` : ""}</Text>

            <Field label="FIRST NAME">
              <TextInput accessibilityLabel="First name" onChangeText={(value) => update("firstName", value)} placeholder="First name" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.firstName} />
            </Field>
            <Field label="LAST NAME">
              <TextInput accessibilityLabel="Last name" onChangeText={(value) => update("lastName", value)} placeholder="Last name" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.lastName} />
            </Field>
            <Field label="JERSEY NUMBER">
              <TextInput accessibilityLabel="Jersey number" keyboardType="number-pad" maxLength={2} onChangeText={setJersey} placeholder="0 to 99" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.jerseyNumber === null ? "" : String(draft.jerseyNumber)} />
            </Field>
            <Field label="POSITION">
              <View style={styles.chips}>
                {POSITIONS.map((item) => {
                  const active = draft.position === item;
                  return (
                    <Pressable key={item} accessibilityRole="button" onPress={() => update("position", active ? "" : item)} style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
            <Field label="TELEPHONE">
              <TextInput accessibilityLabel="Telephone" keyboardType="phone-pad" onChangeText={(value) => update("phone", value)} placeholder="e.g. 555-0101" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.phone} />
            </Field>
            <Field label="DATE OF BIRTH">
              <TextInput accessibilityLabel="Date of birth" onChangeText={(value) => update("dateOfBirth", value)} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.muted} style={styles.input} value={draft.dateOfBirth} />
            </Field>
            <Field label="CONTACT DETAILS">
              <TextInput accessibilityLabel="Contact details" multiline onChangeText={(value) => update("contactDetails", value)} placeholder="Parent or guardian, email, address" placeholderTextColor={COLORS.muted} style={[styles.input, styles.multi]} value={draft.contactDetails} />
            </Field>
            <Field label="STATUS">
              <View style={styles.chips}>
                <Pressable accessibilityRole="button" onPress={() => update("active", true)} style={[styles.chip, draft.active && styles.chipActive]}>
                  <Text style={[styles.chipText, draft.active && styles.chipTextActive]}>Active</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => update("active", false)} style={[styles.chip, !draft.active && styles.chipActive]}>
                  <Text style={[styles.chipText, !draft.active && styles.chipTextActive]}>Inactive</Text>
                </Pressable>
              </View>
            </Field>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

            <Pressable accessibilityRole="button" onPress={() => void save()} style={styles.primary}>
              <Save color="#fff" size={17} />
              <Text style={styles.primaryText}>Save player</Text>
            </Pressable>
            {isNew ? null : (
              <Pressable accessibilityRole="button" onPress={() => void remove()} style={styles.remove}>
                <Trash2 color="#a5463e" size={16} />
                <Text style={styles.removeText}>{confirmDelete ? "Tap again to remove this player" : "Remove player"}</Text>
              </Pressable>
            )}
          </>
        )}
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

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 560, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 14, width: "100%" },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, minHeight: 36 },
  backText: { color: COLORS.navy, fontSize: 15, fontWeight: "700" },
  eyebrow: { color: COLORS.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 8 },
  title: { color: COLORS.navyDark, fontSize: 26, fontWeight: "800", marginTop: 2 },
  empty: { color: COLORS.muted, fontSize: 15, marginTop: 24 },
  field: { marginTop: 16 },
  label: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 6 },
  input: { borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, color: COLORS.navyDark, fontSize: 15, minHeight: 44, paddingHorizontal: 12 },
  multi: { minHeight: 80, paddingVertical: 10, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 7 },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { color: COLORS.navy, fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  error: { color: "#a5463e", fontSize: 13, marginTop: 14 },
  primary: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 8, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 22, minHeight: 48 },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  remove: { alignItems: "center", flexDirection: "row", gap: 7, justifyContent: "center", marginTop: 12, minHeight: 44 },
  removeText: { color: "#a5463e", fontSize: 14, fontWeight: "700" },
});
