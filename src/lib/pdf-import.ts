import * as DocumentPicker from "expo-document-picker";
import { TrainingEntry } from "../components/training-library";

type PdfJs = {
  getDocument: (options: { data: Uint8Array }) => { promise: Promise<{
    numPages: number;
    getPage: (page: number) => Promise<{ getTextContent: () => Promise<{ items: Array<{ str?: string; hasEOL?: boolean }> }> }>;
  }> };
};

const MAX_PDF_BYTES = 20 * 1024 * 1024;

// Picks a PDF or CSV file. CSV files come back as text; PDFs are read into text.
export async function pickTrainingFile(): Promise<{ name: string; kind: "pdf" | "csv"; text: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "text/csv", "text/comma-separated-values"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > MAX_PDF_BYTES) throw new Error("Choose a file smaller than 20 MB.");

  let data: Uint8Array;
  if (asset.file) {
    data = new Uint8Array(await asset.file.arrayBuffer());
  } else {
    const response = await fetch(asset.uri);
    data = new Uint8Array(await response.arrayBuffer());
  }

  if (data.byteLength > MAX_PDF_BYTES) throw new Error("Choose a file smaller than 20 MB.");
  const isCsv = /\.csv$/i.test(asset.name) || asset.mimeType?.includes("csv") === true;
  if (isCsv) {
    return { name: asset.name, kind: "csv", text: new TextDecoder().decode(data) };
  }
  const text = await extractPdfText(data);
  return { name: asset.name, kind: "pdf", text };
}

// Reads the selectable text of a PDF. Scanned PDFs have none and throw.
export async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJs;
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 100); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => `${item.str ?? ""}${item.hasEOL ? "\n" : " "}`).join("").trim());
  }
  const text = pages.join("\n").replace(/[\t ]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  if (!text) throw new Error("No selectable text was found. Scanned PDFs need OCR before they can be imported.");
  return text;
}

export function entriesFromPdf(text: string, kind: "play" | "drill"): TrainingEntry[] {
  const chunks = text.split(/\n\s*\n|(?=\n\s*(?:play|drill)\s*\d*\s*[:.-])/i).map((chunk) => chunk.replace(/\s+/g, " ").trim()).filter(Boolean);
  const sentences = text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter(Boolean);
  const source = chunks.length > 1 ? chunks : Array.from({ length: Math.ceil(sentences.length / 4) }, (_, index) => sentences.slice(index * 4, index * 4 + 4).join(" "));

  return source.map((chunk, index) => {
    const parts = chunk.split(/(?<=[.!?])\s+/).filter(Boolean);
    const rawTitle = (parts[0] ?? `Imported ${kind} ${index + 1}`).replace(/^(?:play|drill)\s*\d*\s*[:.-]?\s*/i, "");
    const name = rawTitle.length > 68 ? `${rawTitle.slice(0, 65).trim()}...` : rawTitle;
    const detail = parts.slice(name === parts[0] ? 1 : 0).join(" ").trim() || chunk;
    const sentences = detail.split(/(?<=[.!?])\s+/).filter(Boolean);
    const splitAt = Math.max(1, Math.ceil(sentences.length * 0.6));
    const setup = sentences.slice(0, Math.min(splitAt, 2)).join(" ").slice(0, 400) || "Imported from PDF. Review the instructions and adjust the setup for your team.";
    const remaining = sentences.slice(Math.min(splitAt, 2));
    const stepText = remaining.length ? remaining : sentences.slice(2);
    return {
      name: name || `${kind === "play" ? "Play" : "Drill"} ${index + 1}`,
      category: "Imported from PDF",
      summary: (sentences[0] ?? "Imported coaching note").slice(0, 140),
      time: "10 MIN",
      setup,
      steps: (stepText.length ? stepText : [detail]).slice(0, 8).map((step) => step.slice(0, 320)),
      coaching: "Review this imported material and adapt the coaching cues for your team.",
    };
  }).filter((entry) => entry.name.length > 0).slice(0, 40);
}
