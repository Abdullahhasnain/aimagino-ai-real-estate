import * as React from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  ChevronDown,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Repeat,
  RotateCcw,
  Search,
  Settings,
  Users,
  Workflow as WorkflowIcon,
  X,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { Link, useRouter } from "@/lib/router";
import { useDemo, useKpis } from "@/store/demo-store";
import { CURRENT_USER, PROPERTIES } from "@/data/mock";
import { Logo, LogoMark, DemoBadge } from "@/components/shared/brand";
import { TempBadge } from "@/components/shared/lead-bits";
import { Sheet } from "@/components/ui/dialog";
import { Popover } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { cn, formatAEDShort, timeAgo } from "@/lib/utils";

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/leads", label: "Leads", icon: Users, count: "leads" },
  { to: "/app/conversations", label: "AI Conversations", icon: MessagesSquare, count: "unread" },
  { to: "/app/follow-ups", label: "Follow-ups", icon: Repeat, count: "followUps" },
  { to: "/app/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/app/properties", label: "Properties", icon: Building2 },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/automations", label: "Automations", icon: WorkflowIcon },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { path } = useRouter();
  const { state } = useDemo();
  const kpi = useKpis();
  const counts: Record<string, number> = {
    leads: state.leads.filter((l) => l.status === "new").length,
    unread: state.conversations.reduce((a, c) => a + c.unread, 0),
    followUps: kpi.followUps,
  };
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {NAV.map((n) => {
        const active = "exact" in n && n.exact ? path === n.to : path === n.to || path.startsWith(n.to + "/");
        const count = "count" in n ? counts[n.count] : undefined;
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={cn(
              "group flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
              active ? "bg-primary-soft text-accent-foreground" : "text-muted-foreground hover:bg-subtle hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <n.icon className="size-[17px]" />
            <span className="flex-1">{n.label}</span>
            {!!count && (
              <span className={cn("num rounded-full px-1.5 text-[11px] font-semibold", active ? "bg-primary text-primary-foreground" : "bg-subtle text-muted-foreground")}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { state } = useDemo();
  const aiOn = state.workflows.filter((w) => w.active).length;
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-5">
        <Link to="/" onClick={onNavigate} aria-label="Product overview">
          <Logo />
        </Link>
      </div>
      <div className="mx-3 mb-4 rounded-xl border bg-subtle/60 px-3 py-2.5">
        <p className="eyebrow">Workspace</p>
        <p className="mt-0.5 truncate text-[13.5px] font-semibold">{state.agencyName}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="m-3 rounded-xl border p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <p className="text-[12.5px] font-semibold">AI assistant online</p>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">{aiOn} of {state.workflows.length} automations active · replying 24/7</p>
      </div>
    </div>
  );
}

/* ---------------- Global search ---------------- */

function GlobalSearch({ className }: { className?: string }) {
  const { state } = useDemo();
  const { navigate } = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const term = q.trim().toLowerCase();
  const leads = term
    ? state.leads.filter((l) => [l.name, l.phone, l.email, l.interest.location ?? "", l.source].join(" ").toLowerCase().includes(term)).slice(0, 5)
    : [];
  const props = term
    ? PROPERTIES.filter((p) => [p.community, p.building, p.ref, p.type, `${p.bedrooms}br`].join(" ").toLowerCase().includes(term)).slice(0, 4)
    : [];

  const go = (to: string) => {
    navigate(to);
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <Popover
      open={open && term.length > 0}
      onOpenChange={setOpen}
      align="start"
      className="w-[min(420px,calc(100vw-2rem))] p-1.5"
      trigger={
        <div className={cn("relative", className)}>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            id="global-search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (leads[0]) go(`/app/leads/${leads[0].id}`);
                else if (props[0]) go("/app/properties");
              }
            }}
            placeholder="Search leads, properties, phone numbers"
            className="h-9 w-full rounded-lg border border-input bg-subtle/70 pl-9 pr-12 text-[13.5px] placeholder:text-muted-foreground/80 focus-visible:bg-surface focus-visible:ring-offset-0"
            aria-label="Search"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border bg-surface px-1.5 font-mono text-[10.5px] text-muted-foreground sm:block">⌘K</kbd>
        </div>
      }
    >
      {leads.length === 0 && props.length === 0 ? (
        <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">No leads or properties match “{q}”.</p>
      ) : (
        <div className="flex flex-col">
          {leads.length > 0 && <p className="eyebrow px-2.5 pb-1 pt-2">Leads</p>}
          {leads.map((l) => (
            <button key={l.id} onClick={() => go(`/app/leads/${l.id}`)} className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-subtle">
              <Avatar name={l.name} className="size-7 text-[10.5px]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium">{l.name}</span>
                <span className="block truncate text-[12px] text-muted-foreground">{l.interest.location ?? "Location not captured"} · {l.source}</span>
              </span>
              <TempBadge t={l.score.temperature} />
            </button>
          ))}
          {props.length > 0 && <p className="eyebrow px-2.5 pb-1 pt-2">Properties</p>}
          {props.map((p) => (
            <button key={p.id} onClick={() => go("/app/properties")} className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-subtle">
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium">{p.community} · {p.title}</span>
                <span className="block truncate text-[12px] text-muted-foreground">{p.building} · {p.ref}</span>
              </span>
              <span className="num shrink-0 text-[13px] font-semibold">{formatAEDShort(p.price)}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

/* ---------------- Notifications ---------------- */

function Notifications() {
  const { state, actions } = useDemo();
  const { navigate } = useRouter();
  const [open, setOpen] = React.useState(false);
  const unread = state.notifications.filter((n) => !n.read).length;
  const dot = { hot: "bg-hot", primary: "bg-primary", success: "bg-success", warm: "bg-warm" };
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="w-[min(380px,calc(100vw-2rem))]"
      trigger={
        <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative">
          <Bell />
          {unread > 0 && (
            <span className="num absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-hot px-1 text-[10px] font-bold leading-4 text-white">{unread}</span>
          )}
        </Button>
      }
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-[14px] font-bold">Notifications</p>
        <button onClick={actions.markAllRead} className="text-[12.5px] font-medium text-primary hover:underline disabled:opacity-40" disabled={!unread}>
          Mark all read
        </button>
      </div>
      <ul className="max-h-[380px] overflow-y-auto p-1.5">
        {state.notifications.slice(0, 12).map((n) => (
          <li key={n.id}>
            <button
              onClick={() => {
                actions.markRead(n.id);
                if (n.link) navigate(n.link);
                setOpen(false);
              }}
              className={cn("flex w-full gap-3 rounded-lg px-2.5 py-2.5 text-left hover:bg-subtle", !n.read && "bg-primary-soft/50")}
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-border" : dot[n.tone])} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{n.title}</span>
                <span className="block text-[12.5px] text-muted-foreground">{n.body}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground/80">{timeAgo(n.at)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Popover>
  );
}

function ProfileMenu() {
  const { actions } = useDemo();
  const { navigate } = useRouter();
  const [open, setOpen] = React.useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="w-60 p-1.5"
      trigger={
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-subtle" aria-label="Account menu">
          <Avatar name={CURRENT_USER.name} className="size-8 text-[11px]" />
          <span className="hidden text-left leading-tight lg:block">
            <span className="block text-[13px] font-semibold">{CURRENT_USER.name}</span>
            <span className="block text-[11.5px] text-muted-foreground">{CURRENT_USER.role}</span>
          </span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" />
        </button>
      }
    >
      <div className="px-2.5 py-2">
        <p className="text-[13px] font-semibold">{CURRENT_USER.name}</p>
        <p className="text-[12px] text-muted-foreground">Demo account · sample data</p>
      </div>
      <div className="my-1 h-px bg-border" />
      {[
        { label: "Settings", onClick: () => navigate("/app/settings"), icon: Settings },
        { label: "Product overview", onClick: () => navigate("/"), icon: ArrowUpRight },
        { label: "Reset demo data", onClick: actions.resetDemo, icon: RotateCcw },
      ].map((i) => (
        <button key={i.label} onClick={() => { i.onClick(); setOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-subtle">
          <i.icon className="size-4 text-muted-foreground" />
          {i.label}
        </button>
      ))}
    </Popover>
  );
}

/* ---------------- Shell ---------------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = React.useState(false);
  const [mobileSearch, setMobileSearch] = React.useState(false);
  const { actions, state } = useDemo();
  const running = !!state.pipeline && state.pipeline.step < 6 && !state.pipeline.paused;

  return (
    <div className="flex h-full bg-background">
      <aside className="hidden w-[248px] shrink-0 border-r bg-surface lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={mobileNav} onClose={() => setMobileNav(false)}>
        <button onClick={() => setMobileNav(false)} className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-subtle" aria-label="Close menu">
          <X className="size-4" />
        </button>
        <SidebarBody onNavigate={() => setMobileNav(false)} />
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-surface/90 backdrop-blur" style={{ top: "env(safe-area-inset-top, 0px)" }}>
          <div className="flex h-14 items-center gap-2 px-4 lg:px-6">
            <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
              <Menu />
            </Button>
            <span className="lg:hidden"><LogoMark className="size-7" /></span>
            <GlobalSearch className="hidden w-full max-w-md md:block" />
            <div className="ml-auto flex items-center gap-1.5">
              <DemoBadge className="hidden sm:inline-flex" />
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSearch((s) => !s)} aria-label="Search">
                <Search />
              </Button>
              <Button size="sm" onClick={actions.simulateIncomingLead} disabled={running} className="hidden sm:inline-flex">
                <Zap />
                {running ? "Lead arriving…" : "Simulate new lead"}
              </Button>
              <Button size="icon-sm" onClick={actions.simulateIncomingLead} disabled={running} className="sm:hidden" aria-label="Simulate new lead">
                <Zap />
              </Button>
              <Notifications />
              <ProfileMenu />
            </div>
          </div>
          {mobileSearch && (
            <div className="border-t px-4 py-2 md:hidden">
              <GlobalSearch />
            </div>
          )}
        </header>
        <main id="main-scroll" className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-5 sm:pt-6 lg:px-6">
            <div className="mb-4 sm:hidden"><DemoBadge /></div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-[22px] font-extrabold leading-tight sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13.5px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:shrink-0">{actions}</div>}
    </div>
  );
}
