import * as React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Info, Table2, LineChart as LineIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/misc";
import { useDemo, useKpis } from "@/store/demo-store";
import { buildDailySeries } from "@/data/mock";
import { useChartColors } from "@/hooks/use-chart-colors";
import { cn } from "@/lib/utils";
import type { LeadSource } from "@/types";

type TipProps = { active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]; label?: string };

function ChartTip({ active, payload, label, names }: TipProps & { names?: Record<string, string> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-surface px-3 py-2 text-[12.5px] shadow-lift">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="size-2 rounded-full" style={{ background: p.color }} />{names?.[p.dataKey] ?? p.name}</span>
          <span className="num font-mono font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
] as const;

export default function AnalyticsPage() {
  const { state } = useDemo();
  const kpi = useKpis();
  const c = useChartColors();
  const [range, setRange] = React.useState<"7" | "14">("14");
  const [table, setTable] = React.useState(false);

  const series = React.useMemo(() => {
    const base = buildDailySeries();
    // leads created live in the demo land on today's point
    const live = state.leads.filter((l) => l.id.startsWith("l_"));
    const last = base[base.length - 1]!;
    last.newLeads += live.length;
    last.qualified += live.filter((l) => l.status === "qualified" || l.status === "appointment").length;
    last.hot += live.filter((l) => l.score.temperature === "hot").length;
    return base.slice(range === "7" ? -7 : 0);
  }, [state.leads, range]);

  const names = { newLeads: "New leads", qualified: "Qualified", hot: "Hot" };

  const sources = (["WhatsApp", "Website", "Instagram", "Facebook", "Property Portal", "Referral"] as LeadSource[])
    .map((s) => ({ source: s === "Property Portal" ? "Portals" : s, leads: state.leads.filter((l) => l.source === s).length, hot: state.leads.filter((l) => l.source === s && l.score.temperature === "hot").length }))
    .sort((a, b) => b.leads - a.leads);

  const funnel = [
    { label: "New Leads", value: kpi.newLeads },
    { label: "Qualified", value: kpi.qualified },
    { label: "Hot", value: kpi.hot },
    { label: "Appointments", value: kpi.appointments },
  ];

  const byHour = [
    { h: "8a", v: 1 }, { h: "10a", v: 3 }, { h: "12p", v: 4 }, { h: "2p", v: 3 }, { h: "4p", v: 4 }, { h: "6p", v: 3 },
    { h: "8p", v: 4 }, { h: "10p", v: 3 }, { h: "12a", v: 1 }, { h: "2a+", v: 1 },
  ].map((d, i) => ({ ...d, after: i >= 6 || i === 0 }));
  const afterShare = Math.round((byHour.filter((d) => d.after).reduce((a, b) => a + b.v, 0) / byHour.reduce((a, b) => a + b.v, 0)) * 100);

  const communities = Object.entries(
    state.leads.reduce<Record<string, number>>((acc, l) => {
      if (l.interest.location) acc[l.interest.location] = (acc[l.interest.location] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([k, v]) => ({ k: k.replace("Jumeirah Village Circle", "JVC").replace("Jumeirah Lake Towers", "JLT"), v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 6);

  const axis = { stroke: c.axis, fontSize: 11, tickLine: false, axisLine: false } as const;
  const totals = series.reduce((a, d) => ({ n: a.n + d.newLeads, q: a.q + d.qualified, h: a.h + d.hot }), { n: 0, q: 0, h: 0 });

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Lead flow, qualification and bookings across every channel."
        actions={<Segmented options={RANGES} value={range} onChange={setRange} />}
      />

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border bg-subtle/60 px-4 py-3 text-[12.5px] text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        All figures on this page are demo data for illustration. They are not results from a real agency. Once connected, this dashboard reports your own numbers.
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Leads over time</CardTitle>
              <CardDescription>
                <span className="num">{totals.n}</span> new · <span className="num">{totals.q}</span> qualified · <span className="num">{totals.h}</span> hot in the last {range} days
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setTable((t) => !t)} aria-pressed={table}>
              {table ? <><LineIcon />Chart</> : <><Table2 />Table</>}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-4 text-[12.5px]">
              {[["newLeads", c.c1], ["qualified", c.c2], ["hot", c.c3]].map(([k, col]) => (
                <span key={k} className="flex items-center gap-1.5 text-muted-foreground"><span className="h-0.5 w-4 rounded-full" style={{ background: col }} />{names[k as keyof typeof names]}</span>
              ))}
            </div>
            {table ? (
              <div className="max-h-[280px] overflow-auto">
                <table className="w-full text-[12.5px]">
                  <thead className="text-left text-muted-foreground"><tr><th className="py-1.5 font-medium">Day</th><th className="font-medium">New</th><th className="font-medium">Qualified</th><th className="font-medium">Hot</th></tr></thead>
                  <tbody className="num divide-y font-mono">
                    {series.map((d) => <tr key={d.day}><td className="py-1.5 font-sans">{d.day}</td><td>{d.newLeads}</td><td>{d.qualified}</td><td>{d.hot}</td></tr>)}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.c1} stopOpacity={0.18} /><stop offset="100%" stopColor={c.c1} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke={c.grid} vertical={false} />
                    <XAxis dataKey="day" {...axis} interval={range === "14" ? 1 : 0} tickMargin={8} />
                    <YAxis {...axis} allowDecimals={false} width={48} />
                    <Tooltip content={<ChartTip names={names} />} cursor={{ stroke: c.axis, strokeDasharray: "3 3" }} />
                    <Area type="monotone" dataKey="newLeads" stroke={c.c1} strokeWidth={2} fill="url(#g1)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--surface))" }} />
                    <Area type="monotone" dataKey="qualified" stroke={c.c2} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--surface))" }} />
                    <Area type="monotone" dataKey="hot" stroke={c.c3} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--surface))" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Conversion funnel</CardTitle>
              <CardDescription>Live from the demo workspace.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {funnel.map((f, i) => {
              const pct = (f.value / funnel[0]!.value) * 100;
              const conv = i > 0 ? Math.round((f.value / funnel[i - 1]!.value) * 100) : null;
              return (
                <React.Fragment key={f.label}>
                  {conv !== null && <p className="pl-1 font-mono text-[11px] text-muted-foreground">↓ {conv}% of previous stage</p>}
                  <div className="group">
                    <div className="mb-1 flex items-baseline justify-between text-[13px]">
                      <span className="font-medium">{f.label}</span>
                      <span className="num font-display text-lg font-extrabold">{f.value}</span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-lg bg-subtle">
                      <div className="h-full rounded-lg transition-[width] duration-700" style={{ width: `${pct}%`, background: c.c1, opacity: 1 - i * 0.18 }} title={`${f.label}: ${f.value}`} />
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Lead sources</CardTitle>
              <CardDescription>Leads by channel, with hot leads highlighted.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex gap-4 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: c.c1 }} />All leads</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: c.c3 }} />Hot</span>
            </div>
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sources} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barGap={2} barCategoryGap={8}>
                  <CartesianGrid stroke={c.grid} horizontal={false} />
                  <XAxis type="number" {...axis} allowDecimals={false} />
                  <YAxis type="category" dataKey="source" {...axis} width={72} />
                  <Tooltip content={<ChartTip names={{ leads: "All leads", hot: "Hot" }} />} cursor={{ fill: "hsl(var(--subtle))" }} />
                  <Bar dataKey="leads" fill={c.c1} radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="hot" fill={c.c3} radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>When enquiries arrive</CardTitle>
              <CardDescription><span className="num font-semibold text-foreground">{afterShare}%</span> arrive outside 9 AM – 7 PM, when agents are offline.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex gap-4 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: c.c1 }} />Office hours</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: c.c2 }} />After hours (AI only)</span>
            </div>
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byHour} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap={4}>
                  <CartesianGrid stroke={c.grid} vertical={false} />
                  <XAxis dataKey="h" {...axis} tickMargin={6} />
                  <YAxis {...axis} allowDecimals={false} />
                  <Tooltip content={<ChartTip names={{ v: "Enquiries" }} />} cursor={{ fill: "hsl(var(--subtle))" }} />
                  <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                    {byHour.map((d) => <Cell key={d.h} fill={d.after ? c.c2 : c.c1} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Demand by community</CardTitle>
              <CardDescription>Where your leads want to buy or rent.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {communities.map((d) => (
                <li key={d.k}>
                  <div className="mb-1 flex justify-between text-[13px]"><span>{d.k}</span><span className="num font-mono font-semibold">{d.v}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-subtle"><div className="h-full rounded-full" style={{ width: `${(d.v / communities[0]!.v) * 100}%`, background: c.c1 }} /></div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className={cn("mt-5 grid gap-3 sm:grid-cols-3")}>
        {[
          { v: "9s", l: "Average AI first response", s: "Demo figure. Replies go out within seconds, day or night." },
          { v: `${Math.round((kpi.qualified / kpi.newLeads) * 100)}%`, l: "Leads fully qualified by AI", s: "Budget, area, bedrooms and timeline captured without an agent." },
          { v: `${state.appointments.filter((a) => a.bookedBy === "AI" && a.status !== "cancelled").length}`, l: "Appointments booked by AI", s: "Viewings and calls placed directly in agent calendars." },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl border bg-surface p-4 shadow-card">
            <p className="num font-display text-2xl font-extrabold">{x.v}</p>
            <p className="mt-1 text-[13px] font-semibold">{x.l}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">{x.s}</p>
          </div>
        ))}
      </div>
    </>
  );
}
