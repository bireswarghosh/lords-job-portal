"use client";

import { forwardRef, type ImgHTMLAttributes } from "react";
import { cn, getInitials } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "size" | "src"> {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
  online?: boolean;
  fallbackBg?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  sm: { container: "w-8 h-8", text: "text-xs", dot: "w-2.5 h-2.5 border" },
  md: { container: "w-10 h-10", text: "text-sm", dot: "w-3 h-3 border-2" },
  lg: { container: "w-12 h-12", text: "text-base", dot: "w-3.5 h-3.5 border-2" },
  xl: { container: "w-16 h-16", text: "text-lg", dot: "w-4 h-4 border-2" },
};

const bgColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
  "bg-cyan-100 text-cyan-700",
];

function getBgColor(name?: string): string {
  if (!name) return bgColors[0];
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return bgColors[hash % bgColors.length];
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = "md", online, fallbackBg, alt, className, ...props }, ref) => {
    const s = sizeStyles[size];
    const initials = getInitials(name || "U");
    const fallback = fallbackBg || getBgColor(name);

    return (
      <div ref={ref} className={cn("relative inline-flex shrink-0", className)}>
        {src ? (
          <img
            src={src}
            alt={alt || name || "Avatar"}
            className={cn(s.container, "rounded-full object-cover")}
            {...props}
          />
        ) : (
          <div
            className={cn(s.container, "rounded-full flex items-center justify-center font-semibold select-none", fallback)}
          >
            <span className={s.text}>{initials}</span>
          </div>
        )}
        {online != null && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full border-surface",
              online ? "bg-green-500" : "bg-gray-400",
              s.dot
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar, type AvatarProps, type AvatarSize };
