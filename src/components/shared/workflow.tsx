import * as React from "react";
import { Bot, CalendarCheck, Database, Gauge, Inbox, ListChecks, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

export const CORE_FLOW = [
  { key: "lead", label: "New lead", icon: Inbox, detail: "Website, WhatsApp, Instagram, Facebook, portals" },
  { key: "ai", label: "AI conversation", icon: Bot, detail: "Instant reply, 24/7, in the lead's language" },
  { key: "qualify", label: "Qualification", icon: ListChecks, detail: "Budget, area, bedrooms, timeline, purpose" },
  { key: "score", label: "AI lead scoring", icon: Gauge, detail: "Hot, warm or cold with the reasons shown" },
  { key: "crm", label: "CRM record", icon: Database, detail: "Requirements and transcript saved automatically" },
  { key: "follow", label: "Follow-up", icon: Repeat, detail: "Timed reminders so no lead goes quiet" },
  { key: "appt", label: "Appointment", icon: CalendarCheck, detail: "Viewing booked into the agent's calendar" },
] as const;

/**
 * Horizontal workflow strip. Scrolls sideways on narrow screens.
 * `counts` shows live numbers under each stage (dashboard).
 * `active` highlights stages up to that index (animated demo).
 */
export function WorkflowStrip({
  counts,
  active,
  className,
  variant = "default",
}: {
  counts?: Partial<Record<(typeof CORE_FLOW)[number]["key"], number | string>>;
  active?: number;
  className?: string;
  variant?: "default" | "hero";
}) {
  return (
    <div className={cn("overflow-x-auto scrollbar-thin", className)}>
      <ol className="flex w-full min-w-max items-stretch gap-0">
        {CORE_FLOW.map((s, idx) => {
          const reached = active === undefined || idx <= active;
          const current = active !== undefined && idx === active;
          return (
            <React.Fragment key={s.key}>
              <li
                className={cn(
                  "flex min-w-[118px] flex-1 flex-col gap-2 rounded-xl border bg-surface p-3 transition-all duration-500",
                  variant === "hero" && "min-w-[108px]",
                  !reached && "opacity-45",
                  current && "border-primary/50 shadow-lift",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg transition-colors duration-500",
                    reached ? "bg-primary-soft text-accent-foreground" : "bg-subtle text-muted-foreground",
                    current && "animate-pulse-ring bg-primary text-primary-foreground",
                  )}
                >
                  <s.icon className="size-4" />
                </span>
                <span className="text-[12.5px] font-semibold leading-tight">{s.label}</span>
                {counts && counts[s.key] !== undefined && (
                  <span className="num font-display text-xl font-extrabold leading-none">{counts[s.key]}</span>
                )}
              </li>
              {idx < CORE_FLOW.length - 1 && (
                <li aria-hidden className="flex w-5 shrink-0 items-center justify-center">
                  <span className={cn("h-px w-full transition-colors duration-500", active === undefined || idx < active ? "bg-primary/60" : "bg-border")} />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}
