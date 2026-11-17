// Documents Library: coaching notes and uploaded files, stored on the phone.
//
// Storage (AsyncStorage; localStorage on the web):
//   hoopstats:library:index        DocMeta[] for every item
//   hoopstats:library:folders      folder paths created by hand
//   hoopstats:library:doc:<id>     { text, versions } (notes and extracted text)
//   hoopstats:library:file:<id>    original file bytes as base64 (uploads only)
//
// Sharing with staff needs sign-in and a hosted team space; it is not part of
// this on-device library yet.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { extractPdfText } from "./pdf-import";

// Lets the person choose one file: PDF, TXT, DOCX, an image, or a ZIP archive.
export async function pickLibraryFile(): Promise<{ name: string; mimeType: string; bytes: Uint8Array } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/*", "application/zip"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const response = asset.file ? null : await fetch(asset.uri);
  const bytes = asset.file
    ? new Uint8Array(await asset.file.arrayBuffer())
    : new Uint8Array(await response!.arrayBuffer());
  return { name: asset.name, mimeType: asset.mimeType ?? "", bytes };
}

export const CATEGORIES = [
  "Practice Plans",
  "Scouting Reports",
  "Season Plans",
  "Team Policies",
  "Opponent Analysis",
  "General Coaching",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type DocFormat = "note" | "pdf" | "txt" | "docx" | "image";

export type DocMeta = {
  id: string;
  title: string;
  category: Category;
  folder: string;
  tags: string[];
  format: DocFormat;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: number;
  updatedAt: number;
};
export type Version = { text: string; savedAt: number };
export type DocBody = { text: string; versions: Version[] };

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_VERSIONS = 20;
const INDEX_KEY = "hoopstats:library:index";
const FOLDERS_KEY = "hoopstats:library:folders";
const bodyKey = (id: string) => `hoopstats:library:doc:${id}`;
const fileKey = (id: string) => `hoopstats:library:file:${id}`;

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp"];

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeFolder(path: string): string {
  return path.split("/").map((part) => part.trim()).filter(Boolean).join("/");
}

export function parseTags(input: string): string[] {
  return [...new Set(input.split(/[,#]/).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
}

export async function listDocs(): Promise<DocMeta[]> {
  return readJson<DocMeta[]>(INDEX_KEY, []);
}

async function writeDocs(docs: DocMeta[]) {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(docs));
}

export async function listFolders(): Promise<string[]> {
  const stored = await readJson<string[]>(FOLDERS_KEY, []);
  const docs = await listDocs();
  const all = new Set([...stored, ...docs.map((doc) => doc.folder).filter(Boolean)]);
  // Include parent folders so "A/B" also shows "A".
  for (const path of [...all]) {
    const parts = path.split("/");
    for (let index = 1; index < parts.length; index += 1) all.add(parts.slice(0, index).join("/"));
  }
  return [...all].sort();
}

export async function createFolder(path: string): Promise<void> {
  const cleaned = normalizeFolder(path);
  if (!cleaned) return;
  const stored = await readJson<string[]>(FOLDERS_KEY, []);
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify([...new Set([...stored, cleaned])]));
}

// Immediate subfolders of `current` ("" is the top level).
export function childFolders(folders: string[], current: string): string[] {
  const prefix = current ? `${current}/` : "";
  const children = new Set<string>();
  for (const folder of folders) {
    if (!folder.startsWith(prefix) || folder === current) continue;
    const name = folder.slice(prefix.length).split("/")[0];
    if (name) children.add(`${prefix}${name}`);
  }
  return [...children].sort();
}

export async function readText(id: string): Promise<DocBody> {
  return readJson<DocBody>(bodyKey(id), { text: "", versions: [] });
}

export async function readFileBase64(id: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(fileKey(id));
  } catch {
    return null;
  }
}

export async function saveDoc(input: {
  id?: string;
  title: string;
  category: Category;
  folder: string;
  tags: string[];
  // Only notes change text here. Omit to keep the current text.
  text?: string;
}): Promise<string> {
  const docs = await listDocs();
  const now = Date.now();
  const id = input.id ?? newId();
  const existing = docs.find((doc) => doc.id === id);
  const body = await readText(id);
  let { text, versions } = body;

  // Only edits of an existing item create a version; a new note starts with none.
  if (input.text !== undefined && input.text !== text) {
    // Keep the old text so it can be restored. A new note has no old text, so it starts with no versions.
    // An empty starting note is not worth a version.
    if (existing && text.trim()) versions = [{ text, savedAt: now }, ...versions].slice(0, MAX_VERSIONS);
    text = input.text;
  }
  const title = input.title.trim() || "Untitled";
  const meta: DocMeta = {
    id,
    title,
    category: input.category,
    folder: normalizeFolder(input.folder),
    tags: input.tags,
    format: existing?.format ?? "note",
    fileName: existing && existing.format !== "note" ? existing.fileName : `${title}.md`,
    mimeType: existing?.mimeType ?? "text/markdown",
    size: text.length,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await AsyncStorage.setItem(bodyKey(id), JSON.stringify({ text, versions }));
  await writeDocs(existing ? docs.map((doc) => (doc.id === id ? meta : doc)) : [meta, ...docs]);
  return id;
}

export async function restoreVersion(id: string, index: number): Promise<void> {
  const body = await readText(id);
  const version = body.versions[index];
  if (!version) return;
  const docs = await listDocs();
  const meta = docs.find((doc) => doc.id === id);
  if (!meta) return;
  await saveDoc({ id, title: meta.title, category: meta.category, folder: meta.folder, tags: meta.tags, text: version.text });
}

export async function removeDoc(id: string): Promise<void> {
  const docs = await listDocs();
  await writeDocs(docs.filter((doc) => doc.id !== id));
  await AsyncStorage.multiRemove([bodyKey(id), fileKey(id)]);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function detectFormat(name: string, mimeType: string): DocFormat | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (ext === "txt" || mimeType === "text/plain") return "txt";
  if (ext === "docx" || mimeType.includes("wordprocessingml")) return "docx";
  if (IMAGE_EXTENSIONS.includes(ext) || mimeType.startsWith("image/")) return "image";
  return null;
}

function docxText(bytes: Uint8Array): string {
  const files = unzipSync(bytes, { filter: (file) => file.name === "word/document.xml" });
  const xml = files["word/document.xml"];
  if (!xml) throw new Error("That DOCX file has no document text.");
  return strFromU8(xml)
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Stores an uploaded PDF, TXT, DOCX or image. Text is extracted for search.
export async function addFile(input: {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  category: Category;
  folder: string;
  tags?: string[];
}): Promise<string> {
  const format = detectFormat(input.name, input.mimeType);
  if (!format) throw new Error("Unsupported file. Use PDF, TXT, DOCX or an image.");
  if (input.bytes.byteLength > MAX_FILE_BYTES) throw new Error("Files must be 2 MB or smaller on the phone.");

  let text = "";
  if (format === "txt") text = strFromU8(input.bytes);
  if (format === "docx") text = docxText(input.bytes);
  if (format === "pdf") {
    // A scanned PDF has no text; keep the file anyway.
    text = await extractPdfText(input.bytes).catch(() => "");
  }

  const now = Date.now();
  const id = newId();
  const mimeType = input.mimeType || (format === "pdf" ? "application/pdf" : format === "image" ? "image/*" : "application/octet-stream");
  const meta: DocMeta = {
    id,
    title: input.name.replace(/\.[^.]+$/, "") || "Untitled",
    category: input.category,
    folder: normalizeFolder(input.folder),
    tags: input.tags ?? [],
    format,
    fileName: input.name,
    mimeType,
    size: input.bytes.byteLength,
    createdAt: now,
    updatedAt: now,
  };
  await AsyncStorage.setItem(bodyKey(id), JSON.stringify({ text, versions: [] }));
  await AsyncStorage.setItem(fileKey(id), bytesToBase64(input.bytes));
  await writeDocs([meta, ...(await listDocs())]);
  return id;
}

// Every note and file as text, for search. Loaded in one request.
export async function readAllTexts(ids: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!ids.length) return result;
  const pairs = await AsyncStorage.multiGet(ids.map(bodyKey));
  for (const [key, raw] of pairs) {
    const id = ids.find((candidate) => bodyKey(candidate) === key);
    if (!id || !raw) continue;
    try {
      result[id] = (JSON.parse(raw) as DocBody).text ?? "";
    } catch {
      result[id] = "";
    }
  }
  return result;
}

export function matchesQuery(meta: DocMeta, text: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [meta.title, meta.category, meta.folder, meta.fileName, ...meta.tags, text]
    .some((value) => value.toLowerCase().includes(needle));
}

function safeName(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim() || "untitled";
}

// Index entries keep categories, tags, folders and versions through a ZIP round trip.
type ArchiveIndex = Array<DocMeta & { path: string; versions: Version[] }>;

export async function exportZip(): Promise<Uint8Array> {
  const docs = await listDocs();
  const files: Record<string, Uint8Array> = {};
  const index: ArchiveIndex = [];
  for (const doc of docs) {
    const body = await readText(doc.id);
    const folder = doc.folder ? `${doc.folder}/` : "";
    let path: string;
    if (doc.format === "note") {
      path = `${folder}${safeName(doc.title)}.md`;
      files[path] = strToU8(body.text);
    } else {
      const base64 = await readFileBase64(doc.id);
      path = `${folder}${safeName(doc.fileName)}`;
      if (base64) files[path] = base64ToBytes(base64);
      else files[path] = strToU8(body.text);
    }
    index.push({ ...doc, path, versions: body.versions });
  }
  files["index.json"] = strToU8(JSON.stringify(index, null, 2));
  return zipSync(files);
}

// Imports a ZIP made by exportZip, or any ZIP with TXT, MD, PDF, DOCX or image files.
export async function importZip(bytes: Uint8Array): Promise<number> {
  const entries = unzipSync(bytes);
  let archive: ArchiveIndex = [];
  if (entries["index.json"]) {
    try {
      archive = JSON.parse(strFromU8(entries["index.json"])) as ArchiveIndex;
    } catch {
      archive = [];
    }
  }
  let imported = 0;
  for (const [path, content] of Object.entries(entries)) {
    if (path === "index.json" || path.endsWith("/") || path.startsWith("__MACOSX/")) continue;
    const name = path.split("/").pop() ?? path;
    const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    const known = archive.find((item) => item.path === path);
    const category = known?.category ?? "General Coaching";
    const tags = known?.tags ?? [];
    const lower = name.toLowerCase();

    if (lower.endsWith(".md")) {
      await saveDoc({
        title: known?.title ?? name.replace(/\.md$/i, ""),
        category,
        folder,
        tags,
        text: strFromU8(content),
      });
      imported += 1;
    } else if (detectFormat(name, "")) {
      if (content.byteLength > MAX_FILE_BYTES) continue;
      await addFile({ name, mimeType: "", bytes: content, category, folder, tags });
      imported += 1;
    }
  }
  return imported;
}
