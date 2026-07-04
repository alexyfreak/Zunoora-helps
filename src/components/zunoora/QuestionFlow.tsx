import { useState, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

export function QuestionFlow({
  question,
  onAnswer,
}: {
  question: string;
  onAnswer: (answer: string) => void;
}) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, [question]);

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onAnswer(v);
    setValue("");
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="text-sm leading-relaxed text-foreground">
        <div className="serif-italic mb-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
          Zunoora —
        </div>
        <p>{question}</p>
      </div>
      <div className="flex items-end gap-2 rounded-2xl border border-[var(--hairline)] bg-[var(--surface)]/80 px-3 py-2.5 backdrop-blur-md">
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
          placeholder="Javobingizni yozing..."
          className="flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--warm)] text-[var(--carbon)] transition-opacity disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
