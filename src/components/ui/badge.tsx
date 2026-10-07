import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-subtle text-muted-foreground",
        outline: "border text-muted-foreground",
        primary: "bg-primary-soft text-accent-foreground",
        hot: "bg-hot-soft text-hot",
        warm: "bg-warm-soft text-warm",
        cold: "bg-cold-soft text-cold",
        success: "bg-success-soft text-success",
        danger: "bg-danger-soft text-danger",
        solid: "bg-foreground text-background",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
