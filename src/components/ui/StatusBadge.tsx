"use client";

import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", dotColor: "bg-yellow-500" },
  shortlisted: { label: "Shortlisted", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-500" },
  interview: { label: "Interview", color: "bg-purple-100 text-purple-700", dotColor: "bg-purple-500" },
  selected: { label: "Selected", color: "bg-green-100 text-green-700", dotColor: "bg-green-500" },
  hired: { label: "Hired", color: "bg-green-100 text-green-700", dotColor: "bg-green-500" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", dotColor: "bg-red-500" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  active: { label: "Active", color: "bg-green-100 text-green-700", dotColor: "bg-green-500" },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  open: { label: "Open", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-500" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  on_hold: { label: "On Hold", color: "bg-orange-100 text-orange-700", dotColor: "bg-orange-500" },
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  new: { label: "New", color: "bg-cyan-100 text-cyan-700", dotColor: "bg-cyan-500" },
  contacted: { label: "Contacted", color: "bg-indigo-100 text-indigo-700", dotColor: "bg-indigo-500" },
  scheduled: { label: "Scheduled", color: "bg-purple-100 text-purple-700", dotColor: "bg-purple-500" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", dotColor: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", dotColor: "bg-red-500" },
};

const DEFAULT_CONFIG = { label: "Unknown", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" };

interface StatusBadgeProps {
  status: string;
  dot?: boolean;
  className?: string;
}

function StatusBadge({ status, dot = true, className }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/ /g, "_");
  const config = STATUS_CONFIG[key] ?? { ...DEFAULT_CONFIG, label: status };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap",
        config.color,
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)} />}
      {config.label}
    </span>
  );
}

export { StatusBadge, STATUS_CONFIG, type StatusBadgeProps };
