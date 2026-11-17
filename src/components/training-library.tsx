import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronDown, ChevronUp, Download, FileUp, Plus, Upload } from "./icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS, HoopHeader, Screen } from "./hoopstats-ui";
import { teamEyebrow, useTeam } from "../lib/team";
import { entriesFromPdf, pickTrainingFile } from "../lib/pdf-import";
import { entriesFromCsv, entriesToCsv } from "../lib/csv";
import { entriesToPdf } from "../lib/pdf-export";
import { downloadFile } from "../lib/download";

export type TrainingEntry = {
  name: string;
  category: string;
  summary: string;
  time: string;
  setup: string;
  steps: string[];
  coaching: string;
};

export function TrainingLibrary({
  eyebrow,
  title,
  description,
  entries,
  storageKey,
  kind,
  transfer = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  entries: TrainingEntry[];
  storageKey: string;
  kind: "play" | "drill";
  // Shows CSV/PDF export buttons. Off by default.
  transfer?: boolean;
}) {
  const { team } = useTeam();
  const [expanded, setExpanded] = useState<number | null>(0);
  const [added, setAdded] = useState<TrainingEntry[]>([]);
  const [drafts, setDrafts] = useState<TrainingEntry[]>([]);
  const [selectedDrafts, setSelectedDrafts] = useState<number[]>([]);
  const [pdfName, setPdfName] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const allEntries = [...entries, ...added];

  useEffect(() => {
    void AsyncStorage.getItem(storageKey).then((raw) => {
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setAdded(parsed as TrainingEntry[]);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [storageKey]);

  useEffect(() => {
    if (loaded) void AsyncStorage.setItem(storageKey, JSON.stringify(added));
  }, [added, loaded, storageKey]);

  async function importFile() {
    setError("");
    setBusy(true);
    try {
      const result = await pickTrainingFile();
      if (!result) return;
      const candidates = result.kind === "csv" ? entriesFromCsv(result.text) : entriesFromPdf(result.text, kind);
      if (!candidates.length) throw new Error("No coaching items could be found in that file.");
      setPdfName(result.name);
      setDrafts(candidates);
      setSelectedDrafts(candidates.map((_, index) => index));
      setImportOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read that file.");
    } finally {
      setBusy(false);
    }
  }

  function exportFile(format: "pdf" | "csv") {
    setError("");
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "export";
    const saved = format === "csv"
      ? downloadFile(`${slug}.csv`, entriesToCsv(allEntries), "text/csv;charset=utf-8")
      : downloadFile(`${slug}.pdf`, entriesToPdf(team.teamName.trim() ? `${team.teamName.trim()} - ${title}` : title, allEntries), "application/pdf");
    if (!saved) setError(`Saving a ${format.toUpperCase()} file is available in the web preview for now.`);
  }

  function addSelected() {
    const selected = drafts.filter((_, index) => selectedDrafts.includes(index));
    setAdded((current) => [...current, ...selected]);
    setExpanded(allEntries.length);
    setImportOpen(false);
    setDrafts([]);
    setSelectedDrafts([]);
  }

  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{teamEyebrow(team, eyebrow)}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.headerActions}>
          <View style={styles.countPill}><Text style={styles.countText}>{allEntries.length} TEAM {eyebrow.toUpperCase()}</Text></View>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setImportOpen((open) => !open); setError(""); }} style={styles.importButton}>
            {busy ? <ActivityIndicator color="#fff" size="small" /> : <FileUp color="#fff" size={16} />}
            <Text style={styles.importButtonText}>Import file</Text>
          </Pressable>
        </View>
        {transfer ? <View style={styles.exportRow}>
          <Text style={styles.exportLabel}>EXPORT</Text>
          <Pressable accessibilityRole="button" onPress={() => exportFile("pdf")} style={styles.exportButton}><Download color={COLORS.navy} size={15} /><Text style={styles.exportButtonText}>PDF</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => exportFile("csv")} style={styles.exportButton}><Download color={COLORS.navy} size={15} /><Text style={styles.exportButtonText}>CSV</Text></Pressable>
        </View> : null}
        {transfer && !importOpen && error ? <Text accessibilityRole="alert" style={styles.importError}>{error}</Text> : null}
        {importOpen ? <View style={styles.importPanel}>
          <View style={styles.importPanelTitle}><Upload color={COLORS.orange} size={18} /><Text style={styles.importTitle}>Import {kind === "play" ? "plays" : "drills"} from a file</Text></View>
          <Text style={styles.importCopy}>Choose a PDF with selectable text, or a CSV with the columns name, category, summary, time, setup, steps (separated by |) and coaching. Review the drafts, then add the ones you want to your {kind === "play" ? "playbook" : "drill book"}.</Text>
          <Pressable disabled={busy} onPress={() => void importFile()} style={styles.choosePdfButton}><FileUp color={COLORS.navy} size={17} /><Text style={styles.choosePdfText}>{busy ? "Reading file..." : pdfName || "Choose PDF or CSV"}</Text><Plus color={COLORS.navy} size={17} /></Pressable>
          {error ? <Text accessibilityRole="alert" style={styles.importError}>{error}</Text> : null}
          {drafts.length > 0 ? <>
            <Text style={styles.draftHeading}>{drafts.length} EXTRACTED DRAFT{drafts.length === 1 ? "" : "S"} · TAP TO SELECT</Text>
            <View style={styles.draftList}>{drafts.map((draft, index) => {
              const selected = selectedDrafts.includes(index);
              return <Pressable key={`${draft.name}-${index}`} onPress={() => setSelectedDrafts((current) => selected ? current.filter((item) => item !== index) : [...current, index])} style={styles.draftRow}>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected ? <Text style={styles.checkmark}>✓</Text> : null}</View>
                <View style={styles.draftCopy}><Text style={styles.draftName}>{draft.name}</Text><Text numberOfLines={2} style={styles.draftSummary}>{draft.summary}</Text></View>
              </Pressable>;
            })}</View>
            <Pressable disabled={selectedDrafts.length === 0} onPress={addSelected} style={[styles.addDraftsButton, selectedDrafts.length === 0 && styles.disabled]}><Plus color="#fff" size={17} /><Text style={styles.addDraftsText}>Add {selectedDrafts.length} to {kind === "play" ? "playbook" : "drill book"}</Text></Pressable>
          </> : null}
        </View> : null}
        <View style={styles.list}>
          {allEntries.map((entry, index) => {
            const isExpanded = expanded === index;
            const ToggleIcon = isExpanded ? ChevronUp : ChevronDown;
            return (
                <View key={`${entry.name}-${index}`} style={styles.entryCard}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} onPress={() => setExpanded(isExpanded ? null : index)} style={styles.entryHeader}>
                  <View style={styles.number}><Text style={styles.numberText}>{String(index + 1).padStart(2, "0")}</Text></View>
                  <View style={styles.entryCopy}>
                    <Text style={styles.category}>{entry.category} · {entry.time}</Text>
                    <Text style={styles.entryTitle}>{entry.name}</Text>
                    <Text style={styles.summary}>{entry.summary}</Text>
                  </View>
                  <ToggleIcon color={COLORS.muted} size={20} />
                </Pressable>
                {isExpanded ? (
                  <View style={styles.details}>
                    <Text style={styles.detailLabel}>SETUP</Text>
                    <Text style={styles.body}>{entry.setup}</Text>
                    <Text style={styles.detailLabel}>HOW IT RUNS</Text>
                    {entry.steps.map((step, stepIndex) => (
                      <View key={step} style={styles.stepRow}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{stepIndex + 1}</Text></View>
                        <Text style={styles.bodyStep}>{step}</Text>
                      </View>
                    ))}
                    <View style={styles.coachingBox}>
                      <Text style={styles.coachingLabel}>COACHING POINT</Text>
                      <Text style={styles.coachingText}>{entry.coaching}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 560, paddingBottom: 30, paddingHorizontal: 18, paddingTop: 20, width: "100%" },
  eyebrow: { color: COLORS.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: COLORS.navyDark, fontSize: 30, fontWeight: "800", marginTop: 5 },
  description: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  countPill: { alignSelf: "flex-start", backgroundColor: "#edf2f8", borderRadius: 12, marginTop: 14, paddingHorizontal: 10, paddingVertical: 6 },
  headerActions: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  importButton: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 7, flexDirection: "row", gap: 7, minHeight: 36, paddingHorizontal: 11 },
  importButtonText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  exportRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 10 },
  exportLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.6, marginRight: 2 },
  exportButton: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 32, paddingHorizontal: 10 },
  exportButtonText: { color: COLORS.navy, fontSize: 11, fontWeight: "700" },
  importPanel: { backgroundColor: "#fff8f2", borderColor: "#f4d8c3", borderRadius: 9, borderWidth: 1, marginTop: 12, padding: 13 },
  importPanelTitle: { alignItems: "center", flexDirection: "row", gap: 8 },
  importTitle: { color: COLORS.navy, fontSize: 14, fontWeight: "800" },
  importCopy: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  choosePdfButton: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 10, minHeight: 40, paddingHorizontal: 10 },
  choosePdfText: { color: COLORS.navy, flexShrink: 1, fontSize: 12, fontWeight: "700" },
  importError: { color: "#a5463e", fontSize: 12, lineHeight: 17, marginTop: 8 },
  draftHeading: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.6, marginTop: 13 },
  draftList: { marginTop: 4 },
  draftRow: { alignItems: "flex-start", borderBottomColor: "#f0e4dc", borderBottomWidth: 1, flexDirection: "row", gap: 9, paddingVertical: 9 },
  checkbox: { alignItems: "center", borderColor: "#b7c4d3", borderRadius: 4, borderWidth: 1, height: 18, justifyContent: "center", marginTop: 2, width: 18 },
  checkboxSelected: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "800" },
  draftCopy: { flex: 1 },
  draftName: { color: COLORS.navy, fontSize: 12, fontWeight: "700" },
  draftSummary: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginTop: 2 },
  addDraftsButton: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 6, flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 10, minHeight: 38 },
  addDraftsText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  disabled: { opacity: 0.45 },
  countText: { color: COLORS.navy, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  list: { gap: 11, marginTop: 14 },
  entryCard: { backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 9, borderWidth: 1, overflow: "hidden" },
  entryHeader: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 88, paddingHorizontal: 13, paddingVertical: 12 },
  number: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 22, height: 43, justifyContent: "center", width: 43 },
  numberText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  entryCopy: { flex: 1 },
  category: { color: COLORS.orange, fontSize: 10, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  entryTitle: { color: COLORS.navyDark, fontSize: 17, fontWeight: "800", marginTop: 3 },
  summary: { color: COLORS.muted, fontSize: 13, marginTop: 3 },
  details: { borderTopColor: COLORS.border, borderTopWidth: 1, paddingHorizontal: 15, paddingVertical: 14 },
  detailLabel: { color: COLORS.navy, fontSize: 10, fontWeight: "800", letterSpacing: 0.65, marginBottom: 6, marginTop: 2 },
  body: { color: "#455c79", fontSize: 13, lineHeight: 19, marginBottom: 13 },
  stepRow: { alignItems: "flex-start", flexDirection: "row", gap: 9, marginBottom: 9 },
  stepNumber: { alignItems: "center", backgroundColor: "#fff2e9", borderRadius: 10, height: 20, justifyContent: "center", marginTop: 1, width: 20 },
  stepNumberText: { color: COLORS.orange, fontSize: 11, fontWeight: "800" },
  bodyStep: { color: "#455c79", flex: 1, fontSize: 13, lineHeight: 19 },
  coachingBox: { backgroundColor: "#fff7f1", borderLeftColor: COLORS.orange, borderLeftWidth: 3, marginTop: 5, paddingHorizontal: 11, paddingVertical: 9 },
  coachingLabel: { color: COLORS.orange, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  coachingText: { color: COLORS.navyDark, fontSize: 13, lineHeight: 19, marginTop: 3 },
});
