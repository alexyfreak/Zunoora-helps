import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { generateDocx } from "@/lib/zunoora/docx";
import { enhanceContent } from "@/lib/zunoora/aiEnhancer";
import { isAIConfigured } from "@/lib/zunoora/ai";

function renderMarkdown(md: string): string {
  // Tiny markdown → HTML for headings, bold, italic, hr, list, paragraphs.
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw;
    if (/^# (.+)/.test(line)) {
      if (inList) {
        out.push("</ol>");
        inList = false;
      }
      out.push(`<h1>${esc(line.slice(2))}</h1>`);
    } else if (/^## (.+)/.test(line)) {
      if (inList) {
        out.push("</ol>");
        inList = false;
      }
      out.push(`<h2>${esc(line.slice(3))}</h2>`);
    } else if (/^---\s*$/.test(line)) {
      if (inList) {
        out.push("</ol>");
        inList = false;
      }
      out.push("<hr/>");
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inList) {
        out.push("<ol>");
        inList = true;
      }
      out.push(`<li>${esc(line.replace(/^\d+\.\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      if (inList) {
        out.push("</ol>");
        inList = false;
      }
      out.push("");
    } else {
      if (inList) {
        out.push("</ol>");
        inList = false;
      }
      let h = esc(line);
      h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      h = h.replace(/\*(.+?)\*/g, "<em>$1</em>");
      h = h.replace(/^— /, "&mdash; ");
      out.push(`<p>${h}</p>`);
    }
  }
  if (inList) out.push("</ol>");
  return out.join("\n");
}

export function DocumentPane({ content, streaming }: { content: string; streaming: boolean }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    if (streaming && sheetRef.current) {
      sheetRef.current.scrollTo({
        top: sheetRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [content, streaming]);

  const handleEnhance = async () => {
    setEnhancing(true);
    const result = await enhanceContent(content, {});
    if (result) {
      setEnhanced(result);
    }
    setEnhancing(false);
  };

  const displayContent = enhanced ?? content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 160, damping: 24, delay: 0.15 }}
      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-6 py-10"
    >
      <div className="pointer-events-auto relative flex h-full max-h-[88vh] w-full max-w-[820px] flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="serif-italic text-xs tracking-[0.2em] text-muted-foreground">
            {streaming ? "Composing your document…" : "Document ready"}
          </div>
          <div className="flex items-center gap-3">
            {!streaming && (
              <>
                {isAIConfigured() && (
                  <button
                    onClick={handleEnhance}
                    disabled={enhancing}
                    className="serif-italic text-[11px] tracking-[0.15em] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors disabled:opacity-50"
                  >
                    {enhancing ? "Enhancing..." : "AI yaxshilash"}
                  </button>
                )}
                <button
                  onClick={() => generateDocx(displayContent, "document")}
                  className="serif-italic text-[11px] tracking-[0.15em] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
                >
                  Download .docx
                </button>
              </>
            )}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: streaming ? "60%" : "100%" }}
              transition={{
                duration: streaming ? 4 : 0.6,
                repeat: streaming ? Infinity : 0,
                repeatType: "reverse",
              }}
              className="ml-4 h-px flex-1 bg-gradient-to-r from-transparent via-[var(--warm)]/40 to-transparent"
              style={{ maxWidth: 240 }}
            />
          </div>
        </div>

        <div
          ref={sheetRef}
          className="paper-noise relative flex-1 overflow-y-auto rounded-sm bg-[#FAFAF7] px-14 py-14 text-[#1a1a1a] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7),0_8px_20px_rgba(0,0,0,0.4)]"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          <article
            className="prose-doc"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
          />
          {streaming && (
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-1 animate-pulse bg-[#1a1a1a]" />
          )}
          <style>{`
            .prose-doc h1 { font-size: 28px; font-weight: 400; margin: 0 0 18px; letter-spacing: -0.01em; }
            .prose-doc h2 { font-size: 17px; font-weight: 600; margin: 28px 0 10px; font-family: Inter, sans-serif; letter-spacing: 0.02em; text-transform: uppercase; color: #555; }
            .prose-doc p  { font-size: 15px; line-height: 1.75; margin: 0 0 12px; }
            .prose-doc ol { padding-left: 22px; margin: 0 0 14px; }
            .prose-doc li { font-size: 15px; line-height: 1.7; margin-bottom: 4px; }
            .prose-doc hr { border: 0; border-top: 1px solid #ddd; margin: 28px 0; }
            .prose-doc em { font-style: italic; color: #555; }
            .prose-doc strong { font-weight: 600; }
          `}</style>
        </div>
      </div>
    </motion.div>
  );
}
