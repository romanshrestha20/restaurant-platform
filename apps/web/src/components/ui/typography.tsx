import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type HeadingProps = HTMLAttributes<HTMLHeadingElement>;

export function H1({ className, ...props }: HeadingProps) {
  return (
    <h1
      className={cn(
        "text-3xl font-semibold tracking-tight text-[var(--color-neutral-900)]",
        "sm:text-4xl lg:text-5xl",
        className,
      )}
      {...props}
    />
  );
}

export function H2({ className, ...props }: HeadingProps) {
  return (
    <h2
      className={cn(
        "text-2xl font-semibold tracking-tight text-[var(--color-neutral-900)]",
        "sm:text-3xl",
        className,
      )}
      {...props}
    />
  );
}

export function H3({ className, ...props }: HeadingProps) {
  return (
    <h3
      className={cn(
        "text-xl font-semibold text-[var(--color-neutral-900)]",
        "sm:text-2xl",
        className,
      )}
      {...props}
    />
  );
}

type TextProps = HTMLAttributes<HTMLParagraphElement>;

export function Text({ className, ...props }: TextProps) {
  return (
    <p
      className={cn(
        "text-base leading-7 text-[var(--color-neutral-600)]",
        className,
      )}
      {...props}
    />
  );
}

export function MutedText({ className, ...props }: TextProps) {
  return (
    <p
      className={cn(
        "text-sm leading-6 text-[var(--color-neutral-500)]",
        className,
      )}
      {...props}
    />
  );
}
