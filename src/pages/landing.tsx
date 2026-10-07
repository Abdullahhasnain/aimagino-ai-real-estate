import * as React from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CalendarCheck,
  Check,
  CheckCheck,
  Clock,
  Database,
  EyeOff,
  Gauge,
  Inbox,
  Languages,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  MessagesSquare,
  Moon,
  Repeat,
  Search,
  Sparkles,
  Target,
  Timer,
  UserX,
  X,
  Zap,
  Menu,
} from "lucide-react";
import { Link, useRouter } from "@/lib/router";
import { Logo, DemoBadge } from "@/components/shared/brand";
import { ScoreRing } from "@/components/shared/lead-bits";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */

const PROBLEMS = [
  { icon: Timer, t: "Slow lead response", d: "The buyer messages three agencies. The first one to reply usually gets the viewing." },
  { icon: ListChecks, t: "Poor lead qualification", d: "Agents spend their day on enquiries that were never going to buy." },
  { icon: Repeat, t: "Missed follow-ups", d: "Warm leads go quiet because nobody had time to message them back." },
  { icon: MessageCircle, t: "Too many WhatsApp chats", d: "Hundreds of threads across personal phones, with no shared view." },
  { icon: Database, t: "Manual CRM updates", d: "Requirements live in chat history, not in the CRM where managers can see them." },
  { icon: EyeOff, t: "Poor lead visibility", d: "Managers can't see which leads are hot, who owns them or what happens next." },
  { icon: UserX, t: "Forgotten leads", d: "Enquiries from last month's campaign are never contacted again." },
  { icon: Target, t: "No prioritisation", d: "A cash buyer ready this month waits in the same queue as a casual browser." },
  { icon: Moon, t: "After-hours enquiries", d: "Evening and weekend enquiries sit unanswered until the next working day." },
];

const STEPS = [
  { icon: Inbox, t: "New lead", d: "An enquiry arrives from your website, WhatsApp, Instagram, Facebook or a property portal." },
  { icon: Bot, t: "AI conversation", d: "The AI replies within seconds, day or night, in the lead's own language." },
  { icon: ListChecks, t: "Lead qualification", d: "It asks what an agent would: buy or rent, area, bedrooms, budget, timeline, purpose." },
  { icon: Gauge, t: "AI lead scoring", d: "Each lead is scored hot, warm or cold, with the reasons shown so agents trust it." },
  { icon: Database, t: "CRM record", d: "Requirements, transcript and score are saved automatically. No copy-pasting." },
  { icon: Repeat, t: "Follow-up", d: "Personalised follow-ups go out on schedule, and the agent is alerted when a lead replies." },
  { icon: CalendarCheck, t: "Appointment", d: "Qualified leads are offered real slots and the viewing lands in the agent's calendar." },
  { icon: LayoutDashboard, t: "Sales dashboard", d: "Managers see the whole pipeline: who is hot, what's booked, and what needs attention." },
];

const FEATURES = [
  { icon: Zap, t: "Instant response on every channel", d: "WhatsApp, Instagram, Facebook, website and portal enquiries answered in one place." },
  { icon: ListChecks, t: "Qualification that sounds human", d: "Natural questions, one at a time, following your agency's own playbook." },
  { icon: Gauge, t: "Transparent lead scoring", d: "Budget, intent, timeline, property fit and engagement, each shown as a factor." },
  { icon: Search, t: "AI property matching", d: "Every lead is matched to the best-fit listings in your inventory." },
  { icon: Repeat, t: "Automated follow-ups", d: "No lead goes quiet without a timely, relevant message." },
  { icon: CalendarCheck, t: "Appointment booking", d: "Viewings booked straight into agent calendars, with reminders." },
  { icon: Database, t: "CRM automation", d: "Records created and updated from the conversation, not from memory." },
  { icon: Languages, t: "Multilingual by default", d: "English, Arabic, Russian and more, detected automatically." },
  { icon: BarChart3, t: "Sales analytics", d: "Lead flow, sources, conversion and agent workload at a glance." },
];

/* ------------------------------------------------------------------ */

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      {/* Chat */}
      <div className="overflow-hidden rounded-2xl border bg-surface shadow-lift">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[hsl(28_80%_92%)] text-[12px] font-semibold text-[hsl(24_70%_34%)]">AK</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold">Ahmed Khan</p>
            <p className="text-[11.5px] text-muted-foreground">WhatsApp · AI assistant handling</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
            <span className="size-1.5 rounded-full bg-success" />
            Live
          </span>
        </div>
        <div className="wa-pattern flex flex-col gap-2 px-4 py-4 pb-24 text-[13px] sm:pb-6 sm:pr-[200px]">
          <div className="max-w-[88%] self-start rounded-xl rounded-tl-sm bg-surface px-3 py-2 shadow-sm">
            Hi, I'm looking for a 2 bedroom apartment in Dubai Marina.
            <div className="mt-1.5 flex flex-wrap gap-1">
              {["2 Bedroom", "Dubai Marina"].map((c) => <span key={c} className="rounded bg-primary-soft px-1.5 py-0.5 text-[10.5px] font-medium text-accent-foreground">{c}</span>)}
            </div>
          </div>
          <div className="max-w-[88%] self-end rounded-xl rounded-tr-sm bg-whatsapp-bubble px-3 py-2 shadow-sm">
            <p className="mb-0.5 text-[10.5px] font-semibold text-whatsapp">AI assistant · 8s</p>
            Absolutely. Are you looking to buy or rent?
          </div>
          <div className="max-w-[88%] self-start rounded-xl rounded-tl-sm bg-surface px-3 py-2 shadow-sm">
            Buy. Around AED 1.5 million, within the next month.
            <div className="mt-1.5 flex flex-wrap gap-1">
              {["Buy", "AED 1.5M", "30 days"].map((c) => <span key={c} className="rounded bg-primary-soft px-1.5 py-0.5 text-[10.5px] font-medium text-accent-foreground">{c}</span>)}
            </div>
          </div>
          <div className="max-w-[88%] self-end rounded-xl rounded-tr-sm bg-whatsapp-bubble px-3 py-2 shadow-sm">
            Perfect. Would Friday at 5:00 PM work for a viewing?
            <span className="mt-0.5 flex justify-end"><CheckCheck className="size-3.5 text-[hsl(204_80%_52%)]" /></span>
          </div>
        </div>
      </div>

      {/* Intelligence card */}
      <div className="absolute -bottom-6 right-3 w-[210px] rounded-2xl border bg-surface p-3.5 shadow-lift sm:-right-6 sm:bottom-auto sm:top-16">
        <p className="flex items-center gap-1.5 text-[11.5px] font-bold"><Sparkles className="size-3.5 text-primary" />AI Lead Intelligence</p>
        <div className="mt-3 flex items-center gap-3">
          <ScoreRing score={87} t="hot" size={64} stroke={6} label="" />
          <div>
            <p className="num font-display text-[15px] font-extrabold leading-none">87/100</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-hot-soft px-1.5 py-0.5 text-[10.5px] font-bold uppercase text-hot">Hot lead</span>
          </div>
        </div>
        <dl className="mt-3 hidden space-y-1.5 text-[11.5px] sm:block">
          {[["Property", "2 Bedroom"], ["Location", "Dubai Marina"], ["Budget", "AED 1.5M"], ["Purpose", "Investment"], ["Timeline", "30 days"]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
      </div>

      {/* Booking toast */}
      <div className="absolute -bottom-10 left-3 hidden items-center gap-2.5 rounded-xl border bg-surface px-3 py-2.5 shadow-lift sm:flex">
        <span className="flex size-8 items-center justify-center rounded-lg bg-success-soft text-success"><CalendarCheck className="size-4" /></span>
        <div>
          <p className="text-[12.5px] font-semibold">Viewing booked by AI</p>
          <p className="text-[11px] text-muted-foreground">Fri 5:00 PM · Omar Saleh notified</p>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title, sub, center }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={cn("mb-10 max-w-2xl", center && "mx-auto text-center")}>
      <p className="eyebrow mb-3 text-primary">{eyebrow}</p>
      <h2 className="text-[28px] font-extrabold leading-[1.15] sm:text-[36px]">{title}</h2>
      {sub && <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

function FeatureRow({ eyebrow, title, body, bullets, visual, flip }: { eyebrow: string; title: string; body: string; bullets: string[]; visual: React.ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn(flip && "lg:order-2")}>
        <p className="eyebrow mb-3 text-primary">{eyebrow}</p>
        <h3 className="text-[24px] font-extrabold leading-tight sm:text-[28px]">{title}</h3>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">{body}</p>
        <ul className="mt-5 flex flex-col gap-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2.5 text-[14px]"><Check className="mt-0.5 size-4 shrink-0 text-success" />{b}</li>
          ))}
        </ul>
      </div>
      <div className={cn("rounded-2xl border bg-subtle/60 p-5 sm:p-8", flip && "lg:order-1")}>{visual}</div>
    </div>
  );
}

/* ---------- small visuals for feature rows ---------- */

const QualVisual = () => (
  <div className="rounded-xl border bg-surface p-4 shadow-card">
    <p className="mb-3 flex items-center gap-1.5 text-[12.5px] font-bold"><Sparkles className="size-3.5 text-primary" />Captured from WhatsApp</p>
    <dl className="grid grid-cols-2 gap-2 text-[12.5px]">
      {[["Intent", "Buy"], ["Area", "Business Bay"], ["Bedrooms", "2"], ["Budget", "AED 2.1M"], ["Timeline", "Immediately"], ["Financing", "Cash buyer"]].map(([k, v]) => (
        <div key={k} className="rounded-lg bg-subtle px-3 py-2"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
      ))}
    </dl>
    <div className="mt-3 flex items-center justify-between rounded-lg border border-hot/25 bg-hot-soft px-3 py-2 text-[12.5px] text-hot">
      <span className="font-semibold">Lead score 88/100 · HOT</span>
      <span className="text-[11px]">Qualified in 3 min</span>
    </div>
  </div>
);

const FollowVisual = () => (
  <div className="rounded-xl border bg-surface p-4 shadow-card">
    {[
      ["Lead went quiet", "No reply for 24 hours", true],
      ["AI follow-up sent", "“Two JVC options under AED 800K…”", true],
      ["Lead replied", "“Yes please, send details”", true],
      ["Agent notified", "Omar Saleh · WhatsApp alert", false],
    ].map(([t, d, done], i, arr) => (
      <div key={t as string} className="relative flex gap-3 pb-4 last:pb-0">
        {i < arr.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-16px)] w-px bg-success/50" />}
        <span className={cn("relative z-10 flex size-6 items-center justify-center rounded-full", done ? "bg-success text-white" : "border-2 border-primary bg-surface text-primary")}>
          {done ? <Check className="size-3.5" /> : <Bell className="size-3" />}
        </span>
        <div><p className="text-[13px] font-semibold">{t}</p><p className="text-[12px] text-muted-foreground">{d}</p></div>
      </div>
    ))}
  </div>
);

const CrmVisual = () => (
  <div className="rounded-xl border bg-surface shadow-card">
    <div className="flex items-center justify-between border-b px-4 py-3">
      <p className="text-[13px] font-bold">CRM record · Sarah Ali</p>
      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent-foreground">Auto-updated</span>
    </div>
    <div className="divide-y text-[12.5px]">
      {[["Source", "Instagram"], ["Interest", "1 Bedroom Apartment"], ["Location", "Downtown Dubai"], ["Budget", "AED 900,000"], ["Next step", "Consultation · Saturday 11:00 AM"]].map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 px-4 py-2.5"><span className="text-muted-foreground">{k}</span><span className="text-right font-semibold">{v}</span></div>
      ))}
    </div>
  </div>
);

const ApptVisual = () => (
  <div className="rounded-xl border bg-surface p-4 shadow-card">
    <p className="text-[13px] font-semibold">Omar Saleh · available slots</p>
    <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
      {["Thu 4:00 PM", "Fri 11:00 AM", "Fri 5:00 PM", "Sat 10:00 AM", "Sat 2:00 PM", "Sun 12:00 PM"].map((s) => (
        <span key={s} className={cn("rounded-lg border px-2 py-2 text-center font-medium", s === "Fri 5:00 PM" ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground")}>{s}</span>
      ))}
    </div>
    <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-success-soft px-3 py-2.5 text-[12.5px] text-success">
      <CalendarCheck className="size-4" />
      Viewing confirmed · Dubai Marina · reminder set for Thursday
    </div>
  </div>
);

const AnalyticsVisual = () => (
  <div className="rounded-xl border bg-surface p-4 shadow-card">
    <div className="mb-3 flex items-center justify-between"><p className="text-[13px] font-semibold">Weekly funnel</p><span className="text-[10.5px] font-semibold uppercase tracking-wide text-warm">Demo data</span></div>
    {[["New leads", 24], ["Qualified", 15], ["Hot", 7], ["Appointments", 6]].map(([k, v]) => (
      <div key={k as string} className="mb-2.5 last:mb-0">
        <div className="mb-1 flex justify-between text-[12.5px]"><span>{k}</span><span className="num font-mono font-semibold">{v}</span></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-subtle"><div className="h-full rounded-full bg-primary" style={{ width: `${((v as number) / 24) * 100}%` }} /></div>
      </div>
    ))}
  </div>
);

/* ---------- ROI calculator ---------- */

function RoiCalculator() {
  const [leads, setLeads] = React.useState(300);
  const [minutes, setMinutes] = React.useState(15);
  const [after, setAfter] = React.useState(35);
  const [price, setPrice] = React.useState(1_500_000);
  const automation = 0.7; // share of first-touch qualification handled by AI (assumption, shown)
  const hours = Math.round((leads * minutes * automation) / 60);
  const afterHours = Math.round((leads * after) / 100);
  const commission = Math.round(price * 0.02);
  const fte = (hours / 160).toFixed(1);
  return (
    <div className="grid gap-6 rounded-2xl border bg-surface p-5 shadow-card sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      <div className="flex flex-col gap-6">
        {[
          { id: "roi-leads", label: "Enquiries per month", value: leads, set: setLeads, min: 50, max: 2000, step: 50, fmt: (v: number) => v.toLocaleString() },
          { id: "roi-min", label: "Agent minutes to respond & qualify each", value: minutes, set: setMinutes, min: 5, max: 45, step: 5, fmt: (v: number) => `${v} min` },
          { id: "roi-after", label: "Share arriving after hours", value: after, set: setAfter, min: 0, max: 70, step: 5, fmt: (v: number) => `${v}%` },
        ].map((f) => (
          <div key={f.id}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label htmlFor={f.id} className="text-[13.5px] font-medium">{f.label}</label>
              <span className="num font-mono text-[14px] font-semibold">{f.fmt(f.value)}</span>
            </div>
            <input id={f.id} type="range" min={f.min} max={f.max} step={f.step} value={f.value} onChange={(e) => f.set(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
          </div>
        ))}
        <div>
          <label htmlFor="roi-price" className="mb-2 block text-[13.5px] font-medium">Typical property price</label>
          <Select id="roi-price" value={price} onChange={(e) => setPrice(Number(e.target.value))}>
            {[800_000, 1_500_000, 2_500_000, 5_000_000].map((p) => <option key={p} value={p}>AED {p.toLocaleString()}</option>)}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="rounded-xl bg-primary-soft p-5">
          <p className="text-[13px] font-medium text-accent-foreground">Agent time handled by AI each month</p>
          <p className="num mt-1 font-display text-[40px] font-extrabold leading-none">{hours.toLocaleString()} hours</p>
          <p className="mt-2 text-[12.5px] text-muted-foreground">About {fte} full-time agents' worth of first replies and qualification.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="num font-display text-2xl font-extrabold">{afterHours.toLocaleString()}</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">after-hours enquiries answered in seconds instead of the next morning</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="num font-display text-2xl font-extrabold">AED {commission.toLocaleString()}</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">typical 2% commission on one extra sale at this price</p>
          </div>
        </div>
        <p className="text-[11.5px] leading-snug text-muted-foreground">
          Illustrative estimate from your inputs, assuming AI handles {Math.round(automation * 100)}% of first-touch qualification. Not a guarantee of results; actual impact depends on your lead volume, processes and team.
        </p>
      </div>
    </div>
  );
}

/* ---------- booking dialog ---------- */

function BookDemoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = React.useState<string | null>(null);
  React.useEffect(() => { if (open) setSent(null); }, [open]);
  return (
    <Dialog open={open} onClose={onClose} title={BRAND.cta} description="A 30-minute walkthrough of how this would work with your leads, channels and team.">
      {sent ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-success-soft text-success"><Check className="size-6" /></span>
          <p className="text-[16px] font-bold">Thanks, {sent}</p>
          <p className="mt-1.5 max-w-sm text-[13.5px] text-muted-foreground">
            This demo page doesn't send form data anywhere. Your {BRAND.company} consultant will share a booking link with you directly.
          </p>
          {(BRAND.contactEmail || BRAND.contactPhone) && (
            <div className="mt-4 rounded-lg bg-subtle px-4 py-2.5 text-[13.5px]">
              {BRAND.contactEmail && <p className="select-all font-medium">{BRAND.contactEmail}</p>}
              {BRAND.contactPhone && <p className="select-all font-medium">{BRAND.contactPhone}</p>}
            </div>
          )}
          <Button className="mt-5" onClick={onClose}>Close</Button>
        </div>
      ) : (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setSent(String(f.get("name") || "").split(" ")[0] || "there");
          }}
        >
          <div><Label htmlFor="bd-name">Your name</Label><Input id="bd-name" name="name" required placeholder="Full name" /></div>
          <div><Label htmlFor="bd-agency">Agency</Label><Input id="bd-agency" name="agency" required placeholder="Agency name" /></div>
          <div><Label htmlFor="bd-email">Work email</Label><Input id="bd-email" name="email" type="email" required placeholder="name@agency.ae" /></div>
          <div><Label htmlFor="bd-phone">WhatsApp number</Label><Input id="bd-phone" name="phone" placeholder="+971" /></div>
          <div className="sm:col-span-2">
            <Label htmlFor="bd-volume">Enquiries per month</Label>
            <Select id="bd-volume" name="volume" defaultValue="100-500">
              <option value="0-100">Under 100</option>
              <option value="100-500">100 – 500</option>
              <option value="500-2000">500 – 2,000</option>
              <option value="2000+">2,000+</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Request demo</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const { navigate } = useRouter();
  const [book, setBook] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const scrollTo = (id: string) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const BookCta = ({ className, variant = "default" }: { className?: string; variant?: "default" | "outline" | "secondary" }) =>
    BRAND.bookingUrl ? (
      <a href={BRAND.bookingUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ size: "lg", variant }), className)}>{BRAND.cta}</a>
    ) : (
      <Button size="lg" variant={variant} className={className} onClick={() => setBook(true)}>{BRAND.cta}</Button>
    );

  const nav = [
    ["problem", "The problem"],
    ["how", "How it works"],
    ["features", "Features"],
    ["roi", "ROI"],
  ] as const;

  return (
    <div id="main-scroll" className="h-full overflow-y-auto bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map(([id, l]) => (
              <button key={id} onClick={() => scrollTo(id)} className="rounded-md px-3 py-1.5 text-[13.5px] font-medium text-muted-foreground hover:text-foreground">{l}</button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <DemoBadge className="hidden sm:inline-flex" />
            <Button onClick={() => navigate("/app")} className="hidden sm:inline-flex">View Live Demo <ArrowRight /></Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">{menu ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {menu && (
          <div className="border-t px-4 py-3 lg:hidden">
            <div className="flex flex-col">
              {nav.map(([id, l]) => (
                <button key={id} onClick={() => scrollTo(id)} className="rounded-md px-2 py-2.5 text-left text-[14px] font-medium">{l}</button>
              ))}
              <Button onClick={() => navigate("/app")} className="mt-2">View Live Demo <ArrowRight /></Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_70%_20%,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-[12.5px] font-medium text-muted-foreground shadow-card">
              <span className="size-1.5 rounded-full bg-primary" />
              For real estate agencies & brokers in Dubai and the UAE
            </p>
            <h1 className="text-[38px] font-extrabold leading-[1.05] tracking-[-0.025em] sm:text-[52px] lg:text-[58px]">
              Turn Real Estate Leads Into <span className="text-primary">Qualified Appointments</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-muted-foreground sm:text-[18px]">
              AI-powered lead response, qualification, follow-up and CRM automation for real estate teams.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate("/app")}>View Live Demo <ArrowRight /></Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo("how")}>See How It Works</Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
              {[
                [Clock, "Replies in seconds, 24/7"],
                [Languages, "English, Arabic, Russian & more"],
                [MessagesSquare, "WhatsApp, Instagram, web & portals"],
              ].map(([I, t]) => {
                const Icon = I as typeof Clock;
                return <li key={t as string} className="flex items-center gap-1.5"><Icon className="size-4 text-primary" />{t as string}</li>;
              })}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* Flow strip */}
      <section className="border-y bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              [Inbox, "Lead"],
              [Bot, "AI"],
              [ListChecks, "Qualification"],
              [Database, "CRM"],
              [Repeat, "Follow-up"],
              [CalendarCheck, "Appointment"],
            ].map(([I, t], i) => {
              const Icon = I as typeof Inbox;
              return (
                <li key={t as string} className="flex items-center gap-3 rounded-xl border bg-background px-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-accent-foreground"><Icon className="size-4" /></span>
                  <span className="text-[13.5px] font-semibold">{t as string}</span>
                  {i < 5 && <ArrowRight className="ml-auto hidden size-4 text-muted-foreground/60 lg:block" />}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="scroll-mt-20">
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-24">
          <SectionHead
            eyebrow="The problem"
            title="Your leads are already there. They're slipping through the gaps."
            sub="Agencies spend heavily on ads and portal listings. The leak happens after the enquiry arrives, when busy agents can't reply, qualify and follow up fast enough."
          />
          <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((p) => (
              <li key={p.t} className="bg-surface p-6">
                <p.icon className="size-5 text-hot" />
                <p className="mt-3 text-[15px] font-bold">{p.t}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{p.d}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 overflow-x-auto rounded-2xl border bg-surface">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b">
                  <th className="px-5 py-3.5 font-semibold text-muted-foreground">When a new enquiry arrives</th>
                  <th className="px-5 py-3.5 font-semibold">Today</th>
                  <th className="px-5 py-3.5 font-semibold text-primary">With AImagino</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  ["First reply", "When an agent is free", "Within seconds, day or night"],
                  ["Qualification", "Depends on the agent", "Same questions, every lead"],
                  ["Priority", "First come, first served", "Hot leads flagged instantly"],
                  ["CRM", "Updated later, if at all", "Updated automatically"],
                  ["Follow-up", "When someone remembers", "Scheduled and sent automatically"],
                  ["Viewing", "Back-and-forth messages", "Booked into the agent's calendar"],
                ].map(([k, a, b]) => (
                  <tr key={k}>
                    <td className="px-5 py-3 font-medium">{k}</td>
                    <td className="px-5 py-3 text-muted-foreground"><span className="inline-flex items-center gap-2"><X className="size-3.5 text-danger" />{a}</span></td>
                    <td className="px-5 py-3 font-medium"><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-success" />{b}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-y bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-24">
          <SectionHead eyebrow="How AImagino works" title="One automated path from enquiry to viewing" sub="Every lead follows the same eight steps. Your agents step in where they add the most value: viewings, negotiation and closing." />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="relative rounded-2xl border bg-background p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-accent-foreground"><s.icon className="size-5" /></span>
                  <span className="num font-mono text-[12px] font-semibold text-muted-foreground">Step {i + 1}</span>
                </div>
                <p className="mt-4 text-[15px] font-bold">{s.t}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <Button size="lg" onClick={() => navigate("/app/conversations/l1")}><MessagesSquare />Watch the AI qualify a lead</Button>
            <p className="text-[12.5px] text-muted-foreground">Opens the live demo with a sample WhatsApp conversation.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-24">
          <SectionHead eyebrow="Key features" title="Built for how property is actually sold" sub="Not a generic chatbot. A sales operations layer that works with the channels, agents and CRM you already have." />
          <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.t} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-surface text-primary shadow-card"><f.icon className="size-5" /></span>
                <div>
                  <p className="text-[15px] font-bold">{f.t}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-24 flex flex-col gap-24">
            <FeatureRow
              eyebrow="Lead qualification"
              title="Know who's ready to buy before an agent picks up the phone"
              body="The AI asks the questions your best agent would, in a natural conversation, and turns the answers into a structured profile."
              bullets={["Buy or rent, area, bedrooms, budget, timeline and purpose", "Understands “1.5m”, “JVC” and “next month”", "Replies in the lead's language, including Arabic"]}
              visual={<QualVisual />}
            />
            <FeatureRow
              flip
              eyebrow="AI follow-ups"
              title="No lead goes quiet without a reason"
              body="Follow-ups are scheduled from the conversation and personalised with matching listings. When the lead replies, the right agent knows immediately."
              bullets={["Timed by lead temperature and timeline", "WhatsApp, email or a call task for the agent", "Agent alerted the moment a lead responds"]}
              visual={<FollowVisual />}
            />
            <FeatureRow
              eyebrow="CRM automation"
              title="Your CRM, filled in from the conversation"
              body="Every requirement, score, transcript and next step is written to the lead record automatically, so managers see the real pipeline."
              bullets={["Record created on the first message", "Updated as the lead answers each question", "Connects to your existing CRM during setup"]}
              visual={<CrmVisual />}
            />
            <FeatureRow
              flip
              eyebrow="Appointment booking"
              title="From “is it available?” to a booked viewing"
              body="Qualified leads are offered real availability from the right agent, and the booking lands in their calendar with reminders on both sides."
              bullets={["Routes to the community specialist", "Confirmation and reminders on WhatsApp", "Reschedule or cancel in one click"]}
              visual={<ApptVisual />}
            />
            <FeatureRow
              eyebrow="Analytics"
              title="See the whole pipeline, not just the busiest phone"
              body="Track lead sources, conversion from enquiry to viewing, response times and agent workload in one dashboard."
              bullets={["Funnel from new lead to appointment", "Which channels bring hot leads", "When enquiries arrive, including after hours"]}
              visual={<AnalyticsVisual />}
            />
          </div>
        </div>
      </section>

      {/* ROI */}
      <section id="roi" className="scroll-mt-20 border-y bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-24">
          <SectionHead eyebrow="The ROI story" title="What would your team do with the time back?" sub="Adjust the numbers to match your agency. The estimate updates instantly." />
          <RoiCalculator />
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-24">
          <div className="rounded-3xl bg-foreground px-6 py-14 text-center text-background sm:px-12">
            <p className="eyebrow mb-4 text-background/60">{BRAND.company}</p>
            <h2 className="mx-auto max-w-3xl text-[30px] font-extrabold leading-tight sm:text-[40px]">{BRAND.tagline}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-background/70">{BRAND.supporting}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <BookCta className="bg-background text-foreground hover:bg-background/90" />
              <Button size="lg" variant="outline" className="border-background/25 bg-transparent text-background hover:bg-background/10" onClick={() => navigate("/app")}>View Live Demo <ArrowRight /></Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-8 text-[12.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="max-w-lg sm:text-right">© {new Date().getFullYear()} {BRAND.company}. Sales demonstration: all names, listings and figures are fictional sample data, not client results.</p>
        </div>
      </footer>

      <BookDemoDialog open={book} onClose={() => setBook(false)} />
    </div>
  );
}
