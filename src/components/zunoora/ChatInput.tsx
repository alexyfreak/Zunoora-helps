import { useEffect, useRef, useState } from "react";
import { Paperclip, ArrowUp, X } from "lucide-react";

export function ChatInput({
  onSend,
  compact = false,
  disabled = false,
}: {
  onSend: (text: string) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) taRef.current?.focus();
  }, [disabled]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, compact ? 100 : 180) + "px";
  }, [value, compact]);

  const submit = () => {
    const v = value.trim();
    if (!v || disabled) return;
    onSend(v);
    setValue("");
    setFile(null);
  };

  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface)]/80 backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]">
      {file && (
        <div className="flex items-center gap-2 px-4 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface-hover)] px-2 py-1">
            <Paperclip className="h-3 w-3" strokeWidth={1.5} />
            <span className="max-w-[160px] truncate">{file}</span>
            <button onClick={() => setFile(null)} aria-label="Remove file">
              <X className="h-3 w-3 opacity-70 hover:opacity-100" />
            </button>
          </span>
        </div>
      )}
      <div className="flex items-end gap-2 px-3 py-2.5">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f.name);
            e.target.value = "";
          }}
        />
        <button
          aria-label="Attach file"
          onClick={() => fileRef.current?.click()}
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--surface-hover)] hover:text-foreground"
        >
          <Paperclip className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={
            compact ? "Refine or ask…" : "Ask Zunoora to draft a lesson, quiz, or report…"
          }
          className="flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          style={{ maxHeight: compact ? 100 : 180 }}
        />
        <button
          aria-label="Send"
          onClick={submit}
          disabled={!value.trim() || disabled}
          className="grid h-9 w-9 place-items-center rounded-full bg-[var(--warm)] text-[var(--carbon)] transition-opacity disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
