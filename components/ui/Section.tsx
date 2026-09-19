import React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  spacing?: "none" | "sm" | "md" | "lg" | "xl";
  hasAsymmetricGrid?: boolean;
}

export function Section({
  children,
  className,
  as: Component = "section",
  spacing = "lg",
  hasAsymmetricGrid = false,
  ...props
}: SectionProps) {
  const spacingClasses = {
    none: "py-0",
    sm: "py-8 md:py-12",
    md: "py-12 md:py-20",
    lg: "py-20 md:py-28 lg:py-32",
    xl: "py-28 md:py-36 lg:py-44",
  };

  return (
    <Component
      className={cn(
        "relative w-full overflow-hidden",
        spacingClasses[spacing],
        hasAsymmetricGrid && "relative before:absolute before:inset-0 before:pointer-events-none before:bg-[linear-gradient(to_right,#151B26_1px,transparent_1px)] before:bg-[size:4rem_4rem] before:opacity-15",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
