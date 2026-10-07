import * as React from "react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  Flame,
  Loader2,
  MessagesSquare,
  Moon,
  Play,
  Repeat,
  Target,
  Timer,
  UserPlus,
  X,
  Zap,
  CircleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ScorePill, SourceTag, TempBadge } from "@/components/shared/lead-bits";
import { WorkflowStrip } from "@/components/shared/workflow";
import { PIPELINE_STEPS, agentById, useDemo, useKpis } from "@/store/demo-store";
import { CURRENT_USER } from "@/data/mock";
import { Link, useRouter } from "@/lib/router";
import { cn, formatAEDShort, formatRelativeDay, formatTime, isSameDay, timeAgo } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
  tone = "primary",
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  tone?: "primary" | "hot" | "success" | "warm";
}) {
  const [flash, setFlash] = React.useState(false);
  const prev = React.useRef(value);
  React.useEffect(() => {
    if (prev.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1600);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);
  const toneCls = { primary: "bg-primary-soft text-accent-foreground", hot: "bg-hot-soft text-hot", success: "bg-success-soft text-success", warm: "bg-warm-soft text-warm" }[tone];
  return (
    <Link to={to} className={cn("group rounded-2xl border bg-surface p-4 shadow-card transition-shadow hover:shadow-lift", flash && "animate-flash")}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-7 items-center justify-center rounded-lg", toneCls)}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="num mt-3 font-display text-[30px] font-extrabold leading-none">{value}</p>
      <p className="mt-2 text-[12px] text-muted-foreground">{hint}</p>
    </Link>
  );
}

function LivePipeline() {
  const { state, actions } = useDemo();
  const { navigate } = useRouter();
  const kpi = useKpis();
  const run = state.pipeline;
  const lead = run ? state.leads.find((l) => l.id === run.leadId) : undefined;
  const conv = run ? state.conversations.find((c) => c.leadId === run.leadId) : undefined;

  if (!run || !lead) {
    return (
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Lead pipeline</CardTitle>
            <CardDescription>Every enquiry follows the same automated path. Numbers update live as the demo runs.</CardDescription>
          </div>
          <Button size="sm" variant="soft" onClick={actions.simulateIncomingLead} className="hidden sm:inline-flex">
            <Play />
            Run a new lead through it
          </Button>
        </CardHeader>
        <CardContent>
          <WorkflowStrip
            counts={{
              lead: kpi.newLeads,
              ai: state.leads.length,
              qualify: kpi.qualified,
              score: `${kpi.hot} hot`,
              crm: kpi.qualified,
              follow: kpi.followUps,
              appt: kpi.appointments,
            }}
          />
          <Button size="sm" variant="soft" onClick={actions.simulateIncomingLead} className="mt-4 w-full sm:hidden">
            <Play />
            Run a new lead through it
          </Button>
        </CardContent>
      </Card>
    );
  }

  const done = run.step >= PIPELINE_STEPS.length - 1;
  const agent = agentById(lead.agentId);
  return (
    <Card className="overflow-hidden border-primary/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary-soft/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          {run.paused ? (
            <CircleAlert className="size-4 text-warm" />
          ) : done ? (
            <Check className="size-4 text-success" />
          ) : (
            <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative size-2.5 rounded-full bg-primary" /></span>
          )}
          <p className="text-[13.5px] font-semibold">
            {run.paused ? "Lead waiting: qualification automation is paused" : done ? "Lead fully processed by AI" : "Live: new enquiry being processed"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => navigate(`/app/leads/${lead.id}`)}>
            Open lead <ArrowRight />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={actions.dismissPipeline} aria-label="Dismiss">
            <X />
          </Button>
        </div>
      </div>
      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        <div className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={lead.name} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{lead.name}</p>
              <SourceTag source={lead.source} />
            </div>
            {run.step >= 3 && (
              <div className="text-right animate-fade-up">
                <p className="num font-display text-2xl font-extrabold leading-none">{lead.score.total}</p>
                <TempBadge t={lead.score.temperature} className="mt-1" />
              </div>
            )}
          </div>
          <ol className="flex flex-col gap-2.5">
            {PIPELINE_STEPS.map((s, idx) => {
              const state = idx <= run.step ? "done" : idx === run.step + 1 && !run.paused ? "active" : idx === run.step + 1 && run.paused ? "paused" : "todo";
              const detail =
                idx === 1 ? "Replied in 8 seconds" : idx === 3 && run.step >= 3 ? `${lead.score.total}/100 · ${lead.score.temperature.toUpperCase()}` : idx === 6 && agent ? `${agent.name} alerted on WhatsApp` : idx === 5 && run.step >= 5 ? "Tomorrow, same time" : null;
              return (
                <li key={s} className={cn("flex items-center gap-3 text-[13.5px] transition-opacity", state === "todo" && "opacity-40")}>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      state === "done" && "border-success bg-success text-white",
                      state === "active" && "border-primary text-primary",
                      state === "paused" && "border-warm text-warm",
                    )}
                  >
                    {state === "done" ? <Check className="size-3.5" /> : state === "active" ? <Loader2 className="size-3.5 animate-spin" /> : state === "paused" ? <Clock className="size-3.5" /> : <span className="size-1.5 rounded-full bg-border" />}
                  </span>
                  <span className="flex-1 font-medium">{s}</span>
                  {detail && state === "done" && <span className="text-[12px] text-muted-foreground">{detail}</span>}
                </li>
              );
            })}
          </ol>
          {run.paused && (
            <div className="mt-4 rounded-lg bg-warm-soft p-3 text-[12.5px] text-warm">
              Without automation this lead waits for a free agent.{" "}
              <Link to="/app/automations" className="font-semibold underline">Turn New Lead Qualification back on</Link>
            </div>
          )}
        </div>
        <div className="wa-pattern flex max-h-[340px] flex-col gap-2 overflow-y-auto border-t p-4 md:border-l md:border-t-0">
          {conv?.messages.map((m) => (
            <div key={m.id} className={cn("max-w-[88%] rounded-xl px-3 py-2 text-[13px] shadow-sm animate-fade-up", m.from === "lead" ? "self-start bg-surface" : "self-end bg-whatsapp-bubble")}>
              {m.from === "ai" && <p className="mb-0.5 text-[10.5px] font-semibold text-whatsapp">AI assistant</p>}
              {m.text}
              {m.extracted && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.extracted.map((c) => <span key={c} className="rounded bg-primary-soft px-1.5 py-0.5 text-[10.5px] font-medium text-accent-foreground">{c}</span>)}
                </div>
              )}
            </div>
          ))}
          {!done && !run.paused && (
            <div className="flex gap-1 self-end rounded-xl bg-whatsapp-bubble px-3 py-2.5">
              {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-typing rounded-full bg-foreground/50" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function OverviewPage() {
  const { state, actions } = useDemo();
  const { navigate } = useRouter();
  const kpi = useKpis();

  const pinned = ["l1", "l2", "l3"];
  const recent = [
    ...state.leads.filter((l) => l.id.startsWith("l_")), // leads created live during the demo
    ...pinned.map((id) => state.leads.find((l) => l.id === id)!).filter(Boolean),
    ...state.leads.filter((l) => ["l8", "l17", "l4"].includes(l.id)),
  ].slice(0, 6);

  const now = new Date();
  const upcoming = state.appointments
    .filter((a) => a.status !== "cancelled" && new Date(a.at) > now)
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, 3);
  const dueToday = state.followUps.filter((f) => f.status === "scheduled" && isSameDay(new Date(f.dueAt), now));

  const feed = state.leads
    .flatMap((l) => l.activity.filter((a) => a.kind !== "note").map((a) => ({ ...a, lead: l })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 7);

  const afterHours = state.leads.filter((l) => l.afterHours).length + 3;

  return (
    <>
      <PageHeader
        eyebrow={`${greeting()}, ${CURRENT_USER.name.split(" ")[0]} · ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
        title="Sales overview"
        description={`How the AI assistant handled enquiries for ${state.agencyName} over the last 7 days.`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/app/conversations/l1")}>
              <MessagesSquare />
              Watch an AI conversation
            </Button>
            <Button onClick={actions.simulateIncomingLead} className="sm:hidden">
              <Zap />
              Simulate new lead
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 [&>*:first-child]:col-span-2 md:[&>*:first-child]:col-span-1">
        <KpiCard label="New Leads" value={kpi.newLeads} hint="Last 7 days, all channels" icon={UserPlus} to="/app/leads" />
        <KpiCard label="Qualified Leads" value={kpi.qualified} hint={`${Math.round((kpi.qualified / kpi.newLeads) * 100)}% of new leads`} icon={Target} to="/app/leads" tone="success" />
        <KpiCard label="Hot Leads" value={kpi.hot} hint="Score 75 or higher" icon={Flame} to="/app/leads" tone="hot" />
        <KpiCard label="Appointments" value={kpi.appointments} hint="Upcoming, next 7 days" icon={CalendarCheck} to="/app/appointments" />
        <KpiCard label="Follow-ups" value={kpi.followUps} hint={`${dueToday.length} due today`} icon={Repeat} to="/app/follow-ups" tone="warm" />
      </div>

      <div className="mt-5">
        <LivePipeline />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent leads</CardTitle>
              <CardDescription>Qualified and scored by AI before an agent opens them.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/leads")}>
              View all <ArrowRight />
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            <ul className="divide-y">
              {recent.map((l) => (
                <li key={l.id}>
                  <Link to={`/app/leads/${l.id}`} className={cn("-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-subtle", state.flash[l.id] && "animate-flash")}>
                    <Avatar name={l.name} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate font-semibold">
                        {l.name}
                        {l.isNew && <Badge variant="primary">New</Badge>}
                      </p>
                      <p className="truncate text-[12.5px] text-muted-foreground">
                        {[l.interest.location, l.interest.bedrooms !== null ? (l.interest.bedrooms === 0 ? "Studio" : `${l.interest.bedrooms} Bedroom`) : null, l.interest.budget ? formatAEDShort(l.interest.budget) : null]
                          .filter(Boolean)
                          .join(" · ") || "Qualifying…"}
                      </p>
                    </div>
                    <div className="hidden sm:block"><ScorePill score={l.score.total} t={l.score.temperature} /></div>
                    <TempBadge t={l.score.temperature} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Coming up</CardTitle>
                <CardDescription>Viewings booked and follow-ups due today.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-3">
              {upcoming.map((a) => {
                const l = state.leads.find((x) => x.id === a.leadId);
                return (
                  <Link key={a.id} to="/app/appointments" className="flex items-center gap-3 rounded-xl border px-3 py-2.5 hover:bg-subtle">
                    <div className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-primary-soft py-1 text-accent-foreground">
                      <span className="text-[10px] font-semibold uppercase">{new Date(a.at).toLocaleDateString("en-US", { weekday: "short" })}</span>
                      <span className="num font-display text-base font-extrabold leading-tight">{new Date(a.at).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{l?.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{a.type} · {a.location} · {formatTime(a.at)}</p>
                    </div>
                    {a.bookedBy === "AI" && <Badge variant="primary">AI booked</Badge>}
                  </Link>
                );
              })}
              {dueToday.map((f) => {
                const l = state.leads.find((x) => x.id === f.leadId);
                return (
                  <Link key={f.id} to="/app/follow-ups" className="flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 hover:bg-subtle">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-warm-soft text-warm"><Repeat className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{l?.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">Follow-up · {formatRelativeDay(f.dueAt)}</p>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Handled by AI this week</CardTitle>
                <CardDescription>Demo data for illustration.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pt-3">
              {[
                { icon: MessagesSquare, v: String(state.conversations.length + 32), l: "Conversations handled" },
                { icon: Timer, v: "9s", l: "Average first reply" },
                { icon: Moon, v: String(afterHours), l: "After-hours enquiries answered" },
                { icon: Clock, v: `${((state.leads.length + 14) * 0.25).toFixed(1)}h`, l: "Agent time freed*" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-subtle p-3">
                  <s.icon className="size-4 text-muted-foreground" />
                  <p className="num mt-2 font-display text-xl font-extrabold leading-none">{s.v}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{s.l}</p>
                </div>
              ))}
              <p className="col-span-2 text-[11px] text-muted-foreground">*Estimate assuming 15 minutes of agent time per enquiry qualified by AI.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>AI activity</CardTitle>
            <CardDescription>Every action is logged to the lead's CRM record.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <ul className="flex flex-col">
            {feed.map((a) => (
              <li key={a.id} className="flex items-start gap-3 border-b py-2.5 last:border-0">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <p className="min-w-0 flex-1 text-[13px]">
                  <Link to={`/app/leads/${a.lead.id}`} className="font-semibold hover:underline">{a.lead.name}</Link>
                  <span className="text-muted-foreground"> · {a.text}</span>
                </p>
                <span className="shrink-0 text-[12px] text-muted-foreground">{timeAgo(a.at)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
