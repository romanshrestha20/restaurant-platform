import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)] focus-visible:ring-[var(--color-brand-500)]",
  secondary:
    "bg-[var(--color-brand-100)] text-[var(--color-brand-800)] hover:bg-[var(--color-brand-200)] focus-visible:ring-[var(--color-brand-500)]",
  outline:
    "border border-[var(--color-neutral-300)] bg-white text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-50)] focus-visible:ring-[var(--color-brand-500)]",
  ghost:
    "bg-transparent text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)] focus-visible:ring-[var(--color-brand-500)]",
  danger:
    "bg-[var(--color-danger)] text-white hover:opacity-90 focus-visible:ring-[var(--color-danger)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium",
        "transition-colors duration-[var(--duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
