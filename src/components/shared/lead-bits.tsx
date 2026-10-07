import * as React from "react";
import { Building2, Camera, Flame, Globe, Handshake, MessageCircle, Snowflake, ThumbsUp, Thermometer } from "lucide-react";
import type { LeadSource, LeadStatus, Temperature } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const SOURCE_META: Record<LeadSource, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  Website: { icon: Globe, label: "Website" },
  WhatsApp: { icon: MessageCircle, label: "WhatsApp" },
  Instagram: { icon: Camera, label: "Instagram" },
  Facebook: { icon: ThumbsUp, label: "Facebook" },
  "Property Portal": { icon: Building2, label: "Property portal" },
  Referral: { icon: Handshake, label: "Referral" },
};

export function SourceTag({ source, className }: { source: LeadSource; className?: string }) {
  const M = SOURCE_META[source];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] text-muted-foreground", className)}>
      <M.icon className="size-3.5" />
      {M.label}
    </span>
  );
}

export function TempBadge({ t, className, size = "sm" }: { t: Temperature; className?: string; size?: "sm" | "lg" }) {
  const Icon = t === "hot" ? Flame : t === "warm" ? Thermometer : Snowflake;
  return (
    <Badge variant={t} className={cn("uppercase tracking-wide", size === "lg" && "px-2.5 py-1 text-xs [&_svg]:size-3.5", className)}>
      <Icon />
      {t === "hot" ? "Hot" : t === "warm" ? "Warm" : "Cold"}
      {size === "lg" && " lead"}
    </Badge>
  );
}

export const STATUS_META: Record<LeadStatus, { label: string; variant: "default" | "primary" | "success" | "outline" }> = {
  new: { label: "New", variant: "outline" },
  contacted: { label: "Contacted", variant: "default" },
  qualified: { label: "Qualified", variant: "primary" },
  appointment: { label: "Appointment", variant: "success" },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const m = STATUS_META[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

/** Small numeric score with a tinted track, used in tables. */
export function ScorePill({ score, t }: { score: number; t: Temperature }) {
  const bar = t === "hot" ? "bg-hot" : t === "warm" ? "bg-warm" : "bg-cold";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="num w-6 text-right font-mono text-[13px] font-semibold">{score}</span>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-subtle">
        <span className={cn("block h-full rounded-full transition-[width] duration-700", bar)} style={{ width: `${score}%` }} />
      </span>
    </span>
  );
}

/** Circular score gauge. */
export function ScoreRing({ score, t, size = 132, stroke = 10, label = "/ 100" }: { score: number; t: Temperature; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = t === "hot" ? "hsl(var(--hot))" : t === "warm" ? "hsl(var(--warm))" : "hsl(var(--cold))";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--subtle))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1), stroke .4s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num font-display font-extrabold leading-none" style={{ fontSize: size * 0.28 }}>
          {score}
        </span>
        <span className="mt-1 font-mono text-[11px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
