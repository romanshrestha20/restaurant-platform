import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)]",
        "bg-white shadow-[var(--shadow-sm)]",
        className,
      )}
      {...props}
    />
  );
}
