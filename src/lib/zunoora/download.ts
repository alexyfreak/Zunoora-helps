import JSZip from "jszip";
import type { Chat } from "./store";

function safeName(s: string) {
  return s.replace(/[^a-z0-9-_ ]/gi, "").trim() || "chat";
}

export async function downloadChatDocs(chat: Chat) {
  if (chat.documents.length === 0) return;
  const zip = new JSZip();
  chat.documents.forEach((d, i) => {
    const name = `${String(i + 1).padStart(2, "0")} — ${safeName(d.name)}.md`;
    zip.file(name, d.content);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(chat.title)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
