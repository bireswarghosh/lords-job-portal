"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

interface TabPanelProps {
  tabId: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

function Tabs({ tabs, activeTab: controlledTab, onChange, className }: TabsProps) {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id ?? "");
  const activeTab = controlledTab ?? internalTab;
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [activeTab]);

  const handleChange = (id: string) => {
    if (!controlledTab) setInternalTab(id);
    onChange?.(id);
  };

  return (
    <div className={cn("relative", className)}>
      <div ref={containerRef} className="relative flex border-b border-border">
        <div
          className="absolute bottom-0 h-0.5 bg-primary transition-all duration-200 ease-out"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            disabled={tab.disabled}
            onClick={() => handleChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "text-primary"
                : "text-text-secondary hover:text-text-primary",
              tab.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full font-medium",
                  activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-text-secondary"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function TabPanel({ tabId, activeTab, children, className }: TabPanelProps) {
  if (tabId !== activeTab) return null;
  return (
    <div className={cn("py-4 animate-fade-in", className)}>
      {children}
    </div>
  );
}

export { Tabs, TabPanel, type TabsProps, type TabPanelProps, type Tab };
