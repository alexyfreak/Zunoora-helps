import { useMemo } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Download, Trash2 } from "lucide-react";
import { useZunoora } from "@/lib/zunoora/store";
import { downloadChatDocs } from "@/lib/zunoora/download";

export function HistoryList() {
  const chats = useZunoora((s) => s.chats);
  const activeId = useZunoora((s) => s.activeChatId);
  const setActive = useZunoora((s) => s.setActive);
  const deleteChat = useZunoora((s) => s.deleteChat);
  const filterFrom = useZunoora((s) => s.filterFrom);
  const filterTo = useZunoora((s) => s.filterTo);
  const sortDir = useZunoora((s) => s.sortDir);

  const visible = useMemo(() => {
    let list = chats.slice();
    if (filterFrom) list = list.filter((c) => c.updatedAt >= filterFrom);
    if (filterTo) list = list.filter((c) => c.updatedAt <= filterTo + 86400000);
    list.sort((a, b) =>
      sortDir === "newest" ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt,
    );
    return list;
  }, [chats, filterFrom, filterTo, sortDir]);

  if (visible.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-[11px] text-muted-foreground/70">No chats yet</div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 px-2">
      {visible.map((c) => {
        const active = c.id === activeId;
        return (
          <div
            key={c.id}
            className={`group relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs transition-colors ${
              active
                ? "bg-[var(--surface-hover)] text-foreground"
                : "text-muted-foreground hover:bg-[var(--surface)] hover:text-foreground"
            }`}
            onClick={() => setActive(c.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{c.title || "Untitled"}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground/70">
                {formatDistanceToNowStrict(c.updatedAt, { addSuffix: true })}
                {c.documents.length > 0 && (
                  <span className="ml-2">
                    · {c.documents.length} doc{c.documents.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              {c.documents.length > 0 && (
                <button
                  aria-label="Download documents"
                  onClick={(e) => {
                    e.stopPropagation();
                    void downloadChatDocs(c);
                  }}
                  className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-[var(--carbon)] hover:text-foreground"
                >
                  <Download className="h-3 w-3" strokeWidth={1.5} />
                </button>
              )}
              <button
                aria-label="Delete chat"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(c.id);
                }}
                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-[var(--carbon)] hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
