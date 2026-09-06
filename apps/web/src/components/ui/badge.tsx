import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
  success:
    "bg-[var(--color-brand-100)] text-[var(--color-brand-800)]",
  warning:
    "bg-[#fff5df] text-[#8a5d16]",
  danger:
    "bg-[#fdeaea] text-[#9f3333]",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1",
        "text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
