import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Archive, ChevronRight, FileText, Folder, FolderPlus, Plus, Search, Upload } from "../components/icons";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { teamEyebrow, useTeam } from "../lib/team";
import { CATEGORIES, Category, DocMeta, addFile, childFolders, createFolder, exportZip, importZip, listDocs, listFolders, matchesQuery, normalizeFolder, pickLibraryFile, readAllTexts, saveDoc } from "../lib/library";
import { downloadFile } from "../lib/download";

const FORMAT_LABEL: Record<DocMeta["format"], string> = { note: "NOTE", pdf: "PDF", txt: "TXT", docx: "DOCX", image: "IMAGE" };

export default function LibraryScreen() {
  const { team } = useTeam();
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [folder, setFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [nextDocs, nextFolders] = await Promise.all([listDocs(), listFolders()]);
    setDocs(nextDocs);
    setFolders(nextFolders);
    setTexts(await readAllTexts(nextDocs.map((doc) => doc.id)));
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const searching = query.trim().length > 0;
  const visible = docs
    .filter((doc) => (category === "All" || doc.category === category))
    .filter((doc) => (searching ? matchesQuery(doc, texts[doc.id] ?? "", query) : doc.folder === folder))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const subfolders = searching ? [] : childFolders(folders, folder);

  async function run(action: () => Promise<void>) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await action();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function newNote() {
    void run(async () => {
      const id = await saveDoc({ title: "Untitled note", category: category === "All" ? "General Coaching" : category, folder, tags: [], text: "" });
      router.push({ pathname: "/library-item", params: { id } });
    });
  }

  function upload() {
    void run(async () => {
      const file = await pickLibraryFile();
      if (!file) return;
      if (file.name.toLowerCase().endsWith(".zip")) {
        const count = await importZip(file.bytes);
        setMessage(`Imported ${count} item${count === 1 ? "" : "s"} from the archive.`);
        return;
      }
      await addFile({ name: file.name, mimeType: file.mimeType, bytes: file.bytes, category: category === "All" ? "General Coaching" : category, folder });
      setMessage(`Added ${file.name}.`);
    });
  }

  function makeFolder() {
    const name = newFolder.trim();
    if (!name) return;
    void run(async () => {
      await createFolder(normalizeFolder(folder ? `${folder}/${name}` : name));
      setNewFolder("");
    });
  }

  function exportArchive() {
    void run(async () => {
      const saved = downloadFile("hoopstats-library.zip", await exportZip(), "application/zip");
      setMessage(saved ? "Archive saved." : "Saving the archive is available in the web preview for now.");
    });
  }

  const crumbs = folder ? folder.split("/") : [];

  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft color={COLORS.navy} size={19} /><Text style={styles.backText}>Dashboard</Text></Pressable>
        <Text style={styles.eyebrow}>{teamEyebrow(team, "COACHING RESOURCES")}</Text>
        <Text style={styles.title}>Documents Library</Text>
        <Text style={styles.description}>One place for practice plans, scouting reports, season plans, team policies and more. Upload PDF, TXT, DOCX or image files, or write notes.</Text>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={newNote} style={styles.primaryButton}><Plus color="#fff" size={16} /><Text style={styles.primaryText}>New note</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={upload} style={styles.secondaryButton}><Upload color={COLORS.navy} size={16} /><Text style={styles.secondaryText}>{busy ? "Working..." : "Upload"}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={exportArchive} style={styles.secondaryButton}><Archive color={COLORS.navy} size={16} /><Text style={styles.secondaryText}>Export ZIP</Text></Pressable>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.searchBox}>
          <Search color={COLORS.muted} size={17} />
          <TextInput onChangeText={setQuery} placeholder="Search titles, tags and content" placeholderTextColor={COLORS.muted} style={styles.searchInput} value={query} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {(["All", ...CATEGORIES] as const).map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}>
              <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {!searching ? (
          <>
            <View style={styles.crumbs}>
              <Pressable onPress={() => setFolder("")}><Text style={styles.crumb}>All files</Text></Pressable>
              {crumbs.map((part, index) => {
                const path = crumbs.slice(0, index + 1).join("/");
                return (
                  <View key={path} style={styles.crumbPart}>
                    <ChevronRight color={COLORS.muted} size={14} />
                    <Pressable onPress={() => setFolder(path)}><Text style={styles.crumb}>{part}</Text></Pressable>
                  </View>
                );
              })}
            </View>
            <View style={styles.folderRow}>
              <TextInput onChangeText={setNewFolder} onSubmitEditing={makeFolder} placeholder="New folder name" placeholderTextColor={COLORS.muted} returnKeyType="done" style={styles.folderInput} value={newFolder} />
              <Pressable accessibilityLabel="Create folder" onPress={makeFolder} style={styles.folderButton}><FolderPlus color="#fff" size={16} /></Pressable>
            </View>
            {subfolders.map((path) => (
              <Pressable key={path} onPress={() => setFolder(path)} style={styles.folderItem}>
                <Folder color={COLORS.orange} size={20} />
                <Text style={styles.folderName}>{path.split("/").pop()}</Text>
                <ChevronRight color={COLORS.muted} size={18} />
              </Pressable>
            ))}
          </>
        ) : null}

        <Text style={styles.sectionHeading}>{searching ? `RESULTS (${visible.length})` : `${visible.length} ITEM${visible.length === 1 ? "" : "S"}`}</Text>
        {visible.length === 0 ? (
          <Text style={styles.empty}>{searching ? "No documents match that search." : "Nothing here yet. Write a note or upload a file."}</Text>
        ) : null}
        <View style={styles.list}>
          {visible.map((doc) => (
            <Pressable key={doc.id} onPress={() => router.push({ pathname: "/library-item", params: { id: doc.id } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardIcon}><FileText color={COLORS.orange} size={20} /></View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardMeta}>{FORMAT_LABEL[doc.format]} · {doc.category.toUpperCase()}</Text>
                <Text style={styles.cardTitle}>{doc.title}</Text>
                <Text style={styles.cardSub}>{doc.folder ? `${doc.folder} · ` : ""}{new Date(doc.updatedAt).toLocaleDateString()}</Text>
                {doc.tags.length ? <View style={styles.tags}>{doc.tags.map((tag) => <Text key={tag} style={styles.tag}>#{tag}</Text>)}</View> : null}
              </View>
              <ChevronRight color={COLORS.muted} size={20} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 560, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 12, width: "100%" },
  back: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 6 },
  backText: { color: COLORS.navy, fontSize: 16, fontWeight: "700" },
  eyebrow: { color: COLORS.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: COLORS.navyDark, fontSize: 30, fontWeight: "800", marginTop: 4 },
  description: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  primaryButton: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 7, flexDirection: "row", gap: 6, minHeight: 38, paddingHorizontal: 12 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  secondaryButton: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 38, paddingHorizontal: 12 },
  secondaryText: { color: COLORS.navy, fontSize: 13, fontWeight: "700" },
  error: { color: "#a5463e", fontSize: 13, lineHeight: 18, marginTop: 10 },
  message: { color: COLORS.navy, fontSize: 13, lineHeight: 18, marginTop: 10 },
  searchBox: { alignItems: "center", backgroundColor: "#f4f7fb", borderRadius: 8, flexDirection: "row", gap: 8, marginTop: 14, paddingHorizontal: 12, height: 42 },
  searchInput: { color: COLORS.navyDark, flex: 1, fontSize: 15, height: 42 },
  chips: { gap: 7, marginTop: 12 },
  chip: { borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { color: COLORS.navy, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  crumbs: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 16 },
  crumbPart: { alignItems: "center", flexDirection: "row", gap: 4 },
  crumb: { color: COLORS.navy, fontSize: 13, fontWeight: "700" },
  folderRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 10 },
  folderInput: { borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, color: COLORS.navyDark, flex: 1, fontSize: 14, height: 40, paddingHorizontal: 10 },
  folderButton: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 7, height: 40, justifyContent: "center", width: 44 },
  folderItem: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 10, marginTop: 8, minHeight: 50, paddingHorizontal: 12 },
  folderName: { color: COLORS.navy, flex: 1, fontSize: 15, fontWeight: "700" },
  sectionHeading: { color: COLORS.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, marginTop: 18 },
  empty: { color: COLORS.muted, fontSize: 14, marginTop: 10 },
  list: { gap: 9, marginTop: 9 },
  card: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 9, borderWidth: 1, flexDirection: "row", gap: 11, padding: 12 },
  pressed: { opacity: 0.85 },
  cardIcon: { alignItems: "center", backgroundColor: "#fff2e9", borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  cardCopy: { flex: 1 },
  cardMeta: { color: COLORS.orange, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  cardTitle: { color: COLORS.navyDark, fontSize: 16, fontWeight: "800", marginTop: 2 },
  cardSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 6 },
  tag: { backgroundColor: "#edf2f8", borderRadius: 9, color: COLORS.navy, fontSize: 11, fontWeight: "700", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2 },
});
