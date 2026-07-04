import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function DateFilterPopover({
  from,
  to,
  onChange,
}: {
  from: number | null;
  to: number | null;
  onChange: (from: number | null, to: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const label =
    from && to
      ? `${format(from, "MMM d")} – ${format(to, "MMM d")}`
      : from
        ? `From ${format(from, "MMM d")}`
        : "Any date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-transparent px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-[var(--surface-hover)] hover:text-foreground",
          )}
        >
          <CalendarIcon className="h-3 w-3" strokeWidth={1.5} />
          <span>{label}</span>
          {from && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null, null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onChange(null, null);
                }
              }}
              className="ml-1 grid h-3.5 w-3.5 cursor-pointer place-items-center rounded-sm hover:bg-[var(--surface)]"
              aria-label="Clear date filter"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={{
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
          }}
          onSelect={(range) => {
            onChange(
              range?.from ? range.from.getTime() : null,
              range?.to ? range.to.getTime() : null,
            );
          }}
          numberOfMonths={1}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
