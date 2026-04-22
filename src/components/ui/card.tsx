import type { ComponentPropsWithoutRef, ElementType, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type CardProps<T extends ElementType> = PropsWithChildren<{
  as?: T;
  hover?: boolean;
  className?: string;
}> &
  Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function Card<T extends ElementType = "div">({
  as,
  children,
  className,
  hover = false,
  ...props
}: CardProps<T>) {
  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      className={cn("surface-card", hover && "surface-card-hover", className)}
      {...props}
    >
      {children}
    </Component>
  );
}
