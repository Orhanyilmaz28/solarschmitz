import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "dark" | "light" | "outline" | "outline-light" | "ghost";
type Size = "md" | "lg" | "sm";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2.5 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-lime text-ink hover:bg-lime-hover shadow-[0_8px_24px_-8px_rgb(183_243_75/0.7)]",
  dark: "bg-ink text-paper hover:bg-ink-3",
  light: "bg-paper text-ink hover:bg-white",
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  "outline-light": "border border-paper/30 text-paper hover:border-paper hover:bg-paper hover:text-ink backdrop-blur-sm",
  ghost: "text-ink hover:bg-ink/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

function Arrow() {
  return (
    <span aria-hidden className="relative -mr-1 inline-flex h-5 w-5 overflow-hidden">
      <svg viewBox="0 0 20 20" className="absolute inset-0 h-5 w-5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/btn:translate-x-5">
        <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 20 20" className="absolute inset-0 h-5 w-5 -translate-x-5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/btn:translate-x-0">
        <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ variant, size, arrow, className = "", children, ...rest }: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link {...rest} className={buttonClass(variant, size, className)}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function Button({ variant, size, arrow, className = "", children, type = "button", ...rest }: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} {...rest} className={buttonClass(variant, size, className)}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}
