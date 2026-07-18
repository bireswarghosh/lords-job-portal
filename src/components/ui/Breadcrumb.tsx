"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-sm", className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1 text-text-secondary hover:text-primary transition-colors"
              >
                {item.icon}
                {item.label}
              </Link>
            ) : (
              <span className={cn("flex items-center gap-1", isLast ? "text-text-primary font-medium" : "text-text-secondary")}>
                {item.icon}
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export { Breadcrumb, type BreadcrumbProps, type BreadcrumbItem };
