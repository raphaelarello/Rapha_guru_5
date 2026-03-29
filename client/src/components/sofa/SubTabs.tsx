import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SubTab = { key: string; label: string; icon?: ReactNode; badge?: ReactNode };

export function SubTabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: SubTab[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1", className)}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              "text-muted-foreground hover:text-foreground",
              active && "bg-accent text-accent-foreground",
            )}
          >
            {t.icon ? <span className="shrink-0">{t.icon}</span> : null}
            <span className="whitespace-nowrap">{t.label}</span>
            {t.badge ? <span className="ml-1">{t.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
