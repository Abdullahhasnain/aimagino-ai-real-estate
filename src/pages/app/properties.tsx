import * as React from "react";
import { Plus, Search, SearchX, Send, Sparkles, X } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { AVAIL_VARIANT, MatchReasons, PropertyArt, PropertyFacts, PropertyMatches } from "@/components/shared/property";
import { TempBadge } from "@/components/shared/lead-bits";
import { PROPERTIES, useDemo } from "@/store/demo-store";
import { COMMUNITIES, matchProperties, scoreMatch } from "@/services/ai";
import { useRouter } from "@/lib/router";
import { cn, formatAED, formatAEDShort } from "@/lib/utils";
import type { Property } from "@/types";

const PRICE_BANDS = [
  { value: "all", label: "Any price" },
  { value: "0-1000000", label: "Under AED 1M" },
  { value: "1000000-2000000", label: "AED 1M – 2M" },
  { value: "2000000-5000000", label: "AED 2M – 5M" },
  { value: "5000000-999999999", label: "AED 5M+" },
];

export default function PropertiesPage() {
  const { state, actions } = useDemo();
  const { navigate } = useRouter();
  const [q, setQ] = React.useState("");
  const [community, setCommunity] = React.useState("all");
  const [beds, setBeds] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [avail, setAvail] = React.useState("all");
  const [price, setPrice] = React.useState("all");
  const [matchLeadId, setMatchLeadId] = React.useState<string>("l1");
  const [openProp, setOpenProp] = React.useState<Property | null>(null);

  const matchLead = state.leads.find((l) => l.id === matchLeadId);
  const topMatches = matchLead ? matchProperties(matchLead.interest, PROPERTIES, 3) : [];
  const matchMap = new Map(topMatches.map((m, i) => [m.property.id, { score: m.score, rank: i + 1 }]));

  const [lo, hi] = price === "all" ? [0, Infinity] : price.split("-").map(Number);
  const term = q.trim().toLowerCase();
  const list = PROPERTIES.filter((p) => community === "all" || p.community === community)
    .filter((p) => beds === "all" || (beds === "4" ? p.bedrooms >= 4 : p.bedrooms === Number(beds)))
    .filter((p) => type === "all" || p.type === type)
    .filter((p) => avail === "all" || p.availability === avail)
    .filter((p) => p.price >= lo! && p.price < hi!)
    .filter((p) => !term || [p.community, p.building, p.ref, p.title, p.features.join(" ")].join(" ").toLowerCase().includes(term));

  const clear = () => { setQ(""); setCommunity("all"); setBeds("all"); setType("all"); setAvail("all"); setPrice("all"); };
  const activeFilters = [community, beds, type, avail, price].filter((v) => v !== "all").length + (term ? 1 : 0);

  const interested = openProp
    ? state.leads
        .map((l) => ({ l, m: scoreMatch(l.interest, openProp) }))
        .filter((x) => x.m.score >= 70 && (x.l.interest.location || x.l.interest.budget))
        .sort((a, b) => b.m.score - a.m.score)
        .slice(0, 4)
    : [];

  return (
    <>
      <PageHeader
        title="Properties"
        description="Your listing inventory. The AI uses it to match every lead with the best-fit homes."
        actions={<Button variant="outline" onClick={() => actions.toast({ title: "Listing import", description: "In production, listings sync from your CRM or portal feed automatically." })}><Plus />Add listing</Button>}
      />

      {/* AI matching panel */}
      <Card className="mb-5 border-primary/25">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" />AI Property Matching</CardTitle>
            <CardDescription>Pick a lead to see which listings fit their requirements. Top matches are highlighted below.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="match-lead">Lead</Label>
              <Select id="match-lead" value={matchLeadId} onChange={(e) => setMatchLeadId(e.target.value)}>
                {state.leads.filter((l) => l.interest.location || l.interest.budget).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Select>
            </div>
            {matchLead && (
              <div className="flex items-center gap-3 rounded-xl border p-3">
                <Avatar name={matchLead.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{matchLead.name}</p>
                  <p className="text-[12px] text-muted-foreground">Score {matchLead.score.total}/100</p>
                </div>
                <TempBadge t={matchLead.score.temperature} />
              </div>
            )}
            {matchLead && topMatches.length > 0 && (
              <Button
                variant="soft"
                onClick={() => actions.scheduleFollowUp(matchLead.id, `Hi ${matchLead.name.split(" ")[0]}, here are ${topMatches.length} properties that match what you're looking for: ${topMatches.map((m) => `${m.property.building} (${formatAEDShort(m.property.price)})`).join(", ")}. Would you like to arrange viewings?`, "WhatsApp", "now")}
              >
                <Send />
                Send shortlist on WhatsApp
              </Button>
            )}
          </div>
          {matchLead && <PropertyMatches interest={matchLead.interest} leadName={matchLead.name} />}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input id="prop-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search building, reference or feature" className="h-9 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm focus-visible:ring-offset-0" />
          </div>
          <Select id="f-community" value={community} onChange={(e) => setCommunity(e.target.value)} aria-label="Community">
            <option value="all">All communities</option>
            {COMMUNITIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select id="f-beds" value={beds} onChange={(e) => setBeds(e.target.value)} aria-label="Bedrooms">
            <option value="all">Any bedrooms</option>
            <option value="1">1 bedroom</option>
            <option value="2">2 bedrooms</option>
            <option value="3">3 bedrooms</option>
            <option value="4">4+ bedrooms</option>
          </Select>
          <Select id="f-type" value={type} onChange={(e) => setType(e.target.value)} aria-label="Property type">
            <option value="all">Any type</option>
            {["Apartment", "Villa", "Townhouse", "Penthouse"].map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select id="f-avail" value={avail} onChange={(e) => setAvail(e.target.value)} aria-label="Availability">
            <option value="all">Any availability</option>
            {["Available", "Reserved", "Off-plan", "Sold"].map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select id="f-price" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Price">
            {PRICE_BANDS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
        </div>
        <div className="mt-3 flex items-center justify-between text-[12.5px] text-muted-foreground">
          <span><span className="num font-semibold text-foreground">{list.length}</span> of {PROPERTIES.length} listings</span>
          {activeFilters > 0 && <button onClick={clear} className="inline-flex items-center gap-1 font-medium text-primary hover:underline"><X className="size-3.5" />Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}</button>}
        </div>
      </Card>

      {list.length === 0 ? (
        <Card><EmptyState icon={SearchX} title="No listings match" description="Widen the price band or clear filters to see more of the inventory." action={<Button variant="outline" onClick={clear}>Clear filters</Button>} /></Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((p) => {
            const m = matchMap.get(p.id);
            return (
              <li key={p.id}>
                <button onClick={() => setOpenProp(p)} className={cn("group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-surface text-left shadow-card transition-shadow hover:shadow-lift", m && "ring-2 ring-primary/60")}>
                  <div className="relative">
                    <PropertyArt p={p} className="aspect-[16/9] w-full" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <Badge variant={AVAIL_VARIANT[p.availability]} className="shadow-sm">{p.availability}</Badge>
                      <Badge className="bg-surface/90 text-foreground shadow-sm">{p.type}</Badge>
                    </div>
                    {m && (
                      <span className="absolute right-3 top-3 rounded-md bg-primary px-2 py-1 font-mono text-[11.5px] font-bold text-primary-foreground shadow-sm">
                        #{m.rank} · {m.score}% match
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.community} — {p.title}</p>
                        <p className="truncate text-[12.5px] text-muted-foreground">{p.building} · <span className="font-mono">{p.ref}</span></p>
                      </div>
                    </div>
                    <PropertyFacts p={p} />
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <p className="num font-display text-[18px] font-extrabold">{formatAEDShort(p.price)}</p>
                      <span className="text-[12px] text-muted-foreground">{Math.round(p.price / p.sizeSqft).toLocaleString()} AED/sqft</span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!openProp} onClose={() => setOpenProp(null)} title={openProp ? `${openProp.community} — ${openProp.title}` : ""} description={openProp ? `${openProp.building} · ${openProp.ref}` : undefined} className="sm:max-w-xl">
        {openProp && (
          <div className="flex flex-col gap-4">
            <PropertyArt p={openProp} className="aspect-[2/1] w-full rounded-xl" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="num font-display text-2xl font-extrabold">{formatAED(openProp.price)}</p>
              <Badge variant={AVAIL_VARIANT[openProp.availability]}>{openProp.availability}</Badge>
            </div>
            <PropertyFacts p={openProp} className="text-[13.5px]" />
            <div className="flex flex-wrap gap-1.5">
              {openProp.features.map((f) => <Badge key={f} variant="outline">{f}</Badge>)}
            </div>
            <div className="border-t pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-[13.5px] font-semibold"><Sparkles className="size-4 text-primary" />Leads that match this property</p>
              {interested.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No current leads are a strong match.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {interested.map(({ l, m }) => (
                    <li key={l.id} className="rounded-xl border p-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={l.name} className="size-8 text-[11px]" />
                        <button onClick={() => navigate(`/app/leads/${l.id}`)} className="min-w-0 flex-1 text-left">
                          <p className="truncate text-[13.5px] font-semibold hover:underline">{l.name}</p>
                          <p className="text-[12px] text-muted-foreground">{l.score.temperature.toUpperCase()} · {l.score.total}/100</p>
                        </button>
                        <span className="num font-mono text-[14px] font-bold text-primary">{m.score}%</span>
                      </div>
                      <div className="mt-2"><MatchReasons m={m} /></div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11.5px] text-muted-foreground">Demo AI matching score, not a market valuation.</p>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}

