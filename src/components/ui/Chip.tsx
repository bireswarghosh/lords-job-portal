"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipVariant = "default" | "primary" | "secondary" | "success" | "danger" | "warning" | "outline";

interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  removable?: boolean;
  onRemove?: () => void;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<ChipVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-blue-100 text-blue-700",
  secondary: "bg-green-100 text-green-700",
  success: "bg-green-100 text-green-700",
  danger: "bg-red-100 text-red-700",
  warning: "bg-yellow-100 text-yellow-700",
  outline: "bg-transparent border border-border text-text-secondary",
};

function Chip({ children, variant = "default", removable = false, onRemove, icon, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap",
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="shrink-0 p-0.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer -mr-0.5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

export { Chip, type ChipProps, type ChipVariant };
