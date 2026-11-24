/**
 * Demo store: a single React context holding all demo state and the
 * simulated workflows (incoming lead, follow-ups, AI chat, bookings).
 *
 * Async actions call the adapters in services/integrations.ts, so they can be
 * pointed at real APIs later without changing any screen.
 */
import * as React from "react";
import type {
  Agent,
  AppNotification,
  Appointment,
  AppointmentType,
  Conversation,
  FollowUp,
  Lead,
  LeadInterest,
  Message,
  MessageFrom,
  Property,
  Toast,
  Workflow,
} from "@/types";
import {
  AGENTS,
  AHMED_SCRIPT,
  PROPERTIES,
  buildAppointments,
  buildConversations,
  buildFollowUps,
  buildLeads,
  buildNotifications,
  buildWorkflows,
} from "@/data/mock";
import {
  describeExtraction,
  detectBooking,
  draftFollowUp,
  extractLeadData,
  generateReply,
  matchProperties,
  mergeInterest,
  recommendAction,
  scoreLead,
  summarizeLead,
} from "@/services/ai";
import * as api from "@/services/integrations";
import { cloudConfigured, getCloudClient, loadCloudLeads } from "@/services/cloud";
import { BRAND } from "@/config/brand";
import { nextWeekday, sleep, uid } from "@/lib/utils";

/* ------------------------------------------------------------------ */

export interface PipelineRun {
  leadId: string;
  step: number; // index into PIPELINE_STEPS reached
  paused?: boolean;
}

export const PIPELINE_STEPS = [
  "Lead received",
  "AI responded",
  "Lead qualified",
  "AI lead score",
  "CRM record created",
  "Follow-up scheduled",
  "Agent notified",
] as const;

export const FOLLOWUP_STEPS = [
  "Lead received",
  "AI responded",
  "Lead qualified",
  "Follow-up scheduled",
  "Reminder sent",
  "Sales agent notified",
] as const;

interface State {
  leads: Lead[];
  conversations: Conversation[];
  followUps: FollowUp[];
  appointments: Appointment[];
  workflows: Workflow[];
  notifications: AppNotification[];
  toasts: Toast[];
  typing: Record<string, boolean>;
  pipeline: PipelineRun | null;
  replaying: string | null;
  agencyName: string;
  flash: Record<string, number>; // leadId → timestamp, for row highlight
}

export interface NewLeadInput {
  name: string;
  phone: string;
  email: string;
  message?: string;
  interest: LeadInterest;
}

const STORAGE_KEY = "aimagino.workspace.v1";
type PersistedState = Pick<State, "leads" | "conversations" | "followUps" | "appointments" | "workflows" | "notifications">;

const EMPTY_INTEREST: LeadInterest = {
  bedrooms: null,
  propertyType: null,
  location: null,
  budget: null,
  intent: null,
  purpose: null,
  timeline: null,
  financing: null,
  preferences: [],
};

function loadAgencyName() {
  try {
    return localStorage.getItem("aimagino.agencyName") || BRAND.defaultAgencyName;
  } catch {
    return BRAND.defaultAgencyName;
  }
}

function initialState(): State {
  const leads = buildLeads();
  const followUps = buildFollowUps();
  // Attach next follow-up date to each lead
  for (const f of followUps) {
    const l = leads.find((x) => x.id === f.leadId);
    if (l && (!l.nextFollowUp || f.dueAt < l.nextFollowUp)) l.nextFollowUp = f.dueAt;
  }
  const base: State = {
    leads,
    conversations: buildConversations(),
    followUps,
    appointments: buildAppointments(),
    workflows: buildWorkflows(),
    notifications: buildNotifications(),
    toasts: [],
    typing: {},
    pipeline: null,
    replaying: null,
    agencyName: loadAgencyName(),
    flash: {},
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return base;
    const parsed = JSON.parse(saved) as Partial<PersistedState>;
    return {
      ...base,
      leads: Array.isArray(parsed.leads) ? parsed.leads : base.leads,
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : base.conversations,
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps : base.followUps,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : base.appointments,
      workflows: Array.isArray(parsed.workflows) ? parsed.workflows : base.workflows,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : base.notifications,
    };
  } catch {
    return base;
  }
}

/* Incoming lead scripts used by "Simulate new lead" (rotates) */
const INCOMING = [
  {
    name: "Mariam Hassan",
    phone: "+971 55 460 1182",
    source: "WhatsApp" as const,
    nationality: "UAE",
    lines: [
      "Hi, is the 2 bedroom in Dubai Marina still available? I'd like to buy.",
      "Up to 1.6 million. Hoping to buy within the next month, cash.",
    ],
    replies: [
      "Hi Mariam, thanks for your message. Yes, we have 2-bedroom apartments available in Dubai Marina. What's your approximate budget, and when are you planning to buy?",
      "Great, that fits several options. I've shortlisted 3 apartments and Omar Saleh, our Marina specialist, will share viewing times shortly.",
    ],
    agentId: "a1",
  },
  {
    name: "Arjun Kapoor",
    phone: "+971 50 733 2046",
    source: "Website" as const,
    nationality: "India",
    lines: [
      "Looking to buy a 1 bedroom apartment in Downtown for investment.",
      "Budget around 1.1m, within 2 months. Mortgage pre-approved.",
    ],
    replies: [
      "Thanks Arjun. Downtown is popular with investors. What budget are you working with, and what's your timeline?",
      "Perfect. I'll send you 3 Downtown options with rental yield estimates, and Nadia Rahman will follow up to arrange viewings.",
    ],
    agentId: "a2",
  },
  {
    name: "Olivia Grant",
    phone: "+971 58 119 5574",
    source: "Instagram" as const,
    nationality: "United Kingdom",
    lines: [
      "Hi! Do you have any 3 bedroom townhouses in Dubai Hills to buy? We're relocating for my family.",
      "Around 3.4 million, in the next 3 months.",
    ],
    replies: [
      "Hi Olivia, welcome to Dubai in advance. Yes, we have 3-bedroom townhouses in Dubai Hills Estate. What's your budget and when would you like to move?",
      "Lovely. Layla Mansour, our family homes specialist, will send you options near schools and book a viewing at a time that suits you.",
    ],
    agentId: "a4",
  },
];

/* ------------------------------------------------------------------ */

function useDemoState() {
  const [state, setState] = React.useState<State>(initialState);
  // ref always holds the latest state so async simulations never read stale data
  const ref = React.useRef(state);
  const incomingIdx = React.useRef(0);
  const replayToken = React.useRef(0);

  React.useEffect(() => {
    const persisted: PersistedState = {
      leads: state.leads,
      conversations: state.conversations,
      followUps: state.followUps,
      appointments: state.appointments,
      workflows: state.workflows,
      notifications: state.notifications,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Storage can be unavailable in private or embedded browsing contexts.
    }
  }, [state.leads, state.conversations, state.followUps, state.appointments, state.workflows, state.notifications]);

  const set = React.useCallback((fn: (s: State) => State) => {
    const next = fn(ref.current);
    ref.current = next;
    setState(next);
  }, []);

  React.useEffect(() => {
    if (!cloudConfigured) return;
    let active = true;
    const hydrate = async () => {
      try {
        const submissions = await loadCloudLeads();
        if (!active || submissions.length === 0) return;
        set((current) => {
          const leadIds = new Set(current.leads.map((lead) => lead.id));
          const conversationIds = new Set(current.conversations.map((conversation) => conversation.leadId));
          const newLeads = submissions.map((item) => item.lead).filter((lead) => !leadIds.has(lead.id));
          const newConversations: Conversation[] = submissions
            .filter((item) => !conversationIds.has(item.lead.id))
            .map((item) => ({
              leadId: item.lead.id,
              channel: "Website chat",
              mode: "ai",
              unread: 1,
              messages: [{ id: uid("m"), from: "lead", text: item.message, at: item.lead.createdAt }],
            }));
          if (newLeads.length === 0 && newConversations.length === 0) return current;
          return { ...current, leads: [...newLeads, ...current.leads], conversations: [...newConversations, ...current.conversations] };
        });
      } catch {
        // Anonymous visitors cannot read submissions; authenticated users retry on sign-in.
      }
    };
    void getCloudClient()!.auth.getSession().then(({ data }) => { if (data.session) void hydrate(); });
    const subscription = getCloudClient()!.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void hydrate();
    });
    return () => {
      active = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [set]);

  /* ---------------- helpers ---------------- */

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = uid("t");
      set((s) => ({ ...s, toasts: [...s.toasts, { ...t, id }] }));
      setTimeout(() => set((s) => ({ ...s, toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
    },
    [set],
  );

  const dismissToast = React.useCallback((id: string) => set((s) => ({ ...s, toasts: s.toasts.filter((x) => x.id !== id) })), [set]);

  const notify = React.useCallback(
    (n: Omit<AppNotification, "id" | "at" | "read">) =>
      set((s) => ({ ...s, notifications: [{ ...n, id: uid("n"), at: new Date().toISOString(), read: false }, ...s.notifications] })),
    [set],
  );

  const patchLead = React.useCallback(
    (id: string, fn: (l: Lead) => Lead) => set((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? fn(l) : l)) })),
    [set],
  );

  const addActivity = React.useCallback(
    (leadId: string, kind: Lead["activity"][number]["kind"], text: string) =>
      patchLead(leadId, (l) => ({ ...l, activity: [...l.activity, { id: uid("act"), at: new Date().toISOString(), kind, text }] })),
    [patchLead],
  );

  const pushMessage = React.useCallback(
    (leadId: string, m: Omit<Message, "id" | "at">) => {
      const msg: Message = { ...m, id: uid("m"), at: new Date().toISOString() };
      set((s) => ({
        ...s,
        conversations: s.conversations.map((c) => (c.leadId === leadId ? { ...c, messages: [...c.messages, msg] } : c)),
      }));
      return msg;
    },
    [set],
  );

  const workflowActive = (id: string) => ref.current.workflows.find((w) => w.id === id)?.active ?? false;
  const bumpWorkflow = (id: string) =>
    set((s) => ({ ...s, workflows: s.workflows.map((w) => (w.id === id ? { ...w, runsToday: w.runsToday + 1, lastRun: new Date().toISOString() } : w)) }));

  /** Re-derive score / summary / recommendation after interest changes. */
  const rescore = (l: Lead, interest: LeadInterest, engagement = l.engagement): Lead => {
    const score = scoreLead(interest, engagement);
    const hasAppt = ref.current.appointments.some((a) => a.leadId === l.id && a.status !== "cancelled");
    const informative = interest.location || interest.bedrooms !== null || interest.budget;
    const status =
      l.status === "appointment"
        ? l.status
        : interest.budget && interest.intent && (interest.location || interest.bedrooms !== null)
          ? "qualified"
          : informative
            ? "contacted"
            : l.status;
    return {
      ...l,
      interest,
      engagement,
      score,
      status,
      summary: summarizeLead(l.name, interest),
      recommendedAction: recommendAction(score, hasAppt),
      lastContact: new Date().toISOString(),
    };
  };

  /* ---------------- appointments ---------------- */

  const createAppointment = React.useCallback(
    async (a: { leadId: string; type: AppointmentType; location: string; propertyId?: string; at: string; agentId: string; durationMin?: number; bookedBy?: "AI" | "Agent" }, opts: { silent?: boolean } = {}) => {
      const appt: Appointment = { id: uid("ap"), durationMin: 60, status: "confirmed", bookedBy: "Agent", ...a };
      set((s) => ({ ...s, appointments: [...s.appointments, appt] }));
      patchLead(a.leadId, (l) => ({ ...l, status: "appointment", agentId: l.agentId ?? a.agentId, recommendedAction: recommendAction(l.score, true) }));
      const lead = ref.current.leads.find((l) => l.id === a.leadId);
      const when = new Date(a.at).toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit" });
      addActivity(a.leadId, "appointment", `${a.type} booked for ${when}`);
      if (!opts.silent) {
        toast({ title: `${a.type} scheduled`, description: `${lead?.name ?? "Lead"} · ${when}`, tone: "success" });
        notify({ title: `${a.type} scheduled`, body: `${lead?.name} · ${a.location} · ${when}`, tone: "success", link: "/app/appointments" });
      }
      void api.bookCalendarSlot(a.agentId, a.at, appt.durationMin);
      return appt;
    },
    [set, patchLead, addActivity, toast, notify],
  );

  const rescheduleAppointment = React.useCallback(
    (id: string, at: string) => {
      set((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, at, status: "confirmed" } : a)) }));
      const a = ref.current.appointments.find((x) => x.id === id);
      const lead = ref.current.leads.find((l) => l.id === a?.leadId);
      const when = new Date(at).toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit" });
      if (a) addActivity(a.leadId, "appointment", `Appointment rescheduled to ${when}`);
      toast({ title: "Appointment rescheduled", description: `${lead?.name} · ${when}. Confirmation sent on WhatsApp.`, tone: "success" });
    },
    [set, addActivity, toast],
  );

  const cancelAppointment = React.useCallback(
    (id: string) => {
      const a = ref.current.appointments.find((x) => x.id === id);
      set((s) => ({ ...s, appointments: s.appointments.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)) }));
      if (a) {
        const stillHas = ref.current.appointments.some((x) => x.leadId === a.leadId && x.id !== id && x.status !== "cancelled");
        patchLead(a.leadId, (l) => ({ ...l, status: stillHas ? "appointment" : "qualified", recommendedAction: recommendAction(l.score, stillHas) }));
        addActivity(a.leadId, "appointment", "Appointment cancelled");
        const lead = ref.current.leads.find((l) => l.id === a.leadId);
        toast({ title: "Appointment cancelled", description: `${lead?.name} has been notified and moved back to follow-up.` });
      }
    },
    [set, patchLead, addActivity, toast],
  );

  const assignAppointmentAgent = React.useCallback(
    (id: string, agentId: string) => {
      set((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, agentId } : a)) }));
      toast({ title: "Agent assigned", description: `${AGENTS.find((a) => a.id === agentId)?.name} will attend.`, tone: "success" });
    },
    [set, toast],
  );

  /* ---------------- leads ---------------- */

  const assignAgent = React.useCallback(
    (leadId: string, agentId: string) => {
      const agent = AGENTS.find((a) => a.id === agentId)!;
      patchLead(leadId, (l) => ({ ...l, agentId }));
      addActivity(leadId, "agent", `Assigned to ${agent.name}`);
      const lead = ref.current.leads.find((l) => l.id === leadId);
      toast({ title: `Assigned to ${agent.name}`, description: `${agent.name} has been notified on WhatsApp.`, tone: "success" });
      void api.notifyAgent(agentId, `New lead assigned: ${lead?.name}`);
    },
    [patchLead, addActivity, toast],
  );

  /** Create a real website enquiry, qualify it, and persist it in the workspace. */
  const createLead = React.useCallback(
    async (input: NewLeadInput) => {
      const id = uid("l");
      const now = new Date().toISOString();
      const engagement = 70;
      const score = scoreLead(input.interest, engagement);
      const qualified = Boolean(input.interest.intent && input.interest.location && input.interest.budget);
      const agentId = qualified ? pickAgent(input.interest.location) : null;
      const lead: Lead = {
        id,
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        source: "Website",
        language: "English",
        interest: input.interest,
        engagement,
        score,
        status: qualified ? "qualified" : "contacted",
        agentId,
        createdAt: now,
        lastContact: now,
        nextFollowUp: null,
        summary: summarizeLead(input.name.trim(), input.interest),
        recommendedAction: recommendAction(score, false),
        activity: [
          { id: uid("act"), at: now, kind: "created", text: "Website enquiry submitted" },
          { id: uid("act"), at: now, kind: "scored", text: `Lead scored ${score.total}/100 (${score.temperature.toUpperCase()})` },
          ...(agentId ? [{ id: uid("act"), at: now, kind: "agent" as const, text: `Automatically assigned to ${AGENTS.find((a) => a.id === agentId)?.name}` }] : []),
        ],
        isNew: true,
      };
      const enquiryText = input.message?.trim() || `I am looking to ${input.interest.intent?.toLowerCase() ?? "find a property"} in ${input.interest.location ?? "Dubai"}.`;
      const conversation: Conversation = {
        leadId: id,
        channel: "Website chat",
        mode: "ai",
        unread: 1,
        messages: [
          { id: uid("m"), from: "lead", text: enquiryText, at: now },
          { id: uid("m"), from: "ai", text: `Thanks ${input.name.trim().split(" ")[0]}. Your requirements have been received. A property consultant will contact you with suitable options.`, at: now },
        ],
      };
      set((s) => ({
        ...s,
        leads: [lead, ...s.leads],
        conversations: [conversation, ...s.conversations],
        notifications: [{ id: uid("n"), title: `New website lead: ${lead.name}`, body: `${input.interest.location ?? "Location pending"} · ${score.total}/100`, at: now, read: false, tone: score.temperature === "hot" ? "hot" : "primary", link: `/app/leads/${id}` }, ...s.notifications],
        flash: { ...s.flash, [id]: Date.now() },
      }));

      try {
        const delivery = await api.submitLead({ lead, message: enquiryText });
        const deliveryLabel = delivery.provider === "supabase" ? "saved to central database" : delivery.provider === "api" ? "server integrations completed" : delivery.provider === "webhook" ? "webhook delivered" : "saved locally";
        addActivity(id, "crm", delivery.provider === "supabase" ? "Enquiry saved to the central workspace database" : delivery.provider === "api" ? "Enquiry delivered to the secure lead API" : delivery.provider === "webhook" ? "Enquiry delivered to the configured lead webhook" : "Enquiry saved to this workspace");
        toast({ title: "Enquiry received", description: `${lead.name} · score ${score.total}/100 · ${deliveryLabel}`, tone: "success" });
      } catch {
        addActivity(id, "note", "Enquiry saved locally; external webhook delivery failed");
        toast({ title: "Enquiry saved", description: `${lead.name} was saved locally, but the external webhook needs attention.` });
      }
      return lead;
    },
    [set, addActivity, toast],
  );

  /* ---------------- follow-ups ---------------- */

  const runFollowUp = React.useCallback(
    async (id: string) => {
      const f0 = ref.current.followUps.find((f) => f.id === id);
      if (!f0 || f0.status === "running" || f0.status === "sent" || f0.status === "replied") return;
      const setF = (patch: Partial<FollowUp>) => set((s) => ({ ...s, followUps: s.followUps.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
      setF({ status: "running" });
      const lead = ref.current.leads.find((l) => l.id === f0.leadId)!;
      await api.sendMessage(f0.channel, lead.phone, f0.message);
      setF({ progress: 4 });
      if (f0.channel !== "Call task" && ref.current.conversations.some((c) => c.leadId === lead.id)) {
        pushMessage(lead.id, { from: "ai", text: f0.message });
      }
      await sleep(700);
      const agent = AGENTS.find((a) => a.id === lead.agentId);
      if (agent) await api.notifyAgent(agent.id, `Follow-up sent to ${lead.name}`);
      setF({ progress: 5, status: "sent", sentAt: new Date().toISOString() });
      bumpWorkflow("w2");
      const remaining = ref.current.followUps.filter((f) => f.leadId === lead.id && f.status === "scheduled" && f.id !== id);
      patchLead(lead.id, (l) => ({
        ...l,
        lastContact: new Date().toISOString(),
        nextFollowUp: remaining.length ? remaining.map((f) => f.dueAt).sort()[0]! : null,
      }));
      addActivity(lead.id, "followup", `${f0.channel === "Call task" ? "Call task sent to agent" : `Follow-up sent via ${f0.channel}`}: "${f0.reason}"`);
      toast({ title: `Follow-up sent to ${lead.name}`, description: agent ? `${agent.name} notified.` : "Agent notified.", tone: "success" });
      notify({ title: "Follow-up sent", body: `${lead.name} · ${f0.channel} · ${f0.reason}`, tone: "primary", link: "/app/follow-ups" });

      // Hot leads reply shortly after (demo realism)
      if (lead.score.temperature === "hot" && f0.channel === "WhatsApp") {
        await sleep(2600);
        const reply = lead.id === "l1" ? "Thanks, that first one looks great. See you Friday." : "Thanks! Yes please, send me the details.";
        if (ref.current.conversations.some((c) => c.leadId === lead.id)) pushMessage(lead.id, { from: "lead", text: reply });
        setF({ status: "replied" });
        addActivity(lead.id, "note", `Lead replied: "${reply}"`);
        notify({ title: `${lead.name} replied`, body: reply, tone: "hot", link: `/app/conversations/${lead.id}` });
        toast({ title: `${lead.name} replied`, description: reply, tone: "hot" });
      }
    },
    [set, pushMessage, patchLead, addActivity, toast, notify],
  );

  const scheduleFollowUp = React.useCallback(
    async (leadId: string, message: string, channel: FollowUp["channel"], when: "now" | string) => {
      const lead = ref.current.leads.find((l) => l.id === leadId)!;
      const f: FollowUp = {
        id: uid("f"),
        leadId,
        dueAt: when === "now" ? new Date().toISOString() : when,
        channel,
        reason: when === "now" ? "Manual follow-up" : "Scheduled by agent",
        message,
        status: "scheduled",
        progress: 3,
      };
      set((s) => ({ ...s, followUps: [...s.followUps, f] }));
      if (when === "now") {
        await sleep(50);
        await runFollowUp(f.id);
      } else {
        patchLead(leadId, (l) => ({ ...l, nextFollowUp: !l.nextFollowUp || f.dueAt < l.nextFollowUp ? f.dueAt : l.nextFollowUp }));
        addActivity(leadId, "followup", `Follow-up scheduled via ${channel}`);
        toast({ title: "Follow-up scheduled", description: `${lead.name} · ${new Date(f.dueAt).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}`, tone: "success" });
      }
    },
    [set, runFollowUp, patchLead, addActivity, toast],
  );

  /* ---------------- conversations ---------------- */

  const setConversationMode = React.useCallback(
    (leadId: string, mode: Conversation["mode"]) => {
      set((s) => ({ ...s, conversations: s.conversations.map((c) => (c.leadId === leadId ? { ...c, mode } : c)) }));
      pushMessage(leadId, { from: "system", text: mode === "agent" ? "Agent took over the conversation · AI paused" : "AI assistant resumed the conversation" });
    },
    [set, pushMessage],
  );

  const markConversationRead = React.useCallback(
    (leadId: string) => set((s) => ({ ...s, conversations: s.conversations.map((c) => (c.leadId === leadId ? { ...c, unread: 0 } : c)) })),
    [set],
  );

  /** Make sure a lead has a conversation thread (used by "Contact lead"). */
  const ensureConversation = React.useCallback(
    (leadId: string) => {
      if (ref.current.conversations.some((c) => c.leadId === leadId)) return;
      const lead = ref.current.leads.find((l) => l.id === leadId);
      if (!lead) return;
      set((s) => ({
        ...s,
        conversations: [
          {
            leadId,
            channel: lead.source === "Instagram" ? "Instagram" : lead.source === "Facebook" ? "Facebook" : "WhatsApp",
            mode: "agent",
            unread: 0,
            messages: [{ id: uid("m"), from: "system", text: `Conversation history imported from ${lead.source} · agent mode`, at: lead.createdAt }],
          },
          ...s.conversations,
        ],
      }));
    },
    [set],
  );

  /** Customer (simulated) or agent sends a message. AI replies when in AI mode. */
  const sendMessage = React.useCallback(
    async (leadId: string, from: MessageFrom, text: string) => {
      if (from !== "lead") {
        pushMessage(leadId, { from, text });
        patchLead(leadId, (l) => ({ ...l, lastContact: new Date().toISOString() }));
        return;
      }
      const ex = extractLeadData(text);
      const chips = describeExtraction(ex);
      pushMessage(leadId, { from: "lead", text, extracted: chips.length ? chips : undefined });
      const before = ref.current.leads.find((l) => l.id === leadId)!;
      const interest = mergeInterest(before.interest, ex);
      const engagement = Math.min(92, before.engagement + 10);
      patchLead(leadId, (l) => rescore(l, interest, engagement));
      const conv = ref.current.conversations.find((c) => c.leadId === leadId);
      if (conv?.mode !== "ai") return;

      set((s) => ({ ...s, typing: { ...s.typing, [leadId]: true } }));
      await sleep(1100 + Math.min(1400, text.length * 12));
      const reply = generateReply(interest, ex, text);
      set((s) => ({ ...s, typing: { ...s.typing, [leadId]: false } }));
      pushMessage(leadId, { from: "ai", text: reply.text });
      bumpWorkflow("w1");

      const after = ref.current.leads.find((l) => l.id === leadId)!;
      if (reply.booking && workflowActive("w3")) {
        const agentId = after.agentId ?? pickAgent(interest.location);
        const hasAppt = ref.current.appointments.some((a) => a.leadId === leadId && a.status !== "cancelled");
        if (!hasAppt) {
          await createAppointment({
            leadId,
            type: "Property Viewing",
            location: interest.location ?? "Dubai",
            propertyId: matchProperties(interest, PROPERTIES, 1)[0]?.property.id,
            at: nextWeekday(reply.booking.weekday, reply.booking.hour),
            agentId,
            bookedBy: "AI",
          });
          bumpWorkflow("w3");
          pushMessage(leadId, { from: "system", text: `Viewing booked · Assigned to ${AGENTS.find((a) => a.id === agentId)?.name} · CRM record updated` });
        }
      } else if (reply.done && after.score.temperature === "hot" && !after.agentId) {
        const agentId = pickAgent(interest.location);
        assignAgent(leadId, agentId);
      }
      if (after.score.temperature === "hot" && before.score.temperature !== "hot") {
        notify({ title: "Lead became HOT", body: `${after.name} scored ${after.score.total}/100`, tone: "hot", link: `/app/leads/${leadId}` });
      }
    },
    [set, pushMessage, patchLead, createAppointment, assignAgent, notify],
  );

  /** Replays the flagship Ahmed conversation from a blank CRM record. */
  const replayConversation = React.useCallback(async () => {
    const token = ++replayToken.current;
    const leadId = "l1";
    const alive = () => replayToken.current === token;
    set((s) => ({
      ...s,
      replaying: leadId,
      conversations: s.conversations.map((c) => (c.leadId === leadId ? { ...c, messages: [], mode: "ai" } : c)),
      leads: s.leads.map((l) => (l.id === leadId ? { ...rescore(l, EMPTY_INTEREST, 40), status: "new", summary: "Waiting for the conversation to start…" } : l)),
    }));
    let customerMsgs = 0;
    await sleep(500);
    for (const line of AHMED_SCRIPT) {
      if (!alive()) return;
      if (line.from === "lead") {
        await sleep(customerMsgs === 0 ? 300 : 1100);
        if (!alive()) return;
        customerMsgs++;
        const ex = extractLeadData(line.text);
        const chips = describeExtraction(ex);
        pushMessage(leadId, { from: "lead", text: line.text, extracted: chips.length ? chips : undefined });
        const l = ref.current.leads.find((x) => x.id === leadId)!;
        const interest = mergeInterest(l.interest, ex);
        patchLead(leadId, (x) => rescore(x, interest, Math.min(90, 40 + 10 * customerMsgs)));
      } else if (line.from === "ai") {
        set((s) => ({ ...s, typing: { ...s.typing, [leadId]: true } }));
        await sleep(1300);
        if (!alive()) return;
        set((s) => ({ ...s, typing: { ...s.typing, [leadId]: false } }));
        pushMessage(leadId, { from: "ai", text: line.text });
      } else {
        await sleep(700);
        if (!alive()) return;
        pushMessage(leadId, { from: "system", text: line.text });
      }
    }
    // Restore Ahmed's canonical CRM state (appointment + exact summary)
    patchLead(leadId, (l) => ({
      ...l,
      status: "appointment",
      agentId: "a1",
      summary:
        "Ahmed is actively looking for a 2-bedroom apartment in Dubai Marina with a budget of AED 1.5M. He intends to purchase within 30 days and has confirmed financing.",
      recommendedAction: recommendAction(l.score, true),
    }));
    set((s) => ({ ...s, replaying: null }));
    toast({ title: "Lead qualified in under 2 minutes", description: "Ahmed Khan · 87/100 HOT · viewing booked for Friday 5:00 PM", tone: "hot" });
  }, [set, pushMessage, patchLead, toast]);

  const stopReplay = React.useCallback(() => {
    replayToken.current++;
    set((s) => ({ ...s, replaying: null, typing: {} }));
  }, [set]);

  /** Opens a blank conversation the presenter can type into as the customer. */
  const startTestConversation = React.useCallback(() => {
    const id = uid("l");
    const now = new Date().toISOString();
    const n = ref.current.leads.filter((l) => l.name.startsWith("Test Enquiry")).length + 1;
    const lead: Lead = {
      id,
      name: `Test Enquiry ${n}`,
      phone: "+971 50 000 0000",
      email: "test@example.com",
      source: "WhatsApp",
      language: "English",
      interest: EMPTY_INTEREST,
      engagement: 40,
      score: scoreLead(EMPTY_INTEREST, 40),
      status: "new",
      agentId: null,
      createdAt: now,
      lastContact: now,
      nextFollowUp: null,
      summary: "New conversation. The AI will build this profile as the customer replies.",
      recommendedAction: "Let the AI assistant qualify this enquiry.",
      activity: [{ id: uid("act"), at: now, kind: "created", text: "Test conversation started from the demo" }],
      isNew: true,
    };
    set((s) => ({
      ...s,
      leads: [lead, ...s.leads],
      conversations: [
        {
          leadId: id,
          channel: "WhatsApp",
          mode: "ai",
          unread: 0,
          messages: [
            { id: uid("m"), from: "system", text: "Test conversation · type as the customer below", at: now },
            { id: uid("m"), from: "ai", text: `Hi! Welcome to ${ref.current.agencyName}. I'm the AI property assistant. What kind of property are you looking for?`, at: now },
          ],
        },
        ...s.conversations,
      ],
    }));
    return id;
  }, [set]);

  /* ---------------- incoming lead simulation ---------------- */

  const simulateIncomingLead = React.useCallback(async () => {
    if (ref.current.pipeline && ref.current.pipeline.step < PIPELINE_STEPS.length - 1 && !ref.current.pipeline.paused) return;
    const script = INCOMING[incomingIdx.current % INCOMING.length]!;
    incomingIdx.current++;
    const existing = ref.current.leads.filter((l) => l.name.startsWith(script.name)).length;
    const name = existing ? `${script.name} (${existing + 1})` : script.name;
    const id = uid("l");
    const now = new Date().toISOString();
    const lead: Lead = {
      id,
      name,
      phone: script.phone,
      email: `${script.name.split(" ")[0]!.toLowerCase()}@example.com`,
      source: script.source,
      language: "English",
      nationality: script.nationality,
      interest: EMPTY_INTEREST,
      engagement: 45,
      score: scoreLead(EMPTY_INTEREST, 45),
      status: "new",
      agentId: null,
      createdAt: now,
      lastContact: now,
      nextFollowUp: null,
      summary: "New enquiry received. AI qualification in progress.",
      recommendedAction: "Let the AI assistant qualify this enquiry.",
      activity: [{ id: uid("act"), at: now, kind: "created", text: `Lead received from ${script.source}` }],
      isNew: true,
    };
    set((s) => ({
      ...s,
      leads: [lead, ...s.leads],
      flash: { ...s.flash, [id]: Date.now() },
      pipeline: { leadId: id, step: 0 },
      conversations: [{ leadId: id, channel: script.source === "Instagram" ? "Instagram" : script.source === "Website" ? "Website chat" : "WhatsApp", mode: "ai", unread: 1, messages: [] }, ...s.conversations],
    }));
    const firstEx = extractLeadData(script.lines[0]!);
    pushMessage(id, { from: "lead", text: script.lines[0]!, extracted: describeExtraction(firstEx) });
    notify({ title: `New lead: ${name}`, body: `${script.source} enquiry · ${script.lines[0]}`, tone: "primary", link: `/app/leads/${id}` });
    toast({ title: `New ${script.source} enquiry`, description: `${name}: "${script.lines[0]}"` });

    const step = (n: number, paused = false) => set((s) => ({ ...s, pipeline: s.pipeline?.leadId === id ? { leadId: id, step: n, paused } : s.pipeline }));

    if (!workflowActive("w1")) {
      await sleep(900);
      step(0, true);
      notify({ title: "Lead waiting for an agent", body: `New Lead Qualification is paused, so ${name} has not received a reply.`, tone: "warm", link: "/app/automations" });
      return;
    }

    await sleep(1400);
    let interest = mergeInterest(EMPTY_INTEREST, firstEx);
    pushMessage(id, { from: "ai", text: script.replies[0]! });
    patchLead(id, (l) => rescore(l, interest, 60));
    addActivity(id, "ai", "AI replied in 8 seconds");
    step(1);

    await sleep(1600);
    const secondEx = extractLeadData(script.lines[1]!);
    pushMessage(id, { from: "lead", text: script.lines[1]!, extracted: describeExtraction(secondEx) });
    interest = mergeInterest(interest, secondEx);
    patchLead(id, (l) => ({ ...rescore(l, interest, 82), status: "qualified" }));
    addActivity(id, "qualified", "Qualification questions answered");
    step(2);

    await sleep(1200);
    const scored = ref.current.leads.find((l) => l.id === id)!;
    addActivity(id, "scored", `AI lead score: ${scored.score.total}/100 (${scored.score.temperature.toUpperCase()})`);
    step(3);

    await sleep(1100);
    await api.upsertCrmRecord(id, interest as unknown as Record<string, unknown>);
    addActivity(id, "crm", "CRM record created and requirements saved");
    pushMessage(id, { from: "ai", text: script.replies[1]! });
    step(4);

    await sleep(1100);
    const due = new Date(Date.now() + 24 * 3_600_000).toISOString();
    const lead2 = ref.current.leads.find((l) => l.id === id)!;
    const top = matchProperties(interest, PROPERTIES, 1)[0]?.property;
    set((s) => ({
      ...s,
      followUps: [
        ...s.followUps,
        { id: uid("f"), leadId: id, dueAt: due, channel: "WhatsApp", reason: "Share shortlist and offer viewing slots", message: draftFollowUp(lead2, top), status: "scheduled", progress: 3 },
      ],
    }));
    patchLead(id, (l) => ({ ...l, nextFollowUp: due }));
    addActivity(id, "followup", "Follow-up scheduled for tomorrow");
    step(5);

    await sleep(1000);
    const agent = AGENTS.find((a) => a.id === script.agentId)!;
    patchLead(id, (l) => ({ ...l, agentId: agent.id, isNew: false }));
    addActivity(id, "agent", `Assigned to ${agent.name} · WhatsApp alert sent`);
    bumpWorkflow("w1");
    step(6);
    const final = ref.current.leads.find((l) => l.id === id)!;
    notify({ title: `${final.score.temperature === "hot" ? "Hot lead" : "Lead"} qualified: ${name}`, body: `${final.score.total}/100 · assigned to ${agent.name}`, tone: final.score.temperature === "hot" ? "hot" : "primary", link: `/app/leads/${id}` });
    toast({ title: `${name} qualified · ${final.score.total}/100 ${final.score.temperature.toUpperCase()}`, description: `CRM updated, follow-up scheduled, ${agent.name} notified.`, tone: final.score.temperature === "hot" ? "hot" : "success" });
  }, [set, pushMessage, patchLead, addActivity, notify, toast]);

  const dismissPipeline = React.useCallback(() => set((s) => ({ ...s, pipeline: null })), [set]);

  /* ---------------- workflows, notifications, settings ---------------- */

  const toggleWorkflow = React.useCallback(
    (id: string) => {
      const w = ref.current.workflows.find((x) => x.id === id)!;
      set((s) => ({ ...s, workflows: s.workflows.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) }));
      toast({ title: `${w.name} ${w.active ? "paused" : "activated"}`, description: w.active ? "New events will wait for a person to act." : "The workflow will run on the next matching event.", tone: w.active ? "default" : "success" });
    },
    [set, toast],
  );

  const markAllRead = React.useCallback(() => set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })), [set]);
  const markRead = React.useCallback((id: string) => set((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })), [set]);

  const setAgencyName = React.useCallback(
    (name: string) => {
      set((s) => ({ ...s, agencyName: name }));
      try {
        localStorage.setItem("aimagino.agencyName", name);
      } catch {
        /* storage unavailable: keep in memory */
      }
    },
    [set],
  );

  const resetDemo = React.useCallback(() => {
    replayToken.current++;
    const agencyName = ref.current.agencyName;
    set(() => ({ ...initialState(), agencyName }));
    toast({ title: "Demo data reset", description: "All leads, follow-ups and appointments are back to the starting state.", tone: "success" });
  }, [set, toast]);

  const actions = React.useMemo(
    () => ({
      toast,
      dismissToast,
      notify,
      createLead,
      assignAgent,
      runFollowUp,
      scheduleFollowUp,
      createAppointment,
      rescheduleAppointment,
      cancelAppointment,
      assignAppointmentAgent,
      sendMessage,
      setConversationMode,
      markConversationRead,
      ensureConversation,
      replayConversation,
      stopReplay,
      startTestConversation,
      simulateIncomingLead,
      dismissPipeline,
      toggleWorkflow,
      markAllRead,
      markRead,
      setAgencyName,
      resetDemo,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { state, actions };
}

function pickAgent(location: string | null): string {
  if (!location) return "a1";
  if (["Dubai Marina", "Jumeirah Lake Towers", "Dubai Creek Harbour", "Jumeirah Village Circle"].includes(location)) return "a1";
  if (["Downtown Dubai", "Business Bay"].includes(location)) return "a2";
  if (["Palm Jumeirah", "City Walk"].includes(location)) return "a3";
  return "a4";
}

/* ------------------------------------------------------------------ */

type Ctx = ReturnType<typeof useDemoState>;
const DemoContext = React.createContext<Ctx | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const value = useDemoState();
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = React.useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}

/* ---------------- selectors ---------------- */

export function useKpis() {
  const { state } = useDemo();
  return React.useMemo(() => {
    const now = Date.now();
    return {
      newLeads: state.leads.length,
      qualified: state.leads.filter((l) => l.status === "qualified" || l.status === "appointment").length,
      hot: state.leads.filter((l) => l.score.temperature === "hot").length,
      appointments: state.appointments.filter((a) => a.status !== "cancelled" && new Date(a.at).getTime() > now - 3_600_000).length,
      followUps: state.followUps.filter((f) => f.status === "scheduled" || f.status === "running").length,
    };
  }, [state.leads, state.appointments, state.followUps]);
}

export function agentById(id: string | null | undefined): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function propertyById(id: string | undefined): Property | undefined {
  return PROPERTIES.find((p) => p.id === id);
}

export { AGENTS, PROPERTIES, detectBooking };
