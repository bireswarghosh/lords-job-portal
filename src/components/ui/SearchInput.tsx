"use client";

import { useState, useEffect, useRef, forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
  onClear?: () => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, debounceMs = 300, onClear, value: controlledValue, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState("");
    const value = controlledValue ?? internalValue;
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(controlledValue as string);
      }
    }, [controlledValue]);

    const handleChange = (val: string) => {
      setInternalValue(val);
      if (debounceMs <= 0) {
        onSearch?.(val);
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onSearch?.(val), debounceMs);
      }
    };

    const handleClear = () => {
      setInternalValue("");
      onClear?.();
      onSearch?.("");
    };

    return (
      <div className={cn("relative", className)}>
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "w-full pl-10 pr-9 py-2 text-sm bg-surface border border-border rounded-lg",
            "text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15",
            "transition-colors"
          )}
          {...props}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput, type SearchInputProps };
