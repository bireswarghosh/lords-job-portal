"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  change?: number;
  trend?: number[];
  className?: string;
  onClick?: () => void;
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 32;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={`spark-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? "#198754" : "#dc3545"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={positive ? "#198754" : "#dc3545"} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${positive})`} />
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#198754" : "#dc3545"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KPICard({ icon, label, value, change, trend, className, onClick }: KPICardProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-surface rounded-xl kpi-card-shadow border border-border/50 p-5 flex items-start gap-4",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all",
        className
      )}
    >
      {icon && (
        <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary/10 text-primary shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-secondary truncate">{label}</p>
        <div className="flex items-end gap-2 mt-1">
          <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
          {trend && <MiniSparkline data={trend} positive={isPositive} />}
        </div>
        {change != null && (
          <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", isPositive ? "text-green-600" : "text-red-600")}>
            <svg
              className={cn("w-3.5 h-3.5", !isPositive && "rotate-180")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
            <span>{Math.abs(change)}%</span>
            <span className="text-text-muted font-normal">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}

export { KPICard, type KPICardProps };
