import { motion, AnimatePresence } from "motion/react";
import { Maximize2 } from "lucide-react";
import { ChatTranscript } from "./ChatTranscript";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/lib/zunoora/store";

export function ChatPanel({
  mode,
  messages,
  thinking,
  onSend,
  onExpand,
}: {
  mode: "center" | "corner";
  messages: Message[];
  thinking: boolean;
  onSend: (text: string) => void;
  onExpand: () => void;
}) {
  const compact = mode === "corner";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 180, damping: 26 }}
      className={
        compact
          ? "fixed bottom-6 right-6 z-30 flex h-[460px] w-[380px] flex-col overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--carbon)]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
          : "relative z-10 flex h-[72vh] w-full max-w-2xl flex-col"
      }
    >
      <AnimatePresence>
        {compact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between border-b border-[var(--hairline)] px-4 py-2.5"
          >
            <div className="serif-italic text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Conversation
            </div>
            <button
              onClick={onExpand}
              aria-label="Expand chat"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[var(--surface-hover)] hover:text-foreground"
            >
              <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="flex min-h-0 flex-1 flex-col">
        <ChatTranscript messages={messages} thinking={thinking} compact={compact} />
        <motion.div layout className={compact ? "px-3 pb-3" : "px-2 pb-2 pt-3"}>
          <ChatInput onSend={onSend} compact={compact} disabled={thinking} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
