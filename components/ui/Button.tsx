import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  isExternal?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      href,
      isExternal,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-sans font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foundation-darkest active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

    const variantStyles = {
      // Primary: High impact accent with subtle cyan sheen on hover
      primary:
        "bg-brand-blue text-typo-white hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.35)] border border-brand-cyan/20",
      // Secondary: Dark slate with clean soft white text
      secondary:
        "bg-foundation-slate text-typo-white hover:bg-[#1C2433] hover:border-brand-blue/40 border border-foundation-slate",
      // Outline: Subtle border with luminous blue reveal on hover
      outline:
        "bg-transparent text-typo-white border border-foundation-slate hover:border-brand-cyan/50 hover:bg-foundation-slate/40",
      // Ghost: Minimalist clickable element
      ghost:
        "bg-transparent text-typo-gray hover:text-typo-white hover:bg-foundation-slate/30",
    };

    const sizeStyles = {
      sm: "px-3.5 py-1.5 text-xs rounded-md tracking-wider uppercase",
      md: "px-5 py-2.5 text-sm rounded-lg",
      lg: "px-7 py-3.5 text-base rounded-lg",
    };

    const combinedClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    if (href) {
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={combinedClasses}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href} className={combinedClasses}>
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={combinedClasses}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
