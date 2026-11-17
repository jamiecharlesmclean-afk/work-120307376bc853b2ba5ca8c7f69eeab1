import { Platform } from "react-native";

// Saves a file from the browser. Returns false on the phone, where file export
// is not wired up yet, so the caller can say so.
export function downloadFile(name: string, content: Uint8Array | string, type: string): boolean {
  if (Platform.OS !== "web" || typeof document === "undefined") return false;
  const blob = new Blob([content as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
