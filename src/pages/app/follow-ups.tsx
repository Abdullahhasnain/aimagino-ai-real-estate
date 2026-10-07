import * as React from "react";
import { Bot, Check, CircleAlert, Clock, Loader2, Mail, MessageCircle, Phone, PlayCircle, Repeat, Send } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState, Segmented } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { TempBadge } from "@/components/shared/lead-bits";
import { FOLLOWUP_STEPS, agentById, useDemo } from "@/store/demo-store";
import { Link } from "@/lib/router";
import { cn, dueLabel, formatRelativeDay, isSameDay, timeAgo } from "@/lib/utils";
import type { FollowUp } from "@/types";

const CHANNEL_ICON = { WhatsApp: MessageCircle, Email: Mail, "Call task": Phone } as const;

const FILTERS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "done", label: "Sent" },
  { value: "all", label: "All" },
] as const;

function Timeline({ f }: { f: FollowUp }) {
  const { state } = useDemo();
  const lead = state.leads.find((l) => l.id === f.leadId);
  const agent = agentById(lead?.agentId);
  const details = [
    lead ? `${lead.source} · ${timeAgo(lead.createdAt)}` : "",
    "Replied in 9 seconds",
    lead ? `Score ${lead.score.total}/100 · ${lead.score.temperature.toUpperCase()}` : "",
    formatRelativeDay(f.dueAt),
    f.sentAt ? `${f.channel} · ${timeAgo(f.sentAt)}` : `${f.channel} message ready`,
    agent ? `${agent.name} via WhatsApp` : "Assigned agent",
  ];
  return (
    <ol className="flex flex-col">
      {FOLLOWUP_STEPS.map((s, idx) => {
        const active = f.status === "running" && idx === f.progress + 1;
        const reached = idx <= f.progress;
        return (
          <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
            {idx < FOLLOWUP_STEPS.length - 1 && (
              <span className={cn("absolute left-[13px] top-7 h-[calc(100%-20px)] w-px transition-colors duration-500", idx < f.progress ? "bg-success" : "bg-border")} />
            )}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-surface transition-colors duration-500",
                reached && !active && "border-success bg-success text-white",
                active && "border-primary text-primary",
              )}
            >
              {active ? <Loader2 className="size-3.5 animate-spin" /> : reached ? <Check className="size-3.5" /> : <span className="size-1.5 rounded-full bg-border" />}
            </span>
            <div className={cn("min-w-0 pt-0.5 transition-opacity", !reached && !active && "opacity-50")}>
              <p className="text-[13.5px] font-semibold">{s}</p>
              <p className="text-[12px] text-muted-foreground">{details[idx]}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function FollowUpsPage() {
  const { state, actions } = useDemo();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["value"]>("scheduled");
  const sorted = [...state.followUps].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const list = sorted.filter((f) => (filter === "all" ? true : filter === "scheduled" ? f.status === "scheduled" || f.status === "running" : f.status === "sent" || f.status === "replied"));
  const [selectedId, setSelectedId] = React.useState<string | undefined>(sorted[0]?.id);
  const selected = state.followUps.find((f) => f.id === selectedId) ?? list[0];
  const selLead = selected ? state.leads.find((l) => l.id === selected.leadId) : undefined;
  const auto = state.workflows.find((w) => w.id === "w2");
  const now = new Date();
  const dueToday = state.followUps.filter((f) => f.status === "scheduled" && (isSameDay(new Date(f.dueAt), now) || new Date(f.dueAt) < now));
  const [runningAll, setRunningAll] = React.useState(false);

  const runAll = async () => {
    setRunningAll(true);
    for (const f of dueToday) {
      setSelectedId(f.id);
      await actions.runFollowUp(f.id);
    }
    setRunningAll(false);
  };

  const sentToday = state.followUps.filter((f) => f.sentAt && isSameDay(new Date(f.sentAt), now)).length;
  const replied = state.followUps.filter((f) => f.status === "replied").length;

  return (
    <>
      <PageHeader
        title="Follow-ups"
        description="The AI follows up at the right time on the right channel, and tells the agent when a lead replies."
        actions={
          <Button onClick={runAll} disabled={!dueToday.length || runningAll} loading={runningAll}>
            {!runningAll && <PlayCircle />}
            Run all due today ({dueToday.length})
          </Button>
        }
      />

      {auto && !auto.active && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-warm/30 bg-warm-soft px-4 py-3 text-[13px] text-warm">
          <CircleAlert className="size-4" />
          <span className="flex-1">Follow-up Automation is paused. Follow-ups will only go out when someone runs them manually.</span>
          <Link to="/app/automations" className="font-semibold underline">Manage automations</Link>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Scheduled", v: state.followUps.filter((f) => f.status === "scheduled").length, icon: Clock },
          { l: "Due today", v: dueToday.length, icon: Repeat },
          { l: "Sent today", v: sentToday, icon: Send },
          { l: "Replies received", v: replied, icon: MessageCircle },
        ].map((s) => (
          <div key={s.l} className="flex items-center gap-3 rounded-xl border bg-surface p-3.5 shadow-card">
            <span className="flex size-9 items-center justify-center rounded-lg bg-subtle text-muted-foreground"><s.icon className="size-4" /></span>
            <div>
              <p className="num font-display text-xl font-extrabold leading-none">{s.v}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b p-4">
            <Segmented options={FILTERS} value={filter} onChange={setFilter} />
          </div>
          {list.length === 0 ? (
            <EmptyState icon={Check} title={filter === "scheduled" ? "All follow-ups sent" : "Nothing sent yet"} description={filter === "scheduled" ? "Every lead is up to date. New follow-ups appear here automatically." : "Run a follow-up to see it here."} />
          ) : (
            <ul className="divide-y">
              {list.map((f) => {
                const lead = state.leads.find((l) => l.id === f.leadId);
                if (!lead) return null;
                const Icon = CHANNEL_ICON[f.channel];
                const due = dueLabel(f.dueAt);
                const isSel = selected?.id === f.id;
                return (
                  <li key={f.id} className={cn("flex items-center gap-3 px-4 py-3.5 transition-colors", isSel ? "bg-primary-soft/50" : "hover:bg-subtle/60")}>
                    <button onClick={() => setSelectedId(f.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <Avatar name={lead.name} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate font-semibold">{lead.name} <TempBadge t={lead.score.temperature} /></p>
                        <p className="truncate text-[12.5px] text-muted-foreground">{f.reason}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[12px]">
                          <Icon className="size-3.5 text-muted-foreground" />
                          {f.status === "scheduled" ? (
                            <span className={cn("font-medium", due.tone === "warm" && "text-warm", due.tone === "danger" && "text-danger")}>Follow-up due: {due.label}</span>
                          ) : f.status === "running" ? (
                            <span className="font-medium text-primary">Sending…</span>
                          ) : (
                            <span className="font-medium text-success">{f.status === "replied" ? "Lead replied" : `Sent ${timeAgo(f.sentAt!)}`}</span>
                          )}
                        </p>
                      </div>
                    </button>
                    {f.status === "scheduled" || f.status === "running" ? (
                      <Button size="sm" variant={isSel ? "default" : "outline"} loading={f.status === "running"} onClick={() => { setSelectedId(f.id); void actions.runFollowUp(f.id); }}>
                        {f.status === "running" ? "Sending" : "Run Follow-up"}
                      </Button>
                    ) : (
                      <Badge variant="success"><Check />{f.status === "replied" ? "Replied" : "Sent"}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {selected && selLead ? (
          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Automation timeline</CardTitle>
                  <CardDescription>{selLead.name} · {selected.reason}</CardDescription>
                </div>
                <Badge variant={selected.status === "scheduled" ? "warm" : selected.status === "running" ? "primary" : "success"}>
                  {selected.status === "scheduled" ? "Scheduled" : selected.status === "running" ? "Running" : selected.status === "replied" ? "Replied" : "Completed"}
                </Badge>
              </CardHeader>
              <CardContent>
                <Timeline f={selected} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Message preview</CardTitle>
                  <CardDescription>Personalised by AI from the lead's requirements.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="wa-pattern rounded-xl p-3">
                  <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-md bg-whatsapp-bubble px-3.5 py-2.5 text-[13.5px] shadow-sm">
                    <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-whatsapp"><Bot className="size-3" />AI assistant · {selected.channel}</p>
                    {selected.message}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(selected.status === "scheduled" || selected.status === "running") && (
                    <Button onClick={() => actions.runFollowUp(selected.id)} loading={selected.status === "running"}>
                      {selected.status !== "running" && <Send />}
                      {selected.status === "running" ? "Sending follow-up…" : "Run Follow-up"}
                    </Button>
                  )}
                  <Link to={`/app/leads/${selLead.id}`} className="inline-flex h-9 items-center rounded-lg border border-input px-4 text-sm font-medium hover:bg-subtle">Open lead</Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </>
  );
}
