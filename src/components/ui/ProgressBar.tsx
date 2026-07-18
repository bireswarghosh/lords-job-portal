"use client";

import { cn } from "@/lib/utils";

type ProgressBarColor = "primary" | "secondary" | "success" | "danger" | "warning" | "info";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: ProgressBarColor;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  striped?: boolean;
  animated?: boolean;
  className?: string;
}

const colorStyles: Record<ProgressBarColor, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-green-600",
  danger: "bg-red-600",
  warning: "bg-yellow-500",
  info: "bg-cyan-500",
};

const sizeStyles: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

function ProgressBar({
  value,
  max = 100,
  color = "primary",
  showLabel = false,
  size = "md",
  striped = false,
  animated = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-text-secondary">Progress</span>
          <span className="text-xs font-semibold text-text-primary">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", sizeStyles[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorStyles[color],
            striped && "bg-stripes",
            animated && striped && "animate-stripes"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export { ProgressBar, type ProgressBarProps, type ProgressBarColor };
