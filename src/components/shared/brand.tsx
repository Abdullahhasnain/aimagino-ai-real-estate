import { cn } from "@/lib/utils";

/** AImagino mark: a roofline over an "insight" node. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="hsl(var(--primary))" />
      <path d="M8 21.5 16 9l8 12.5" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.6 21.5h8.8" stroke="hsl(var(--primary-foreground))" strokeWidth="2.6" strokeLinecap="round" opacity=".55" />
      <circle cx="16" cy="17.2" r="2.1" fill="hsl(var(--primary-foreground))" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className="block whitespace-nowrap font-display text-[13.5px] font-extrabold tracking-tight">
            AImagino<span className="text-primary"> AI</span> Real Estate
          </span>
          <span className="mt-0.5 block text-[10.5px] font-medium text-muted-foreground">by AImagino Solution</span>
        </span>
      )}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-warm/30 bg-warm-soft px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-warm",
        className,
      )}
      title="Sales demonstration. All data is fictional sample data."
    >
      <span className="size-1.5 rounded-full bg-warm" />
      Demo mode
    </span>
  );
}
