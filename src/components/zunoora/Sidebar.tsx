import { Plus, ArrowUpDown } from "lucide-react";
import { useZunoora } from "@/lib/zunoora/store";
import { HistoryList } from "./HistoryList";
import { DateFilterPopover } from "./DateFilterPopover";
import { SettingsDialog } from "./SettingsDialog";
import { AccountDialog } from "./AccountDialog";

export function Sidebar() {
  const newChat = useZunoora((s) => s.newChat);
  const filterFrom = useZunoora((s) => s.filterFrom);
  const filterTo = useZunoora((s) => s.filterTo);
  const setFilter = useZunoora((s) => s.setFilter);
  const sortDir = useZunoora((s) => s.sortDir);
  const setSort = useZunoora((s) => s.setSort);
  const credits = useZunoora((s) => s.credits);

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-[var(--hairline)] bg-[var(--sidebar)]">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-5 w-5 place-items-center">
          <div className="h-2.5 w-2.5 rotate-45 border border-[var(--warm)]" />
        </div>
        <span className="text-sm font-medium tracking-[0.2em] text-foreground">ZUNOORA</span>
      </div>

      {/* History header */}
      <div className="px-5 pb-2 pt-1">
        <div className="serif-italic text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          History
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 px-3 pb-2">
        <DateFilterPopover from={filterFrom} to={filterTo} onChange={setFilter} />
        <button
          onClick={() => setSort(sortDir === "newest" ? "oldest" : "newest")}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-transparent px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-[var(--surface-hover)] hover:text-foreground"
        >
          <ArrowUpDown className="h-3 w-3" strokeWidth={1.5} />
          <span className="capitalize">{sortDir}</span>
        </button>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        <HistoryList />
      </div>

      {/* Bottom */}
      <div className="border-t border-[var(--hairline)] p-2">
        <button
          onClick={() => newChat()}
          className="mb-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-[var(--surface-hover)]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span>New chat</span>
        </button>
        <SettingsDialog />
        <AccountDialog />
        <div className="mt-1 flex items-center justify-between rounded-md px-2.5 py-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rotate-45 bg-[var(--warm)]/70" />
            <span className="serif-italic">credits</span>
          </div>
          <span className="font-medium text-foreground tabular-nums">{credits}</span>
        </div>
      </div>
    </aside>
  );
}
