import { CircleCheck, Flame, Info, X } from "lucide-react";
import { useDemo } from "@/store/demo-store";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { state, actions } = useDemo();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:pr-6"
      aria-live="polite"
    >
      {state.toasts.slice(-3).map((t) => {
        const Icon = t.tone === "success" ? CircleCheck : t.tone === "hot" ? Flame : Info;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-3.5 shadow-lift animate-in fade-in slide-in-from-bottom-2"
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", t.tone === "success" ? "text-success" : t.tone === "hot" ? "text-hot" : "text-primary")} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t.description}</p>}
            </div>
            <button onClick={() => actions.dismissToast(t.id)} className="rounded p-0.5 text-muted-foreground hover:bg-subtle" aria-label="Dismiss">
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
