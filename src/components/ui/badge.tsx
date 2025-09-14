import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-primary to-primary-hover text-primary-foreground hover:shadow-primary shadow-sm",
        secondary: "border-transparent bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:shadow-md",
        destructive: "border-transparent bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground hover:shadow-md",
        outline: "text-foreground border-primary/30 bg-background/50 hover:bg-primary/5",
        success: "border-transparent bg-gradient-to-r from-success to-success/90 text-success-foreground hover:shadow-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
