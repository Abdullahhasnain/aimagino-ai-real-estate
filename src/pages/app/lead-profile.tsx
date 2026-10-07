import * as React from "react";
import {
  ArrowLeft,
  Bot,
  CalendarCheck,
  CalendarPlus,
  Copy,
  Database,
  Gauge,
  Inbox,
  ListChecks,
  Mail,
  MessageCircle,
  Phone,
  Repeat,
  Send,
  Sparkles,
  StickyNote,
  UserCheck,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { SourceTag, StatusBadge, TempBadge } from "@/components/shared/lead-bits";
import { ScoreBreakdown } from "@/components/shared/score";
import { PropertyMatches } from "@/components/shared/property";
import { AssignAgentDialog, FollowUpDialog, ScheduleDialog } from "@/components/shared/dialogs";
import { agentById, propertyById, useDemo } from "@/store/demo-store";
import { Link, useRouter } from "@/lib/router";
import { cn, formatAED, formatRelativeDay, timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/types";

const ACTIVITY_ICON: Record<ActivityItem["kind"], React.ComponentType<{ className?: string }>> = {
  created: Inbox,
  ai: Bot,
  qualified: ListChecks,
  scored: Gauge,
  crm: Database,
  followup: Repeat,
  appointment: CalendarCheck,
  agent: UserCheck,
  note: StickyNote,
};

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-[13.5px] font-medium", mono && "num font-mono text-[13px]")}>{value ?? <span className="text-muted-foreground">Not captured</span>}</dd>
    </div>
  );
}

export default function LeadProfilePage({ id }: { id: string }) {
  const { state, actions } = useDemo();
  const { navigate } = useRouter();
  const [dialog, setDialog] = React.useState<null | "schedule" | "followup" | "assign">(null);
  const lead = state.leads.find((l) => l.id === id);

  if (!lead) {
    return (
      <EmptyState
        icon={UserX}
        title="Lead not found"
        description="It may have been removed when the demo data was reset."
        action={<Button onClick={() => navigate("/app/leads")}>Back to leads</Button>}
        className="py-24"
      />
    );
  }

  const i = lead.interest;
  const agent = agentById(lead.agentId);
  const appts = state.appointments.filter((a) => a.leadId === lead.id && a.status !== "cancelled").sort((a, b) => a.at.localeCompare(b.at));
  const fus = state.followUps.filter((f) => f.leadId === lead.id).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const interestText =
    [i.bedrooms === null ? null : i.bedrooms === 0 ? "Studio" : `${i.bedrooms} Bedroom`, i.propertyType ?? null].filter(Boolean).join(" ") || null;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      actions.toast({ title: `${label} copied`, description: text });
    } catch {
      actions.toast({ title: label, description: text });
    }
  };

  const contact = () => {
    actions.ensureConversation(lead.id);
    navigate(`/app/conversations/${lead.id}`);
  };

  const hot = lead.score.temperature === "hot";
  const primaryActionForRec = appts.length ? () => setDialog("followup") : hot ? () => setDialog("schedule") : () => setDialog("followup");

  return (
    <>
      <Link to="/app/leads" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        All leads
      </Link>

      {/* Header */}
      <Card className="mb-5">
        <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={lead.name} className="size-14 text-base" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-extrabold leading-tight">{lead.name}</h1>
                <TempBadge t={lead.score.temperature} size="lg" />
                <StatusBadge status={lead.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                <button onClick={() => copy(lead.phone, "Phone number")} className="inline-flex items-center gap-1.5 hover:text-foreground"><Phone className="size-3.5" />{lead.phone}<Copy className="size-3 opacity-60" /></button>
                <button onClick={() => copy(lead.email, "Email")} className="inline-flex items-center gap-1.5 hover:text-foreground"><Mail className="size-3.5" />{lead.email}<Copy className="size-3 opacity-60" /></button>
                <SourceTag source={lead.source} />
                <span>Created {timeAgo(lead.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button onClick={contact}><MessageCircle />Contact Lead</Button>
            <Button variant="outline" onClick={() => setDialog("schedule")}><CalendarPlus />Schedule Viewing</Button>
            <Button variant="outline" onClick={() => setDialog("followup")}><Send />Send Follow-up</Button>
            <Button variant="outline" onClick={() => setDialog("assign")}><UserCheck />Assign Agent</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* AI summary + recommendation */}
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="bg-primary-soft/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <CardTitle>AI Qualification Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-[14px] leading-relaxed">{lead.summary}</p>
                <p className="mt-3 text-[11.5px] text-muted-foreground">Generated from the conversation transcript · updated {timeAgo(lead.lastContact)}</p>
              </CardContent>
            </Card>
            <Card className={cn(hot && "border-hot/30")}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="size-4 text-primary" />
                  <CardTitle>AI Recommended Action</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex h-[calc(100%-44px)] flex-col justify-between gap-4 pt-3">
                <p className="text-[15px] font-semibold leading-snug">{lead.recommendedAction}</p>
                <Button size="sm" variant={hot ? "default" : "soft"} onClick={primaryActionForRec} className="self-start">
                  {appts.length ? <><Send />Send shortlist</> : hot ? <><CalendarPlus />Schedule viewing</> : <><Send />Send listings</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Lead details</CardTitle>
                <CardDescription>Captured automatically by AI from the conversation. Synced to the CRM record.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Field label="Name" value={lead.name} />
                <Field label="Phone" value={lead.phone} mono />
                <Field label="Email" value={<span className="break-all">{lead.email}</span>} />
                <Field label="Source" value={lead.source} />
                <Field label="Interest" value={interestText} />
                <Field label="Location" value={i.location} />
                <Field label="Budget" value={i.budget ? formatAED(i.budget) + (i.intent === "Rent" ? " / year" : "") : null} mono />
                <Field label="Buy or rent" value={i.intent} />
                <Field label="Purpose" value={i.purpose} />
                <Field label="Timeline" value={i.timeline} />
                <Field label="Financing" value={i.financing && i.financing !== "Not discussed" ? i.financing : null} />
                <Field label="Language" value={lead.language} />
              </dl>
              {i.preferences.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t pt-4">
                  <span className="mr-1 text-[12px] text-muted-foreground">Preferences</span>
                  {i.preferences.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property matching */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>AI Property Matches</CardTitle>
                <CardDescription>Best-fit listings from your inventory for {lead.name.split(" ")[0]}'s requirements.</CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate("/app/properties")}>Inventory</Button>
            </CardHeader>
            <CardContent>
              <PropertyMatches interest={i} />
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>CRM activity</CardTitle>
                <CardDescription>Everything the AI and your team did on this lead.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="relative flex flex-col gap-4 pl-1">
                {[...lead.activity].reverse().map((a, idx, arr) => {
                  const Icon = ACTIVITY_ICON[a.kind];
                  return (
                    <li key={a.id} className="relative flex gap-3">
                      {idx < arr.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-4px)] w-px bg-border" />}
                      <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-surface text-muted-foreground"><Icon className="size-3.5" /></span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[13.5px]">{a.text}</p>
                        <p className="text-[11.5px] text-muted-foreground">{timeAgo(a.at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>AI Lead Score</CardTitle>
                <CardDescription>How this lead was prioritised.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown score={lead.score} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned agent</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setDialog("assign")}>{agent ? "Change" : "Assign"}</Button>
            </CardHeader>
            <CardContent>
              {agent ? (
                <div className="flex items-center gap-3">
                  <Avatar name={agent.name} />
                  <div>
                    <p className="text-[14px] font-semibold">{agent.name}</p>
                    <p className="text-[12.5px] text-muted-foreground">{agent.role} · {agent.focus}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-warm-soft p-3 text-[13px] text-warm">Not assigned yet. Hot leads are routed automatically when Hot Lead Routing is on.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {appts.map((a) => (
                <Link key={a.id} to="/app/appointments" className="flex items-center gap-3 rounded-xl border p-3 hover:bg-subtle">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-success-soft text-success"><CalendarCheck className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">{a.type}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{formatRelativeDay(a.at)} · {propertyById(a.propertyId)?.building ?? a.location}</p>
                  </div>
                  {a.bookedBy === "AI" && <Badge variant="primary">AI booked</Badge>}
                </Link>
              ))}
              {fus.map((f) => (
                <Link key={f.id} to="/app/follow-ups" className="flex items-center gap-3 rounded-xl border border-dashed p-3 hover:bg-subtle">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-warm-soft text-warm"><Repeat className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold">{f.reason}</p>
                    <p className="text-[12px] text-muted-foreground">{f.channel} · {f.status === "scheduled" ? formatRelativeDay(f.dueAt) : f.status === "replied" ? "Lead replied" : f.status === "sent" ? "Sent" : "Sending…"}</p>
                  </div>
                  <Badge variant={f.status === "scheduled" ? "warm" : "success"}>{f.status === "scheduled" ? "Scheduled" : f.status === "replied" ? "Replied" : "Sent"}</Badge>
                </Link>
              ))}
              {appts.length === 0 && fus.length === 0 && (
                <p className="py-4 text-center text-[13px] text-muted-foreground">No appointments or follow-ups yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ScheduleDialog open={dialog === "schedule"} onClose={() => setDialog(null)} leadId={lead.id} />
      <FollowUpDialog open={dialog === "followup"} onClose={() => setDialog(null)} leadId={lead.id} />
      <AssignAgentDialog open={dialog === "assign"} onClose={() => setDialog(null)} currentId={lead.agentId} onAssign={(a) => actions.assignAgent(lead.id, a)} />
    </>
  );
}
