import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
  }
>;

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "button-press inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "button-primary",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-900 shadow-soft-md hover:border-slate-300 hover:bg-slate-50",
        variant === "ghost" &&
          "border border-transparent bg-transparent text-slate-700 shadow-none hover:bg-slate-100 hover:text-slate-900",
        variant === "danger" &&
          "border border-red-200 bg-white text-red-600 shadow-soft-md hover:border-red-300 hover:bg-red-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
