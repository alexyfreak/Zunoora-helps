import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";
import type { Message } from "@/lib/zunoora/store";

export function ChatTranscript({
  messages,
  thinking,
  compact = false,
}: {
  messages: Message[];
  thinking?: boolean;
  compact?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, thinking]);

  if (messages.length === 0 && !thinking) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="serif-italic text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
          Zunoora
        </div>
        <h1 className="mt-3 text-2xl font-medium tracking-tight text-foreground">
          What shall we draft today?
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          A lesson plan, a quiz, a parent update — describe the moment, and a document will compose
          itself on the desk.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className={`mx-auto flex flex-col gap-4 ${compact ? "" : "max-w-2xl"}`}>
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={m.role === "user" ? "self-end" : "self-start w-full"}
          >
            {m.role === "user" ? (
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--surface-hover)] px-4 py-2.5 text-sm text-foreground">
                {m.content}
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-foreground">
                <div className="serif-italic mb-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
                  Zunoora —
                </div>
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: m.content.replace(
                      /\*\*(.+?)\*\*/g,
                      '<span class="text-[var(--warm)]">$1</span>',
                    ),
                  }}
                />
              </div>
            )}
          </motion.div>
        ))}
        <AnimatePresence>
          {thinking && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="self-start"
            >
              <div className="serif-italic text-xs tracking-wide text-muted-foreground">
                composing
                <span className="ml-1 inline-flex gap-1">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-muted-foreground" />
                  <span className="h-1 w-1 animate-pulse rounded-full bg-muted-foreground [animation-delay:120ms]" />
                  <span className="h-1 w-1 animate-pulse rounded-full bg-muted-foreground [animation-delay:240ms]" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
