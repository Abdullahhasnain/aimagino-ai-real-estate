import * as React from "react";
import { ArrowUpDown, Download, SearchX, Search, Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Avatar, EmptyState, Segmented } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ScorePill, SourceTag, StatusBadge, TempBadge } from "@/components/shared/lead-bits";
import { agentById, useDemo } from "@/store/demo-store";
import { useRouter } from "@/lib/router";
import { cn, formatAEDShort, formatRelativeDay, timeAgo } from "@/lib/utils";
import type { Lead, LeadSource } from "@/types";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "appointment", label: "Appointment" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

const SOURCES: LeadSource[] = ["Website", "WhatsApp", "Instagram", "Facebook", "Property Portal", "Referral"];

function propertyText(l: Lead) {
  const i = l.interest;
  const bed = i.bedrooms === null ? null : i.bedrooms === 0 ? "Studio" : `${i.bedrooms} Bedroom`;
  const type = i.propertyType && i.propertyType !== "Apartment" ? i.propertyType : null;
  return [bed, type].filter(Boolean).join(" ") || (i.propertyType ?? "—");
}

function matches(l: Lead, f: Filter) {
  if (f === "all") return true;
  if (f === "hot" || f === "warm" || f === "cold") return l.score.temperature === f;
  return l.status === f;
}

export default function LeadsPage() {
  const { state, actions } = useDemo();
  const { navigate } = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [q, setQ] = React.useState("");
  const [source, setSource] = React.useState<string>("all");
  const [sort, setSort] = React.useState<"score" | "newest" | "followup">("score");

  const counts = Object.fromEntries(FILTERS.map((f) => [f.value, state.leads.filter((l) => matches(l, f.value)).length])) as Record<Filter, number>;

  const term = q.trim().toLowerCase();
  const rows = state.leads
    .filter((l) => matches(l, filter))
    .filter((l) => source === "all" || l.source === source)
    .filter((l) => !term || [l.name, l.email, l.phone, l.interest.location ?? "", l.source, agentById(l.agentId)?.name ?? ""].join(" ").toLowerCase().includes(term))
    .sort((a, b) => {
      if (sort === "score") return b.score.total - a.score.total;
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      return (a.nextFollowUp ?? "9999").localeCompare(b.nextFollowUp ?? "9999");
    });

  const open = (id: string) => navigate(`/app/leads/${id}`);

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every enquiry from every channel, qualified and scored by AI. Click a lead to see its full profile."
        actions={
          <>
            <Button variant="outline" onClick={() => actions.toast({ title: "Export prepared", description: `${rows.length} leads ready as CSV. In production this downloads or syncs to your CRM.` })}>
              <Download />
              Export
            </Button>
            <Button onClick={actions.simulateIncomingLead} className="sm:hidden">
              <Zap />
              Simulate new lead
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="lead-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, phone, email, area or agent"
                className="h-9 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground/80 focus-visible:ring-offset-0"
              />
            </div>
            <div className="flex gap-2">
              <Select id="lead-source" value={source} onChange={(e) => setSource(e.target.value)} className="flex-1 sm:w-44 sm:flex-none" aria-label="Source">
                <option value="all">All sources</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select id="lead-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="flex-1 sm:w-44 sm:flex-none" aria-label="Sort">
                <option value="score">Highest score</option>
                <option value="newest">Newest first</option>
                <option value="followup">Next follow-up</option>
              </Select>
            </div>
          </div>
          <Segmented options={FILTERS} value={filter} onChange={setFilter} counts={counts} />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No leads match these filters"
            description="Try a different filter or clear the search to see all leads."
            action={<Button variant="outline" onClick={() => { setQ(""); setFilter("all"); setSource("all"); }}>Clear filters</Button>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px] text-left text-[13px]">
                <thead className="bg-subtle/60 text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {["Lead", "Source", "Property", "Budget", "Location", "Score", "Status", "Assigned Agent", "Last Contact", "Next Follow-up"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-2.5 font-semibold">
                        {h === "Score" ? (
                          <button onClick={() => setSort("score")} className="inline-flex items-center gap-1 uppercase hover:text-foreground">Score <ArrowUpDown className="size-3" /></button>
                        ) : h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((l) => {
                    const agent = agentById(l.agentId);
                    return (
                      <tr
                        key={l.id}
                        onClick={() => open(l.id)}
                        onKeyDown={(e) => e.key === "Enter" && open(l.id)}
                        tabIndex={0}
                        className={cn("cursor-pointer transition-colors hover:bg-subtle/70 focus-visible:bg-subtle", state.flash[l.id] && "animate-flash")}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={l.name} className="size-8 text-[11px]" />
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 font-semibold">{l.name}{l.isNew && <Badge variant="primary">New</Badge>}</p>
                              <p className="text-[12px] text-muted-foreground">{l.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3"><SourceTag source={l.source} /></td>
                        <td className="whitespace-nowrap px-4 py-3">{propertyText(l)}</td>
                        <td className="num whitespace-nowrap px-4 py-3 font-medium">{l.interest.budget ? formatAEDShort(l.interest.budget) + (l.interest.intent === "Rent" ? "/yr" : "") : <span className="text-muted-foreground">—</span>}</td>
                        <td className="whitespace-nowrap px-4 py-3">{l.interest.location ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2"><ScorePill score={l.score.total} t={l.score.temperature} /><TempBadge t={l.score.temperature} /></div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                        <td className="whitespace-nowrap px-4 py-3">{agent ? agent.name : <span className="text-warm">Unassigned</span>}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{timeAgo(l.lastContact)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{l.nextFollowUp ? formatRelativeDay(l.nextFollowUp) : <span className="text-muted-foreground">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <ul className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">
              {rows.map((l) => {
                const agent = agentById(l.agentId);
                return (
                  <li key={l.id}>
                    <button onClick={() => open(l.id)} className={cn("flex w-full flex-col gap-3 rounded-xl border bg-surface p-3.5 text-left transition-colors hover:bg-subtle/60", state.flash[l.id] && "animate-flash")}>
                      <div className="flex items-start gap-3">
                        <Avatar name={l.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{l.name}</p>
                          <SourceTag source={l.source} className="text-[12px]" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <TempBadge t={l.score.temperature} />
                          <span className="num font-mono text-[12px] font-semibold">{l.score.total}/100</span>
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                        <div><dt className="text-muted-foreground">Property</dt><dd className="font-medium">{propertyText(l)}</dd></div>
                        <div><dt className="text-muted-foreground">Budget</dt><dd className="num font-medium">{l.interest.budget ? formatAEDShort(l.interest.budget) : "—"}</dd></div>
                        <div><dt className="text-muted-foreground">Location</dt><dd className="truncate font-medium">{l.interest.location ?? "—"}</dd></div>
                        <div><dt className="text-muted-foreground">Agent</dt><dd className="truncate font-medium">{agent?.name ?? "Unassigned"}</dd></div>
                      </dl>
                      <div className="flex items-center justify-between border-t pt-2.5 text-[12px] text-muted-foreground">
                        <StatusBadge status={l.status} />
                        <span>{l.nextFollowUp ? `Follow-up ${formatRelativeDay(l.nextFollowUp)}` : `Last contact ${timeAgo(l.lastContact)}`}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <div className="border-t px-4 py-2.5 text-[12px] text-muted-foreground">
          Showing <span className="num font-semibold text-foreground">{rows.length}</span> of {state.leads.length} leads · demo data
        </div>
      </Card>
    </>
  );
}
