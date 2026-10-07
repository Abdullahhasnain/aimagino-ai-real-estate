import * as React from "react";
import { Check, Sparkles } from "lucide-react";
import type { Appointment, AppointmentType, FollowUp } from "@/types";
import { AGENTS, PROPERTIES, useDemo } from "@/store/demo-store";
import { COMMUNITIES, draftFollowUp, matchProperties } from "@/services/ai";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { cn, formatAEDShort } from "@/lib/utils";

const TYPES: AppointmentType[] = ["Property Viewing", "Property Consultation", "Video Call", "Off-plan Presentation"];
const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

function toDateInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}
function combine(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y!, m! - 1, d!, hh!, mm!).toISOString();
}
function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateInput(d);
}
function fmtTime(t: string) {
  const [h] = t.split(":").map(Number);
  return `${h! > 12 ? h! - 12 : h}:00 ${h! >= 12 ? "PM" : "AM"}`;
}

/* ---------------- Schedule appointment ---------------- */

export function ScheduleDialog({ open, onClose, leadId: initialLead }: { open: boolean; onClose: () => void; leadId?: string }) {
  const { state, actions } = useDemo();
  const [leadId, setLeadId] = React.useState(initialLead ?? state.leads[0]?.id ?? "");
  const lead = state.leads.find((l) => l.id === leadId);
  const suggestions = lead ? matchProperties(lead.interest, PROPERTIES, 3) : [];
  const [type, setType] = React.useState<AppointmentType>("Property Viewing");
  const [propertyId, setPropertyId] = React.useState<string>("");
  const [location, setLocation] = React.useState<string>("");
  const [date, setDate] = React.useState(defaultDate);
  const [time, setTime] = React.useState("17:00");
  const [agentId, setAgentId] = React.useState(lead?.agentId ?? "a1");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const id = initialLead ?? state.leads[0]?.id ?? "";
    setLeadId(id);
    setDate(defaultDate());
    setSaving(false);
  }, [open, initialLead]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const l = state.leads.find((x) => x.id === leadId);
    const top = l ? matchProperties(l.interest, PROPERTIES, 1)[0] : undefined;
    setPropertyId(top?.property.id ?? "");
    setLocation(top?.property.community ?? l?.interest.location ?? "Dubai Marina");
    setAgentId(l?.agentId ?? "a1");
  }, [leadId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!lead) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    await actions.createAppointment({ leadId, type, location, propertyId: propertyId || undefined, at: combine(date, time), agentId, bookedBy: "Agent" });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Schedule appointment"
      description="The lead receives a WhatsApp confirmation and the agent gets a calendar invite."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving} disabled={!lead}>Schedule appointment</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="appt-lead">Lead</Label>
          <Select id="appt-lead" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            {state.leads.map((l) => (
              <option key={l.id} value={l.id}>{l.name} · {l.score.temperature.toUpperCase()} {l.score.total}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="appt-type">Type</Label>
          <Select id="appt-type" value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="appt-agent">Agent</Label>
          <Select id="appt-agent" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="appt-date">Date</Label>
          <Input id="appt-date" type="date" value={date} min={toDateInput(new Date())} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="appt-time">Time</Label>
          <Select id="appt-time" value={time} onChange={(e) => setTime(e.target.value)}>
            {TIMES.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="appt-location">Location</Label>
          <Select id="appt-location" value={location} onChange={(e) => setLocation(e.target.value)}>
            {COMMUNITIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
        {suggestions.length > 0 && type === "Property Viewing" && (
          <div className="sm:col-span-2">
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium"><Sparkles className="size-3.5 text-primary" />AI-suggested properties to view</p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((m) => (
                <button
                  key={m.property.id}
                  type="button"
                  onClick={() => { setPropertyId(m.property.id); setLocation(m.property.community); }}
                  className={cn("flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors", propertyId === m.property.id ? "border-primary bg-primary-soft" : "hover:bg-subtle")}
                >
                  <span className="min-w-0 truncate">{m.property.building} · {m.property.bedrooms}BR · {formatAEDShort(m.property.price)}</span>
                  <span className="flex shrink-0 items-center gap-2 font-mono text-[12px] text-primary">{m.score}%{propertyId === m.property.id && <Check className="size-3.5" />}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

/* ---------------- Reschedule ---------------- */

export function RescheduleDialog({ appt, onClose }: { appt: Appointment | null; onClose: () => void }) {
  const { actions } = useDemo();
  const [date, setDate] = React.useState(defaultDate);
  const [time, setTime] = React.useState("17:00");
  React.useEffect(() => {
    if (!appt) return;
    const d = new Date(appt.at);
    setDate(toDateInput(d));
    setTime(`${String(d.getHours()).padStart(2, "0")}:00`);
  }, [appt]);
  return (
    <Dialog
      open={!!appt}
      onClose={onClose}
      title="Reschedule appointment"
      description="The lead is asked to confirm the new time on WhatsApp."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (appt) actions.rescheduleAppointment(appt.id, combine(date, time)); onClose(); }}>Save new time</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rs-date">Date</Label>
          <Input id="rs-date" type="date" value={date} min={toDateInput(new Date())} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="rs-time">Time</Label>
          <Select id="rs-time" value={time} onChange={(e) => setTime(e.target.value)}>
            {TIMES.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
          </Select>
        </div>
      </div>
    </Dialog>
  );
}

/* ---------------- Assign agent ---------------- */

export function AssignAgentDialog({
  open,
  onClose,
  currentId,
  onAssign,
  title = "Assign agent",
}: {
  open: boolean;
  onClose: () => void;
  currentId: string | null;
  onAssign: (agentId: string) => void;
  title?: string;
}) {
  const { state } = useDemo();
  const [sel, setSel] = React.useState(currentId ?? "a1");
  React.useEffect(() => setSel(currentId ?? "a1"), [currentId, open]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description="The agent is notified on WhatsApp with the lead summary."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onAssign(sel); onClose(); }}>Assign</Button>
        </>
      }
    >
      <div className="flex flex-col gap-2" role="radiogroup">
        {AGENTS.map((a) => {
          const load = state.leads.filter((l) => l.agentId === a.id).length;
          return (
            <button
              key={a.id}
              role="radio"
              aria-checked={sel === a.id}
              onClick={() => setSel(a.id)}
              className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition-colors", sel === a.id ? "border-primary bg-primary-soft" : "hover:bg-subtle")}
            >
              <Avatar name={a.name} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">{a.name}</span>
                <span className="block text-[12px] text-muted-foreground">{a.role} · {a.focus}</span>
              </span>
              <span className="text-right text-[12px] text-muted-foreground"><span className="num font-mono font-semibold text-foreground">{load}</span> leads</span>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}

/* ---------------- Follow-up composer ---------------- */

export function FollowUpDialog({ open, onClose, leadId }: { open: boolean; onClose: () => void; leadId: string }) {
  const { state, actions } = useDemo();
  const lead = state.leads.find((l) => l.id === leadId);
  const [text, setText] = React.useState("");
  const [channel, setChannel] = React.useState<FollowUp["channel"]>("WhatsApp");
  const [when, setWhen] = React.useState<"now" | "tomorrow" | "2days">("now");
  const [drafting, setDrafting] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const draft = React.useCallback(async () => {
    if (!lead) return;
    setDrafting(true);
    setText("");
    await new Promise((r) => setTimeout(r, 700));
    const top = matchProperties(lead.interest, PROPERTIES, 1)[0]?.property;
    setText(draftFollowUp(lead, top));
    setDrafting(false);
  }, [lead]);

  React.useEffect(() => {
    if (open) {
      setWhen("now");
      setSending(false);
      void draft();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setSending(true);
    const due =
      when === "now" ? "now" : new Date(Date.now() + (when === "tomorrow" ? 1 : 2) * 86_400_000).toISOString();
    onClose();
    await actions.scheduleFollowUp(leadId, text, channel, due);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Send follow-up${lead ? ` to ${lead.name}` : ""}`}
      description="Drafted by AI from the lead's requirements and best property match. Edit before sending."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={sending} disabled={!text.trim() || drafting}>{when === "now" ? "Send now" : "Schedule"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="fu-text" className="mb-0">Message</Label>
            <Button size="sm" variant="ghost" onClick={draft} disabled={drafting}><Sparkles className="text-primary" />Redraft</Button>
          </div>
          {drafting ? (
            <div className="flex min-h-[112px] flex-col gap-2 rounded-lg border p-3">
              <div className="h-3 w-11/12 animate-pulse rounded bg-subtle" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-subtle" />
              <div className="h-3 w-7/12 animate-pulse rounded bg-subtle" />
            </div>
          ) : (
            <Textarea id="fu-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fu-channel">Channel</Label>
            <Select id="fu-channel" value={channel} onChange={(e) => setChannel(e.target.value as FollowUp["channel"])}>
              <option>WhatsApp</option>
              <option>Email</option>
              <option>Call task</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="fu-when">When</Label>
            <Select id="fu-when" value={when} onChange={(e) => setWhen(e.target.value as typeof when)}>
              <option value="now">Send now</option>
              <option value="tomorrow">Tomorrow, same time</option>
              <option value="2days">In 2 days</option>
            </Select>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
