import { Bath, BedDouble, Check, Info, Minus, Ruler, Sparkles, X } from "lucide-react";
import type { LeadInterest, Property, PropertyMatch } from "@/types";
import { matchProperties } from "@/services/ai";
import { PROPERTIES } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { cn, formatAEDShort } from "@/lib/utils";

/** Generated placeholder art so the demo never depends on stock photos. */
export function PropertyArt({ p, className }: { p: Property; className?: string }) {
  const h = p.hue;
  const tall = p.type === "Apartment" || p.type === "Penthouse";
  const seed = Number(p.id.replace(/\D/g, "")) || 1;
  const towers = tall
    ? [0, 1, 2, 3, 4].map((i) => ({ x: 14 + i * 38 + ((seed * (i + 3)) % 9), w: 26 + ((seed + i) % 3) * 6, h: 58 + ((seed * (i + 7)) % 5) * 16 }))
    : [];
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: `linear-gradient(180deg, hsl(${h} 55% 88%), hsl(${h} 45% 95%))` }}>
      <svg viewBox="0 0 220 140" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx={170} cy={36} r={16} fill={`hsl(${(h + 30) % 360} 80% 92%)`} />
        {tall ? (
          towers.map((t, i) => (
            <g key={i}>
              <rect x={t.x} y={140 - t.h} width={t.w} height={t.h} rx={3} fill={`hsl(${h} 35% ${40 + i * 6}%)`} opacity={0.85} />
              {Array.from({ length: Math.floor(t.h / 14) }).map((_, j) => (
                <rect key={j} x={t.x + 5} y={140 - t.h + 8 + j * 14} width={t.w - 10} height={3} rx={1.5} fill={`hsl(${h} 60% 92%)`} opacity={0.55} />
              ))}
            </g>
          ))
        ) : (
          <g>
            <rect x={40} y={78} width={140} height={62} rx={3} fill={`hsl(${h} 30% 45%)`} />
            <path d="M30 82 110 40l80 42z" fill={`hsl(${h} 35% 34%)`} />
            <rect x={68} y={98} width={24} height={18} rx={2} fill={`hsl(${h} 60% 90%)`} opacity={0.7} />
            <rect x={128} y={98} width={24} height={18} rx={2} fill={`hsl(${h} 60% 90%)`} opacity={0.7} />
            <rect x={100} y={108} width={20} height={32} rx={2} fill={`hsl(${h} 40% 28%)`} />
          </g>
        )}
        <rect x={0} y={132} width={220} height={8} fill={`hsl(${h} 30% 30%)`} opacity={0.35} />
      </svg>
    </div>
  );
}

export const AVAIL_VARIANT = { Available: "success", Reserved: "warm", "Off-plan": "primary", Sold: "default" } as const;

export function PropertyFacts({ p, className }: { p: Property; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" />{p.bedrooms === 0 ? "Studio" : `${p.bedrooms} bed`}</span>
      <span className="inline-flex items-center gap-1"><Bath className="size-3.5" />{p.bathrooms} bath</span>
      <span className="inline-flex items-center gap-1"><Ruler className="size-3.5" /><span className="num">{p.sizeSqft.toLocaleString()}</span> sqft</span>
    </div>
  );
}

export function MatchReasons({ m }: { m: PropertyMatch }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {m.reasons.map((r) => (
        <li
          key={r.label}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px]",
            r.ok === true ? "bg-success-soft text-success" : r.ok === "partial" ? "bg-warm-soft text-warm" : "bg-subtle text-muted-foreground",
          )}
        >
          {r.ok === true ? <Check className="size-3" /> : r.ok === "partial" ? <Minus className="size-3" /> : <X className="size-3" />}
          {r.label}
        </li>
      ))}
    </ul>
  );
}

export function RequirementLine({ i }: { i: LeadInterest }) {
  const parts = [
    i.bedrooms !== null ? (i.bedrooms === 0 ? "Studio" : `${i.bedrooms}BR`) : null,
    i.propertyType,
    i.location,
    i.budget ? `Budget ${formatAEDShort(i.budget)}` : null,
  ].filter(Boolean);
  return <span>{parts.length ? parts.join(" · ") : "Requirements not captured yet"}</span>;
}

/** AI property matching panel for one lead. */
export function PropertyMatches({ interest, leadName, className, limit = 3 }: { interest: LeadInterest; leadName?: string; className?: string; limit?: number }) {
  const matches = matchProperties(interest, PROPERTIES, limit);
  const hasReq = interest.location || interest.bedrooms !== null || interest.budget;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2 text-[13px]">
        <span className="text-muted-foreground">
          {leadName ? <span className="font-medium text-foreground">{leadName}: </span> : "Requirement: "}
          <RequirementLine i={interest} />
        </span>
        {interest.preferences.length > 0 && <span className="text-[12px] text-muted-foreground">Prefers {interest.preferences.join(", ").toLowerCase()}</span>}
      </div>
      {!hasReq || matches.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          {hasReq ? "No close matches in the current inventory." : "Matches appear once the AI captures location, bedrooms or budget."}
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {matches.map((m, idx) => (
            <li key={m.property.id} className="flex gap-3 rounded-xl border p-2.5 animate-fade-up" style={{ animationDelay: `${idx * 70}ms` }}>
              <PropertyArt p={m.property} className="h-[72px] w-[88px] shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold">
                      <span className="mr-1.5 font-mono text-muted-foreground">{idx + 1}.</span>
                      {m.property.community} {m.property.bedrooms}BR
                    </p>
                    <p className="truncate text-[12px] text-muted-foreground">{m.property.building} · {m.property.ref}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num font-mono text-[15px] font-bold text-primary">{m.score}%</p>
                    <p className="text-[10.5px] text-muted-foreground">match</p>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="num text-[13px] font-semibold">{formatAEDShort(m.property.price)}</span>
                  <Badge variant={AVAIL_VARIANT[m.property.availability]}>{m.property.availability}</Badge>
                </div>
                <div className="mt-2">
                  <MatchReasons m={m} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="flex gap-2 text-[11.5px] leading-snug text-muted-foreground">
        <Sparkles className="mt-px size-3.5 shrink-0" />
        Demo AI matching score based on location, bedrooms, budget and stated preferences. Not a market valuation or price prediction.
      </p>
    </div>
  );
}

export { Info };
