import * as React from "react";
import { cn, initials } from "@/lib/utils";

const AVATAR_TONES = [
  "bg-[hsl(234_70%_94%)] text-[hsl(234_60%_38%)] dark:bg-[hsl(234_35%_22%)] dark:text-[hsl(234_90%_84%)]",
  "bg-[hsl(170_45%_90%)] text-[hsl(172_60%_26%)] dark:bg-[hsl(172_30%_18%)] dark:text-[hsl(170_60%_72%)]",
  "bg-[hsl(28_80%_92%)] text-[hsl(24_70%_34%)] dark:bg-[hsl(24_35%_18%)] dark:text-[hsl(28_85%_72%)]",
  "bg-[hsl(280_50%_93%)] text-[hsl(282_45%_38%)] dark:bg-[hsl(282_25%_20%)] dark:text-[hsl(280_70%_82%)]",
  "bg-[hsl(200_60%_91%)] text-[hsl(204_65%_30%)] dark:bg-[hsl(204_35%_18%)] dark:text-[hsl(200_75%_76%)]",
];

export function Avatar({ name, className }: { name: string; className?: string }) {
  const tone = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
        tone,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Progress({ value, className, tone = "primary" }: { value: number; className?: string; tone?: "primary" | "hot" | "warm" | "cold" | "success" }) {
  const bar = { primary: "bg-primary", hot: "bg-hot", warm: "bg-warm", cold: "bg-cold", success: "bg-success" }[tone];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-subtle", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", bar)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-subtle", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-subtle text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Segmented / pill filter control */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  counts,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1", className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
              active ? "border-foreground bg-foreground text-background" : "bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {counts && counts[o.value] !== undefined && (
              <span className={cn("num text-[11px]", active ? "text-background/70" : "text-muted-foreground/70")}>{counts[o.value]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
