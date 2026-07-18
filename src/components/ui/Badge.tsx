"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-blue-100 text-blue-700",
  secondary: "bg-green-100 text-green-700",
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-700",
  warning: "bg-yellow-100 text-yellow-700",
  info: "bg-cyan-100 text-cyan-700",
  outline: "bg-transparent border border-border text-text-secondary",
};

const dotColorStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-500",
  primary: "bg-blue-500",
  secondary: "bg-green-500",
  success: "bg-green-500",
  danger: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-cyan-500",
  outline: "bg-gray-400",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", dot = false, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColorStyles[variant])} />
      )}
      {children}
    </span>
  )
);
Badge.displayName = "Badge";

export { Badge, type BadgeProps, type BadgeVariant };
