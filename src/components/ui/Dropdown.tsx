"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownItem {
  kind: "item";
  id: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownSeparator {
  kind: "separator";
}

interface DropdownLabel {
  kind: "label";
  label: string;
}

type DropdownMenuItem = DropdownItem | DropdownSeparator | DropdownLabel;

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  onSelect?: (id: string) => void;
  align?: "left" | "right";
  className?: string;
}

function Dropdown({ trigger, items, onSelect, align = "left", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: align === "right" ? rect.right - 200 : rect.left,
        zIndex: 9999,
      });
    }
  }, [open, align]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          style={menuStyle}
          className={cn(
            "min-w-[200px] bg-surface rounded-lg border border-border card-shadow py-1 animate-slide-in"
          )}
        >
          {items.map((item, idx) => {
            if (item.kind === "separator") {
              return <div key={`sep-${idx}`} className="my-1 border-t border-border" />;
            }
            if (item.kind === "label") {
              return (
                <div key={`label-${idx}`} className="px-3 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {item.label}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => {
                  onSelect?.(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer",
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-text-primary hover:bg-background",
                  item.disabled && "opacity-40 cursor-not-allowed"
                )}
              >
                {item.icon && <span className="shrink-0 text-text-secondary">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { Dropdown, type DropdownProps, type DropdownItem, type DropdownMenuItem };
