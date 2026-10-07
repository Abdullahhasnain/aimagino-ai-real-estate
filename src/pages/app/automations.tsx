import { ArrowRight, CalendarCheck, Moon, Repeat, Users, Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/store/demo-store";
import { cn, timeAgo } from "@/lib/utils";

const ICONS = { zap: Zap, repeat: Repeat, calendar: CalendarCheck, moon: Moon, users: Users };

const EFFECT: Record<string, string> = {
  w1: "Try it: pause this, then click Simulate new lead. The lead waits for an agent instead of getting an instant reply.",
  w2: "When paused, follow-ups stay in the queue until someone runs them.",
  w3: "When paused, the AI still qualifies leads but won't book viewings on its own.",
  w4: "Evening and weekend enquiries are answered and summarised for the team each morning.",
  w5: "Routes hot leads to the community specialist and alerts them on WhatsApp.",
};

export default function AutomationsPage() {
  const { state, actions } = useDemo();
  const active = state.workflows.filter((w) => w.active).length;
  const runs = state.workflows.reduce((a, w) => a + w.runsToday, 0);
  return (
    <>
      <PageHeader
        title="AI Automation Center"
        description="The workflows running for your team. Toggle any of them to see how the process changes."
        actions={<Button variant="outline" onClick={() => actions.toast({ title: "Workflow builder", description: "Custom workflows are configured with your team during setup." })}>Request a custom workflow</Button>}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { v: `${active}/${state.workflows.length}`, l: "Active workflows" },
          { v: runs, l: "Runs today" },
          { v: "0", l: "Errors today" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border bg-surface p-3.5 shadow-card">
            <p className="num font-display text-xl font-extrabold">{s.v}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {state.workflows.map((w) => {
          const Icon = ICONS[w.icon];
          return (
            <Card key={w.id} className={cn("p-5 transition-opacity", !w.active && "bg-subtle/40")}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", w.active ? "bg-primary-soft text-accent-foreground" : "bg-subtle text-muted-foreground")}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[16px] font-bold">{w.name}</h3>
                    <Badge variant={w.active ? "success" : "default"} className="uppercase tracking-wide">
                      <span className={cn("size-1.5 rounded-full", w.active ? "bg-success" : "bg-muted-foreground")} />
                      {w.active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[13.5px] text-muted-foreground">{w.description}</p>

                  <ol className="mt-4 flex flex-wrap items-center gap-y-2">
                    {w.steps.map((s, i) => (
                      <li key={s} className="flex items-center">
                        <span className={cn("rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium", i === 0 ? "border-foreground/20 bg-surface" : w.active ? "border-primary/25 bg-primary-soft/60 text-accent-foreground" : "bg-surface text-muted-foreground")}>
                          {s}
                        </span>
                        {i < w.steps.length - 1 && <ArrowRight className={cn("mx-1.5 size-3.5", w.active ? "text-primary" : "text-muted-foreground/60")} />}
                      </li>
                    ))}
                  </ol>

                  <p className="mt-3 text-[12px] text-muted-foreground">{EFFECT[w.id]}</p>
                </div>
                <div className="flex items-center justify-between gap-6 border-t pt-3 md:flex-col md:items-end md:border-0 md:pt-0">
                  <Switch id={`wf-${w.id}`} checked={w.active} onCheckedChange={() => actions.toggleWorkflow(w.id)} label={`${w.active ? "Pause" : "Activate"} ${w.name}`} />
                  <div className="text-right text-[12px] text-muted-foreground">
                    <p><span className="num font-mono font-semibold text-foreground">{w.runsToday}</span> runs today</p>
                    <p>Last run {timeAgo(w.lastRun)}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
