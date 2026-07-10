import { cva, type VariantProps } from "class-variance-authority";

export type { VariantProps };

/**
 * Server-safe button variant config. Extracted from button.tsx so that
 * Server Components can build button classnames without importing a
 * "use client" module (which would turn the export into a client reference).
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        default: "btn-neu text-ink",
        accent: "btn-neu-accent",
        ghost: "text-muted hover:text-ink hover:bg-surface-2/70 rounded-lg",
        outline: "border border-[var(--border-strong)] text-ink hover:border-purple/50 hover:text-purple",
        danger: "btn-neu text-[var(--red)] hover:text-[var(--red)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
export type ButtonSize = VariantProps<typeof buttonVariants>["size"];
