import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

function safeName(s: string) {
  return s.replace(/[^a-z0-9-_ ]/gi, "").trim() || "document";
}

export async function generateDocx(content: string, filename = "document"): Promise<void> {
  const lines = content.split("\n");
  const children: Paragraph[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      children.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    if (/^# (.+)/.test(line)) {
      children.push(
        new Paragraph({
          text: line.slice(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
      );
    } else if (/^## (.+)/.test(line)) {
      children.push(
        new Paragraph({
          text: line.slice(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 160 },
        }),
      );
    } else if (/^---\s*$/.test(line)) {
      children.push(
        new Paragraph({
          text: "────────────────────────────────",
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        }),
      );
    } else if (/^\d+\.\s+/.test(line)) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^\d+\.\s+/, ""),
              size: 22,
            }),
          ],
          indent: { left: 400, hanging: 200 },
          spacing: { after: 60 },
        }),
      );
    } else {
      // Handle bold/italic
      const parts: { text: string; bold?: boolean; italics?: boolean }[] = [];
      let remaining = line;
      while (remaining) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const italicMatch = remaining.match(/\*(.+?)\*/);
        const nextBold = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
        const nextItalic = italicMatch ? remaining.indexOf(italicMatch[0]) : -1;

        if (nextBold === -1 && nextItalic === -1) {
          parts.push({ text: remaining });
          break;
        }

        const next =
          nextBold !== -1 && (nextItalic === -1 || nextBold < nextItalic)
            ? boldMatch!
            : italicMatch!;
        const isBold = next === boldMatch;
        const idx = remaining.indexOf(next[0]);

        if (idx > 0) {
          parts.push({ text: remaining.slice(0, idx) });
        }
        parts.push({ text: next[1], bold: isBold, italics: !isBold });
        remaining = remaining.slice(idx + next[0].length);
      }

      children.push(
        new Paragraph({
          children: parts.map(
            (p) =>
              new TextRun({
                text: p.text,
                bold: p.bold,
                italics: p.italics,
                size: 22,
              }),
          ),
          spacing: { after: 120 },
        }),
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(filename)}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
