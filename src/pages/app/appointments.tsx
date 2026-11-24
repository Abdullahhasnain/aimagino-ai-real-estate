import * as React from "react";
import { Bot, CalendarClock, CalendarPlus, CalendarX, ChevronLeft, ChevronRight, Clock, MapPin, UserCheck, X } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState, Segmented } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { TempBadge } from "@/components/shared/lead-bits";
import { AssignAgentDialog, RescheduleDialog, ScheduleDialog } from "@/components/shared/dialogs";
import { agentById, propertyById, useDemo } from "@/store/demo-store";
import { Link } from "@/lib/router";
import { cn, formatAEDShort, formatTime, isSameDay } from "@/lib/utils";
import type { Appointment } from "@/types";

const HOURS = Array.from({ length: 12 }, (_, i) => 9 + i); // 9:00 – 20:00
const ROW = 52; // px per hour

const TYPE_TONE: Record<Appointment["type"], string> = {
  "Property Viewing": "border-l-primary bg-primary-soft text-accent-foreground",
  "Property Consultation": "border-l-success bg-success-soft text-success",
  "Video Call": "border-l-warm bg-warm-soft text-warm",
  "Off-plan Presentation": "border-l-cold bg-cold-soft text-cold",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function googleCalendarUrl(a: Appointment, title: string, details: string) {
  const start = new Date(a.at);
  const end = new Date(start.getTime() + a.durationMin * 60_000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const query = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${stamp(start)}/${stamp(end)}`, location: a.location, details });
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export default function AppointmentsPage() {
  const { state, actions } = useDemo();
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [view, setView] = React.useState<"week" | "list">("week");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [rescheduling, setRescheduling] = React.useState<Appointment | null>(null);
  const [assigning, setAssigning] = React.useState<Appointment | null>(null);
  const [confirmCancel, setConfirmCancel] = React.useState(false);

  const start = startOfDay(new Date());
  start.setDate(start.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const end = new Date(days[6]!);
  end.setHours(23, 59);

  const visible = state.appointments.filter((a) => a.status !== "cancelled");
  const inRange = visible.filter((a) => new Date(a.at) >= start && new Date(a.at) <= end);
  const upcoming = [...state.appointments].filter((a) => new Date(a.at).getTime() > Date.now() - 3_600_000).sort((a, b) => a.at.localeCompare(b.at));
  const selected = state.appointments.find((a) => a.id === selectedId) ?? null;

  React.useEffect(() => {
    setConfirmCancel(false);
    if (selectedId && window.innerWidth < 1280) document.getElementById("appt-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedId]);

  const Detail = ({ a }: { a: Appointment }) => {
    const lead = state.leads.find((l) => l.id === a.leadId);
    const agent = agentById(a.agentId);
    const prop = propertyById(a.propertyId);
    const cancelled = a.status === "cancelled";
    return (
      <Card id="appt-detail" className="scroll-mt-20 animate-fade-up">
        <CardHeader>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={cancelled ? "default" : a.status === "pending" ? "warm" : "success"}>{cancelled ? "Cancelled" : a.status === "pending" ? "Awaiting confirmation" : "Confirmed"}</Badge>
              {a.bookedBy === "AI" && <Badge variant="primary"><Bot />Booked by AI</Badge>}
            </div>
            <CardTitle className="mt-2 text-[17px]">{a.type}</CardTitle>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={() => setSelectedId(null)} aria-label="Close details"><X /></Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {lead && (
            <Link to={`/app/leads/${lead.id}`} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-subtle">
              <Avatar name={lead.name} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{lead.name}</p>
                <p className="truncate text-[12px] text-muted-foreground">{lead.phone}</p>
              </div>
              <TempBadge t={lead.score.temperature} />
            </Link>
          )}
          <dl className="grid gap-3 text-[13.5px]">
            <div className="flex items-center gap-2.5"><Clock className="size-4 text-muted-foreground" /><span className={cn(cancelled && "line-through")}>{new Date(a.at).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}, {formatTime(a.at)} · {a.durationMin} min</span></div>
            <div className="flex items-center gap-2.5"><MapPin className="size-4 text-muted-foreground" />{prop ? `${prop.building}, ${prop.community}` : a.location}</div>
            <div className="flex items-center gap-2.5"><UserCheck className="size-4 text-muted-foreground" />{agent?.name} · {agent?.role}</div>
          </dl>
          {prop && (
            <div className="rounded-lg bg-subtle px-3 py-2 text-[12.5px]">
              Viewing unit <span className="font-mono">{prop.ref}</span> · {prop.bedrooms}BR · {formatAEDShort(prop.price)}
            </div>
          )}
          {!cancelled && (
            confirmCancel ? (
              <div className="rounded-xl border border-danger/30 bg-danger-soft p-3">
                <p className="text-[13px] font-medium text-danger">Cancel this appointment? {lead?.name.split(" ")[0]} will be notified on WhatsApp.</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => { actions.cancelAppointment(a.id); setConfirmCancel(false); }}>Yes, cancel</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)}>Keep it</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => window.open(googleCalendarUrl(a, `${a.type} · ${lead?.name ?? "Property lead"}`, prop ? `${prop.building}, ${prop.community} · ${prop.ref}` : a.location), "_blank", "noopener,noreferrer")}><CalendarPlus />Add to Google</Button>
                <Button size="sm" variant="outline" onClick={() => setRescheduling(a)}><CalendarClock />Reschedule</Button>
                <Button size="sm" variant="outline" onClick={() => setAssigning(a)}><UserCheck />Assign</Button>
                <Button size="sm" variant="destructive" onClick={() => setConfirmCancel(true)}><CalendarX />Cancel</Button>
              </div>
            )
          )}
        </CardContent>
      </Card>
    );
  };

  const nowLine = (d: Date) => {
    const n = new Date();
    if (!isSameDay(d, n)) return null;
    const top = (n.getHours() + n.getMinutes() / 60 - HOURS[0]!) * ROW;
    if (top < 0 || top > HOURS.length * ROW) return null;
    return <div className="pointer-events-none absolute inset-x-0 z-10 h-px bg-hot" style={{ top }}><span className="absolute -left-1 -top-1 size-2 rounded-full bg-hot" /></div>;
  };

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Viewings and consultations booked by the AI or your team, synced to each agent's calendar."
        actions={<Button onClick={() => setScheduleOpen(true)}><CalendarPlus />Schedule appointment</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div className="flex items-center gap-2">
              <Button size="icon-sm" variant="outline" onClick={() => setWeekOffset((w) => w - 1)} disabled={weekOffset <= 0} aria-label="Previous week"><ChevronLeft /></Button>
              <Button size="icon-sm" variant="outline" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week"><ChevronRight /></Button>
              <p className="ml-1 text-[14px] font-semibold">
                {days[0]!.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {days[6]!.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              {weekOffset !== 0 && <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)}>Today</Button>}
            </div>
            <Segmented options={[{ value: "week", label: "Week" }, { value: "list", label: "List" }] as const} value={view} onChange={setView} />
          </div>

          {view === "week" ? (
            <>
              {/* Desktop week grid */}
              <div className="hidden overflow-x-auto md:block">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b">
                    <div />
                    {days.map((d) => {
                      const today = isSameDay(d, new Date());
                      return (
                        <div key={d.toISOString()} className="border-l px-2 py-2 text-center">
                          <p className="text-[11px] font-semibold uppercase text-muted-foreground">{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
                          <p className={cn("num mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full font-display text-[15px] font-bold", today && "bg-primary text-primary-foreground")}>{d.getDate()}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
                    <div>
                      {HOURS.map((h) => (
                        <div key={h} className="relative text-right" style={{ height: ROW }}>
                          <span className="absolute -top-2 right-2 font-mono text-[10.5px] text-muted-foreground">{h > 12 ? h - 12 : h}{h >= 12 ? "pm" : "am"}</span>
                        </div>
                      ))}
                    </div>
                    {days.map((d) => (
                      <div key={d.toISOString()} className="relative border-l" style={{ height: HOURS.length * ROW }}>
                        {HOURS.map((h) => <div key={h} className="border-b border-dashed border-border/70" style={{ height: ROW }} />)}
                        {nowLine(d)}
                        {inRange
                          .filter((a) => isSameDay(new Date(a.at), d))
                          .map((a) => {
                            const t = new Date(a.at);
                            const top = (t.getHours() + t.getMinutes() / 60 - HOURS[0]!) * ROW;
                            const lead = state.leads.find((l) => l.id === a.leadId);
                            return (
                              <button
                                key={a.id}
                                onClick={() => setSelectedId(a.id)}
                                className={cn(
                                  "absolute inset-x-1 z-20 overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11.5px] leading-tight shadow-sm transition-transform hover:scale-[1.02]",
                                  TYPE_TONE[a.type],
                                  selectedId === a.id && "ring-2 ring-ring",
                                  a.status === "pending" && "border-dashed opacity-90",
                                )}
                                style={{ top: Math.max(0, top) + 1, height: Math.max(34, (a.durationMin / 60) * ROW - 3) }}
                              >
                                <span className="block truncate font-semibold text-foreground">{lead?.name}</span>
                                <span className="block truncate">{formatTime(a.at)} · {a.type.replace("Property ", "")}</span>
                              </button>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile agenda */}
              <div className="flex flex-col md:hidden">
                {days.map((d) => {
                  const items = inRange.filter((a) => isSameDay(new Date(a.at), d)).sort((a, b) => a.at.localeCompare(b.at));
                  return (
                    <div key={d.toISOString()} className="border-b px-4 py-3 last:border-0">
                      <p className={cn("mb-2 text-[12px] font-semibold uppercase tracking-wide", isSameDay(d, new Date()) ? "text-primary" : "text-muted-foreground")}>
                        {isSameDay(d, new Date()) ? "Today · " : ""}{d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                      </p>
                      {items.length === 0 ? (
                        <p className="text-[12.5px] text-muted-foreground/80">No appointments</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {items.map((a) => {
                            const lead = state.leads.find((l) => l.id === a.leadId);
                            return (
                              <button key={a.id} onClick={() => setSelectedId(a.id)} className={cn("rounded-lg border-l-[3px] px-3 py-2 text-left", TYPE_TONE[a.type])}>
                                <span className="block text-[13.5px] font-semibold text-foreground">{lead?.name}</span>
                                <span className="block text-[12px]">{formatTime(a.at)} · {a.type} · {a.location}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : upcoming.length === 0 ? (
            <EmptyState icon={CalendarPlus} title="No upcoming appointments" description="Qualified leads are offered viewing slots automatically." />
          ) : (
            <ul className="divide-y">
              {upcoming.map((a) => {
                const lead = state.leads.find((l) => l.id === a.leadId);
                const cancelled = a.status === "cancelled";
                return (
                  <li key={a.id}>
                    <button onClick={() => setSelectedId(a.id)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle/60", cancelled && "opacity-55", selectedId === a.id && "bg-primary-soft/50")}>
                      <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-subtle py-1">
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">{new Date(a.at).toLocaleDateString("en-US", { weekday: "short" })}</span>
                        <span className="num font-display text-lg font-extrabold leading-tight">{new Date(a.at).getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-semibold", cancelled && "line-through")}>{lead?.name}</p>
                        <p className="truncate text-[12.5px] text-muted-foreground">{a.type} · {a.location} · {formatTime(a.at)}</p>
                      </div>
                      <span className="hidden text-[12.5px] text-muted-foreground sm:block">{agentById(a.agentId)?.name}</span>
                      {cancelled ? <Badge>Cancelled</Badge> : a.bookedBy === "AI" ? <Badge variant="primary">AI booked</Badge> : <Badge variant="outline">Agent</Badge>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          {selected ? (
            Detail({ a: selected })
          ) : (
            <Card>
              <CardHeader><CardTitle>This week</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-subtle p-3">
                    <p className="num font-display text-2xl font-extrabold">{inRange.length}</p>
                    <p className="text-[12px] text-muted-foreground">Appointments</p>
                  </div>
                  <div className="rounded-xl bg-subtle p-3">
                    <p className="num font-display text-2xl font-extrabold">{inRange.filter((a) => a.bookedBy === "AI").length}</p>
                    <p className="text-[12px] text-muted-foreground">Booked by AI</p>
                  </div>
                </div>
                <p className="text-[12.5px] text-muted-foreground">Select an appointment to reschedule, cancel or reassign it.</p>
                <div className="flex flex-col gap-1.5 border-t pt-3">
                  {Object.entries(TYPE_TONE).map(([t, cls]) => (
                    <span key={t} className="flex items-center gap-2 text-[12.5px]"><span className={cn("h-3 w-3 rounded-sm border-l-[3px]", cls)} />{t}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>Agent availability</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {["a1", "a2", "a3", "a4"].map((id) => {
                const ag = agentById(id)!;
                const n = visible.filter((a) => a.agentId === id).length;
                return (
                  <div key={id} className="flex items-center gap-3">
                    <Avatar name={ag.name} className="size-8 text-[11px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{ag.name}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-subtle"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, n * 20)}%` }} /></div>
                    </div>
                    <span className="num font-mono text-[12px] text-muted-foreground">{n} booked</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <ScheduleDialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      <RescheduleDialog appt={rescheduling} onClose={() => setRescheduling(null)} />
      <AssignAgentDialog
        open={!!assigning}
        onClose={() => setAssigning(null)}
        currentId={assigning?.agentId ?? null}
        onAssign={(id) => assigning && actions.assignAppointmentAgent(assigning.id, id)}
        title="Assign agent to appointment"
      />
    </>
  );
}
