import * as React from "react";
import {
  ArrowLeft,
  Bot,
  CheckCheck,
  Headset,
  MessageCirclePlus,
  MessagesSquare,
  Play,
  Search,
  Send,
  Sparkles,
  Square,
  UserRound,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ScoreRing, TempBadge } from "@/components/shared/lead-bits";
import { ScoreBreakdown } from "@/components/shared/score";
import { PropertyMatches } from "@/components/shared/property";
import { agentById, useDemo } from "@/store/demo-store";
import { useRouter } from "@/lib/router";
import { cn, formatAEDShort, formatTime, timeAgo } from "@/lib/utils";
import type { Conversation, Lead, Message } from "@/types";

const CUSTOMER_SUGGESTIONS = [
  "Hi, I'm looking for a 2 bedroom apartment in Business Bay.",
  "I want to buy.",
  "Budget is around 2 million.",
  "Within the next 2 months.",
  "Saturday morning works.",
];

/* ---------------- list ---------------- */

function ConversationList({ activeId, onSelect }: { activeId?: string; onSelect: (id: string) => void }) {
  const { state } = useDemo();
  const [q, setQ] = React.useState("");
  const items = state.conversations
    .map((c) => ({ c, lead: state.leads.find((l) => l.id === c.leadId)! }))
    .filter((x) => x.lead && x.lead.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.c.messages.at(-1)?.at ?? "").localeCompare(a.c.messages.at(-1)?.at ?? ""));
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="conv-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" className="h-9 w-full rounded-lg border border-input bg-subtle/60 pl-9 pr-3 text-[13.5px] focus-visible:bg-surface focus-visible:ring-offset-0" />
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {items.map(({ c, lead }) => {
          const last = [...c.messages].reverse().find((m) => m.from !== "system");
          const active = c.leadId === activeId;
          return (
            <li key={c.leadId}>
              <button onClick={() => onSelect(c.leadId)} className={cn("flex w-full gap-3 border-b px-3 py-3 text-left transition-colors", active ? "bg-primary-soft/70" : "hover:bg-subtle/70")}>
                <Avatar name={lead.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13.5px] font-semibold">{lead.name}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{last ? formatTime(last.at) : ""}</span>
                  </div>
                  <p className="truncate text-[12.5px] text-muted-foreground">
                    {last ? (last.from === "ai" ? "AI: " : last.from === "agent" ? "Agent: " : "") + (last.translation ?? last.text) : "No messages yet"}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant="outline" className="font-medium">{c.channel}</Badge>
                    {c.mode === "ai" ? <Badge variant="primary"><Bot />AI</Badge> : <Badge><Headset />Agent</Badge>}
                    <TempBadge t={lead.score.temperature} />
                    {c.unread > 0 && <span className="num ml-auto rounded-full bg-whatsapp px-1.5 text-[10.5px] font-bold leading-4 text-white">{c.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- chat ---------------- */

function Bubble({ m, lead }: { m: Message; lead: Lead }) {
  if (m.from === "system")
    return (
      <div className="flex justify-center py-1 animate-fade-up">
        <span className="rounded-md bg-surface/90 px-2.5 py-1 text-center text-[11.5px] font-medium text-muted-foreground shadow-sm">{m.text}</span>
      </div>
    );
  const mine = m.from !== "lead";
  const agent = agentById(lead.agentId);
  return (
    <div className={cn("flex flex-col animate-fade-up", mine ? "items-end" : "items-start")}>
      <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug shadow-sm sm:max-w-[75%]", mine ? "rounded-tr-md bg-whatsapp-bubble" : "rounded-tl-md bg-surface")}>
        {mine && (
          <p className={cn("mb-0.5 flex items-center gap-1 text-[11px] font-semibold", m.from === "ai" ? "text-whatsapp" : "text-accent-foreground")}>
            {m.from === "ai" ? <><Bot className="size-3" />AI assistant</> : <><UserRound className="size-3" />{agent?.name ?? "Agent"}</>}
          </p>
        )}
        <p dir="auto" className="whitespace-pre-wrap">{m.text}</p>
        {m.translation && <p className="mt-1 border-t border-foreground/10 pt-1 text-[12px] italic text-muted-foreground">{m.translation}</p>}
        <p className="mt-0.5 flex items-center justify-end gap-1 text-[10.5px] text-muted-foreground">
          {formatTime(m.at)}
          {mine && <CheckCheck className="size-3.5 text-[hsl(204_80%_52%)]" />}
        </p>
      </div>
      {m.extracted && m.extracted.length > 0 && (
        <div className="mt-1.5 flex max-w-[90%] flex-wrap items-center gap-1 animate-fade-up">
          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-primary"><Sparkles className="size-3" />Extracted</span>
          {m.extracted.map((c) => (
            <span key={c} className="rounded-md border border-primary/20 bg-primary-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatPanel({ conv, lead, onBack }: { conv: Conversation; lead: Lead; onBack: () => void }) {
  const { state, actions } = useDemo();
  const { navigate } = useRouter();
  const [text, setText] = React.useState("");
  const [as, setAs] = React.useState<"lead" | "agent">(conv.mode === "agent" ? "agent" : "lead");
  const scroller = React.useRef<HTMLDivElement>(null);
  const typing = state.typing[lead.id];
  const replaying = state.replaying === lead.id;

  React.useEffect(() => setAs(conv.mode === "agent" ? "agent" : "lead"), [conv.leadId, conv.mode]);
  React.useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [conv.messages.length, typing]);
  React.useEffect(() => actions.markConversationRead(lead.id), [lead.id, conv.messages.length, actions]);

  const send = (value = text) => {
    const v = value.trim();
    if (!v || replaying) return;
    void actions.sendMessage(lead.id, as, v);
    setText("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b bg-surface px-3 py-2.5 sm:px-4">
        <Button variant="ghost" size="icon-sm" className="-ml-1 lg:hidden" onClick={onBack} aria-label="Back to conversations"><ArrowLeft /></Button>
        <Avatar name={lead.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{lead.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">
            {conv.channel} · {replaying ? "AI qualifying live…" : typing ? "AI assistant is typing…" : conv.mode === "ai" ? "AI assistant handling" : `${agentById(lead.agentId)?.name ?? "Agent"} handling`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {lead.id === "l1" && (
            replaying ? (
              <Button size="sm" variant="outline" onClick={actions.stopReplay} aria-label="Stop replay"><Square /><span className="hidden sm:inline">Stop</span></Button>
            ) : (
              <Button size="sm" onClick={actions.replayConversation} aria-label="Replay live"><Play /><span className="hidden sm:inline">Replay live</span></Button>
            )
          )}
          <Button
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex"
            disabled={replaying}
            onClick={() => actions.setConversationMode(lead.id, conv.mode === "ai" ? "agent" : "ai")}
          >
            {conv.mode === "ai" ? <><Headset />Take over</> : <><Bot />Hand back to AI</>}
          </Button>
        </div>
      </div>

      <div ref={scroller} className="wa-pattern min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-4 sm:px-5">
        {conv.messages.length === 0 && !typing && (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Waiting for the first message…</div>
        )}
        {conv.messages.map((m) => <Bubble key={m.id} m={m} lead={lead} />)}
        {typing && (
          <div className="flex justify-end">
            <div className="flex items-center gap-1 rounded-2xl rounded-tr-md bg-whatsapp-bubble px-4 py-3 shadow-sm">
              {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-typing rounded-full bg-foreground/50" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>

      <div className="border-t bg-surface p-3">
        {as === "lead" && !replaying && (
          <div className="no-scrollbar -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1">
            {CUSTOMER_SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border bg-subtle/60 px-2.5 py-1 text-[12px] text-muted-foreground hover:border-primary/40 hover:text-foreground">
                {s}
              </button>
            ))}
          </div>
        )}
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <div className="flex shrink-0 rounded-lg border p-0.5 text-[12px] font-medium" role="radiogroup" aria-label="Send as">
            <button type="button" role="radio" aria-checked={as === "lead"} onClick={() => setAs("lead")} className={cn("rounded-md px-2 py-1", as === "lead" ? "bg-foreground text-background" : "text-muted-foreground")}>Customer</button>
            <button type="button" role="radio" aria-checked={as === "agent"} onClick={() => setAs("agent")} className={cn("rounded-md px-2 py-1", as === "agent" ? "bg-foreground text-background" : "text-muted-foreground")}>Agent</button>
          </div>
          <input
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={replaying}
            placeholder={replaying ? "Replay in progress…" : as === "lead" ? "Type as the customer to test the AI…" : "Reply as the agent…"}
            className="h-10 min-w-0 flex-1 rounded-full border border-input bg-subtle/60 px-4 text-[14px] focus-visible:bg-surface focus-visible:ring-offset-0 disabled:opacity-60"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-full" disabled={!text.trim() || replaying} aria-label="Send"><Send /></Button>
        </form>
        <p className="mt-2 hidden text-[11px] text-muted-foreground sm:block">
          {as === "lead" ? "Demo: messages typed as Customer simulate an incoming WhatsApp message. The AI replies and updates the CRM." : "Agent messages pause nothing; hand back to AI any time."}
          {" "}
          <button onClick={() => navigate(`/app/leads/${lead.id}`)} className="font-medium text-primary hover:underline">Open lead profile</button>
        </p>
      </div>
    </div>
  );
}

/* ---------------- intelligence panel ---------------- */

function IntelRow({ label, value }: { label: string; value: string | null }) {
  const [flash, setFlash] = React.useState(false);
  const prev = React.useRef(value);
  React.useEffect(() => {
    if (prev.current !== value && value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1600);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-lg px-2.5 py-2", flash && "animate-flash")}>
      <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[13.5px] font-semibold">
        {value ?? <span className="inline-flex items-center gap-1.5 text-[12px] font-normal text-muted-foreground/80"><span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/50" />Listening</span>}
      </dd>
    </div>
  );
}

function IntelligencePanel({ lead }: { lead: Lead }) {
  const { navigate } = useRouter();
  const i = lead.interest;
  const [tab, setTab] = React.useState<"profile" | "score" | "matches">("profile");
  const filled = [i.bedrooms !== null, i.location, i.budget, i.intent, i.purpose, i.timeline].filter(Boolean).length;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-[14px] font-bold"><Sparkles className="size-4 text-primary" />AI Lead Intelligence</p>
          <Badge variant="primary" className="num">{filled}/6 captured</Badge>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">Structured data extracted from the conversation in real time.</p>
      </div>
      <div className="flex gap-1 border-b px-3 py-2" role="tablist">
        {(["profile", "score", "matches"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-md px-2.5 py-1 text-[12.5px] font-medium capitalize", tab === t ? "bg-subtle text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t === "matches" ? "Property matches" : t === "score" ? "Scoring" : "Profile"}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "profile" && (
          <>
            <div className="mb-3 flex items-center gap-4 rounded-xl border p-3">
              <ScoreRing score={lead.score.total} t={lead.score.temperature} size={84} stroke={8} />
              <div className="min-w-0">
                <p className="eyebrow">Lead score</p>
                <p className="num font-display text-lg font-extrabold">{lead.score.total}/100</p>
                <TempBadge t={lead.score.temperature} size="lg" className="mt-1" />
              </div>
            </div>
            <dl className="flex flex-col">
              <IntelRow label="Property" value={i.bedrooms === null ? null : `${i.bedrooms === 0 ? "Studio" : `${i.bedrooms} Bedroom`}${i.propertyType && i.propertyType !== "Apartment" ? ` ${i.propertyType}` : ""}`} />
              <IntelRow label="Location" value={i.location} />
              <IntelRow label="Budget" value={i.budget ? formatAEDShort(i.budget) : null} />
              <IntelRow label="Buy / Rent" value={i.intent} />
              <IntelRow label="Purpose" value={i.purpose} />
              <IntelRow label="Timeline" value={i.timeline === "Within 30 days" ? "30 days" : i.timeline} />
              <IntelRow label="Financing" value={i.financing && i.financing !== "Not discussed" ? i.financing : null} />
              <IntelRow label="Status" value={lead.score.temperature.toUpperCase()} />
            </dl>
            <div className="mt-3 rounded-xl bg-primary-soft/60 p-3">
              <p className="eyebrow mb-1 text-accent-foreground">AI summary</p>
              <p className="text-[13px] leading-relaxed">{lead.summary}</p>
            </div>
          </>
        )}
        {tab === "score" && <ScoreBreakdown score={lead.score} compact className="p-1" />}
        {tab === "matches" && <PropertyMatches interest={i} />}
      </div>
      <div className="border-t p-3">
        <Button variant="outline" className="w-full" onClick={() => navigate(`/app/leads/${lead.id}`)}>
          Open CRM record <ArrowRight />
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Last update {timeAgo(lead.lastContact)}</p>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function ConversationsPage({ id }: { id?: string }) {
  const { state, actions } = useDemo();
  const { navigate } = useRouter();
  const selectedId = id ?? (typeof window !== "undefined" && window.innerWidth >= 1024 ? state.conversations[0]?.leadId : undefined);
  const conv = state.conversations.find((c) => c.leadId === selectedId);
  const lead = state.leads.find((l) => l.id === selectedId);

  const select = (lid: string) => navigate(`/app/conversations/${lid}`);

  return (
    <>
      <PageHeader
        title="AI Conversations"
        description="WhatsApp, Instagram, Facebook and website chats answered by AI in seconds. The panel on the right shows what the AI has understood."
        actions={
          <>
            <Button variant="outline" onClick={() => { navigate("/app/conversations/l1"); setTimeout(actions.replayConversation, 50); }}>
              <Play />
              Replay Ahmed's conversation
            </Button>
            <Button onClick={() => select(actions.startTestConversation())}>
              <MessageCirclePlus />
              Test the AI yourself
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)] xl:h-[calc(100vh-220px)] xl:min-h-[600px] xl:grid-cols-[290px_minmax(0,1fr)_340px]">
          <div className={cn("min-h-0 border-r lg:h-[640px] xl:h-auto", selectedId ? "hidden lg:block" : "block h-[70vh]")}>
            <ConversationList activeId={selectedId} onSelect={select} />
          </div>
          {conv && lead ? (
            <>
              <div className="h-[72vh] min-h-0 min-w-0 lg:h-[640px] xl:h-auto">
                <ChatPanel conv={conv} lead={lead} onBack={() => navigate("/app/conversations")} />
              </div>
              <div className="min-h-0 min-w-0 border-t lg:col-span-2 xl:col-span-1 xl:border-l xl:border-t-0">
                <IntelligencePanel lead={lead} />
              </div>
            </>
          ) : selectedId ? (
            <EmptyState icon={MessagesSquare} title="No conversation for this lead yet" description="Open the lead and use Contact Lead to start one." className="lg:col-span-2" />
          ) : (
            <div className="hidden lg:flex lg:col-span-2">
              <EmptyState icon={MessagesSquare} title="Select a conversation" description="Pick a chat on the left, or test the AI with your own messages." className="m-auto" />
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
