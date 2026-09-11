import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { Icon, type IconName } from "../icons";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-[var(--shadow-card)]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg)]",
  outline:
    "bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg)]",
  ghost: "bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]",
  danger: "bg-[var(--color-serious)] text-white hover:opacity-90",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, loading, fullWidth, className = "", children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <Icon name="loader" className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <Icon name={icon} className="h-4 w-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
});

interface LinkButtonProps extends CommonProps {
  href: string;
  className?: string;
  children?: React.ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  icon,
  fullWidth,
  className = "",
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {icon ? <Icon name={icon} className="h-4 w-4 shrink-0" /> : null}
      {children}
    </Link>
  );
}
