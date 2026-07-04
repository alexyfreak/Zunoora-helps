import { motion } from "motion/react";

export function ModelToggle({
  value,
  onChange,
}: {
  value: "standard" | "deep";
  onChange: (v: "standard" | "deep") => void;
}) {
  const options: { id: "standard" | "deep"; label: string }[] = [
    { id: "standard", label: "Standard Output" },
    { id: "deep", label: "Deep Analysis" },
  ];
  return (
    <div className="relative inline-flex items-center rounded-full border border-[var(--hairline)] bg-[var(--surface)]/60 p-1 backdrop-blur-sm">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="relative z-10 px-4 py-1.5 text-xs tracking-wide transition-colors"
            style={{
              color: active ? "var(--carbon)" : "var(--muted-foreground)",
            }}
          >
            {active && (
              <motion.span
                layoutId="model-toggle-pill"
                className="absolute inset-0 -z-10 rounded-full bg-[var(--warm)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className={o.id === "deep" ? "serif-italic" : "font-medium"}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
