import { router, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { ArrowLeft, Archive, Download, Heading2, Image as ImageIcon, Link, List, RotateCcw, Save, Table, Trash2 } from "../components/icons";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { RichText } from "../components/rich-text";
import { downloadFile } from "../lib/download";
import { documentToPdf } from "../lib/pdf-export";
import { toPlainText } from "../lib/markup";
import { CATEGORIES, Category, DocMeta, base64ToBytes, bytesToBase64, parseTags, readFileBase64, readText, removeDoc, restoreVersion, saveDoc, listDocs, Version } from "../lib/library";

const MAX_IMAGE_CHARS = 1_400_000; // a base64 image of about 1 MB

export default function LibraryItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meta, setMeta] = useState<DocMeta | null>(null);
  const [text, setText] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [fileData, setFileData] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("General Coaching");
  const [folder, setFolder] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [draft, setDraft] = useState("");
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const doc = (await listDocs()).find((item) => item.id === id) ?? null;
    if (!doc) {
      setMeta(null);
      return;
    }
    const body = await readText(doc.id);
    setMeta(doc);
    setText(body.text);
    setDraft(body.text);
    setVersions(body.versions);
    setTitle(doc.title);
    setCategory(doc.category);
    setFolder(doc.folder);
    setTagsText(doc.tags.join(", "));
    setFileData(doc.format === "note" ? null : await readFileBase64(doc.id));
  }

  useEffect(() => { void load(); }, [id]);

  if (!meta) {
    return (
      <Screen>
        <HoopHeader navy />
        <View style={styles.content}><Text style={styles.empty}>This document could not be found.</Text></View>
      </Screen>
    );
  }

  const isNote = meta.format === "note";
  const slug = (title || "document").replace(/[\\/:*?"<>|]+/g, "-");

  async function save() {
    setError("");
    try {
      await saveDoc({
        id: meta!.id,
        title: title.trim() || "Untitled",
        category,
        folder,
        tags: parseTags(tagsText),
        text: isNote ? draft : undefined,
      });
      await load();
      setMessage("Saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    }
  }

  // Appends markup at the end of the note.
  function insert(snippet: string) {
    setDraft((current) => `${current}${current && !current.endsWith("\n") ? "\n" : ""}${snippet}\n`);
    setPreview(false);
  }

  async function insertImage() {
    setError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "image/*", copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const response = asset.file ? null : await fetch(asset.uri);
      const bytes = asset.file ? new Uint8Array(await asset.file.arrayBuffer()) : new Uint8Array(await response!.arrayBuffer());
      const mime = asset.mimeType?.startsWith("image/") ? asset.mimeType : "image/png";
      const dataUrl = `data:${mime};base64,${bytesToBase64(bytes)}`;
      if (dataUrl.length > MAX_IMAGE_CHARS) throw new Error("Choose an image of about 1 MB or smaller.");
      insert(`![${asset.name.replace(/\.[^.]+$/, "")}](${dataUrl})`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add that image.");
    }
  }

  function exportTxt() {
    const content = isNote ? toPlainText(draft) : text;
    downloadFile(`${slug}.txt`, content, "text/plain;charset=utf-8");
  }

  function exportPdf() {
    const saved = downloadFile(`${slug}.pdf`, documentToPdf(title || "Untitled", isNote ? draft : text), "application/pdf");
    if (!saved) setError("Saving a PDF is available in the web preview for now.");
  }

  function downloadOriginal() {
    if (!fileData) return;
    const saved = downloadFile(meta!.fileName, base64ToBytes(fileData), meta!.mimeType);
    if (!saved) setError("Saving the original file is available in the web preview for now.");
  }

  async function restore(index: number) {
    await restoreVersion(meta!.id, index);
    setMessage("Restored that version. The previous text is kept in history.");
    await load();
  }

  function remove() {
    Alert.alert("Delete this document?", "It is removed from this phone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void removeDoc(meta!.id).then(() => router.back()) },
    ]);
  }

  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft color={COLORS.navy} size={19} /><Text style={styles.backText}>Library</Text></Pressable>
        <Text style={styles.eyebrow}>{meta.format.toUpperCase()} · {meta.fileName}</Text>
        <TextInput accessibilityLabel="Title" onChangeText={setTitle} style={styles.titleInput} value={title} />

        <Text style={styles.label}>CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}>
              <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>FOLDER</Text>
        <TextInput onChangeText={setFolder} placeholder="e.g. Season 2025/March" placeholderTextColor={COLORS.muted} style={styles.input} value={folder} />
        <Text style={styles.label}>TAGS</Text>
        <TextInput onChangeText={setTagsText} placeholder="comma separated, e.g. press, zone" placeholderTextColor={COLORS.muted} style={styles.input} value={tagsText} />

        {isNote ? (
          <>
            <Text style={styles.label}>NOTE</Text>
            <View style={styles.toolbar}>
              <ToolButton label="Heading" Icon={Heading2} onPress={() => insert("## Heading")} />
              <ToolButton label="Bullet" Icon={List} onPress={() => insert("- Point")} />
              <ToolButton label="Link" Icon={Link} onPress={() => insert("[Link text](https://example.com)")} />
              <ToolButton label="Table" Icon={Table} onPress={() => insert("| Column | Column |\n| --- | --- |\n| Cell | Cell |")} />
              <ToolButton label="Image" Icon={ImageIcon} onPress={() => void insertImage()} />
            </View>
            <View style={styles.modeRow}>
              <Pressable accessibilityRole="button" onPress={() => setPreview(false)} style={[styles.modeButton, !preview && styles.modeActive]}><Text style={[styles.modeText, !preview && styles.modeTextActive]}>Edit</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => setPreview(true)} style={[styles.modeButton, preview && styles.modeActive]}><Text style={[styles.modeText, preview && styles.modeTextActive]}>Preview</Text></Pressable>
            </View>
            {preview ? (
              <View style={styles.paper}><RichText source={draft} /></View>
            ) : (
              <TextInput accessibilityLabel="Note text" multiline onChangeText={setDraft} placeholder={"# Title\n\nWrite the note here. Use ## for subheadings, - for bullets, | for tables and [text](https://...) for links."} placeholderTextColor={COLORS.muted} style={styles.editor} textAlignVertical="top" value={draft} />
            )}
          </>
        ) : (
          <>
            <Text style={styles.label}>FILE</Text>
            {meta.format === "image" && fileData ? (
              <Image accessibilityLabel={meta.title} resizeMode="contain" source={{ uri: `data:${meta.mimeType};base64,${fileData}` }} style={styles.image} />
            ) : null}
            <View style={styles.paper}>
              {text ? <Text selectable style={styles.plain}>{text}</Text> : <Text style={styles.empty}>No text could be read from this file. You can still download the original.</Text>}
            </View>
            <Pressable onPress={downloadOriginal} style={styles.secondaryButton}><Download color={COLORS.navy} size={16} /><Text style={styles.secondaryText}>Download original</Text></Pressable>
          </>
        )}

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => void save()} style={styles.primaryButton}><Save color="#fff" size={16} /><Text style={styles.primaryText}>Save</Text></Pressable>
          <Pressable onPress={exportTxt} style={styles.secondaryButton}><Download color={COLORS.navy} size={16} /><Text style={styles.secondaryText}>Export TXT</Text></Pressable>
          <Pressable onPress={exportPdf} style={styles.secondaryButton}><Download color={COLORS.navy} size={16} /><Text style={styles.secondaryText}>Export PDF</Text></Pressable>
        </View>

        {isNote ? (
          <>
            <Text style={styles.label}>VERSION HISTORY</Text>
            {versions.length === 0 ? <Text style={styles.empty}>No earlier versions yet. A version is saved each time the text changes.</Text> : null}
            {versions.map((version, index) => (
              <View key={`${version.savedAt}-${index}`} style={styles.version}>
                <View style={styles.versionCopy}>
                  <Text style={styles.versionDate}>{new Date(version.savedAt).toLocaleString()}</Text>
                  <Text numberOfLines={2} style={styles.versionText}>{version.text.trim() || "(empty)"}</Text>
                </View>
                <Pressable accessibilityLabel="Restore version" onPress={() => void restore(index)} style={styles.restore}><RotateCcw color={COLORS.navy} size={15} /><Text style={styles.restoreText}>Restore</Text></Pressable>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.label}>SHARING</Text>
        <Text style={styles.empty}>Sharing with staff needs sign-in and a shared team space. It is not set up in this library yet.</Text>

        <Pressable accessibilityRole="button" onPress={remove} style={styles.delete}><Trash2 color="#a5463e" size={16} /><Text style={styles.deleteText}>Delete document</Text></Pressable>
      </ScrollView>
    </Screen>
  );
}

function ToolButton({ label, Icon, onPress }: { label: string; Icon: typeof Heading2; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.tool}>
      <Icon color={COLORS.navy} size={16} />
      <Text style={styles.toolText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 560, paddingBottom: 40, paddingHorizontal: 18, paddingTop: 12, width: "100%" },
  back: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 6 },
  backText: { color: COLORS.navy, fontSize: 16, fontWeight: "700" },
  eyebrow: { color: COLORS.orange, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  titleInput: { color: COLORS.navyDark, fontSize: 26, fontWeight: "800", marginTop: 4, paddingVertical: 4 },
  label: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginTop: 16, marginBottom: 6 },
  input: { borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, color: COLORS.navyDark, fontSize: 14, height: 42, paddingHorizontal: 10 },
  chips: { gap: 7 },
  chip: { borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { color: COLORS.navy, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  toolbar: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  tool: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 34, paddingHorizontal: 10 },
  toolText: { color: COLORS.navy, fontSize: 12, fontWeight: "700" },
  modeRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  modeButton: { borderColor: COLORS.border, borderRadius: 6, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  modeActive: { backgroundColor: "#edf2f8" },
  modeText: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  modeTextActive: { color: COLORS.navy },
  editor: { borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, color: COLORS.navyDark, fontSize: 15, lineHeight: 22, marginTop: 8, minHeight: 280, padding: 12 },
  paper: { backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, marginTop: 8, minHeight: 200, padding: 14 },
  plain: { color: "#455c79", fontSize: 14, lineHeight: 21 },
  image: { backgroundColor: "#f4f7fb", borderRadius: 8, height: 240, marginBottom: 8, width: "100%" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  primaryButton: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 7, flexDirection: "row", gap: 6, minHeight: 38, paddingHorizontal: 14 },
  primaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  secondaryButton: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 38, marginTop: 8, paddingHorizontal: 12, alignSelf: "flex-start" },
  secondaryText: { color: COLORS.navy, fontSize: 13, fontWeight: "700" },
  error: { color: "#a5463e", fontSize: 13, lineHeight: 18, marginTop: 12 },
  message: { color: COLORS.navy, fontSize: 13, lineHeight: 18, marginTop: 12 },
  empty: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
  version: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 10, marginTop: 8, padding: 10 },
  versionCopy: { flex: 1 },
  versionDate: { color: COLORS.navy, fontSize: 12, fontWeight: "800" },
  versionText: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  restore: { alignItems: "center", borderColor: COLORS.border, borderRadius: 6, borderWidth: 1, flexDirection: "row", gap: 4, paddingHorizontal: 9, paddingVertical: 6 },
  restoreText: { color: COLORS.navy, fontSize: 12, fontWeight: "700" },
  delete: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, marginTop: 26 },
  deleteText: { color: "#a5463e", fontSize: 13, fontWeight: "700" },
});
