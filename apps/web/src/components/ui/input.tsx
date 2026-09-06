import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-neutral-300)]",
        "bg-white px-3 text-sm text-[var(--color-neutral-900)]",
        "placeholder:text-[var(--color-neutral-400)]",
        "transition-colors duration-[var(--duration-fast)]",
        "focus:border-[var(--color-brand-500)] focus:outline-none",
        "focus:ring-2 focus:ring-[var(--color-brand-100)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--color-neutral-100)]",
        className,
      )}
      {...props}
    />
  );
}
