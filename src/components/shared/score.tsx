import { Info } from "lucide-react";
import type { LeadScore } from "@/types";
import { SCORE_WEIGHTS } from "@/services/ai";
import { Progress } from "@/components/ui/misc";
import { ScoreRing, TempBadge } from "./lead-bits";
import { cn } from "@/lib/utils";

const FACTOR_LABELS: [keyof LeadScore["factors"], string][] = [
  ["budgetMatch", "Budget Match"],
  ["purchaseIntent", "Purchase Intent"],
  ["timeline", "Timeline"],
  ["propertyFit", "Property Fit"],
  ["engagement", "Engagement"],
];

export function ScoreBreakdown({ score, compact, className }: { score: LeadScore; compact?: boolean; className?: string }) {
  const tone = score.temperature;
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className={cn("flex items-center gap-5", compact && "gap-4")}>
        <ScoreRing score={score.total} t={tone} size={compact ? 96 : 128} stroke={compact ? 8 : 10} />
        <div className="min-w-0">
          <TempBadge t={tone} size="lg" />
          <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">{score.explanation}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {FACTOR_LABELS.map(([key, label]) => (
          <li key={key}>
            <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
              <span className="font-medium">{label}</span>
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">×{SCORE_WEIGHTS[key].toFixed(2)}</span>
                <span className="num w-10 text-right font-mono font-semibold">{score.factors[key]}%</span>
              </span>
            </div>
            <Progress value={score.factors[key]} tone={score.factors[key] >= 80 ? "success" : score.factors[key] >= 50 ? "warm" : "cold"} />
          </li>
        ))}
      </ul>

      {score.adjustments.length > 0 && (
        <ul className="flex flex-col gap-1.5 rounded-lg bg-subtle px-3 py-2.5 text-[12.5px]">
          {score.adjustments.map((a) => (
            <li key={a.label} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{a.label}</span>
              <span className="num font-mono font-semibold text-danger">{a.points}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="flex gap-2 text-[11.5px] leading-snug text-muted-foreground">
        <Info className="mt-px size-3.5 shrink-0" />
        Demo scoring model: a transparent weighted checklist, not a statistically validated prediction. Weights and thresholds are configurable per agency.
      </p>
    </div>
  );
}
