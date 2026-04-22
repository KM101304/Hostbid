import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    tone?: "default" | "primary" | "success" | "warning" | "info";
  }
>;

export function Badge({ children, className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "badge-soft",
        tone === "primary" && "badge-primary",
        tone === "success" && "badge-success",
        tone === "warning" && "badge-warning",
        tone === "info" && "badge-info",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
