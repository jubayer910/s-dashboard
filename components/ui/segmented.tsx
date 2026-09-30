"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconData } from "./icon";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: IconData;
  ariaLabel?: string;
}

/**
 * Segmented / Tabs (track #191919 with inner shadow) and Segmented / Range.
 * High-frequency control: the active surface swaps with a 150ms background change, no sliding pill.
 */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  variant = "tabs",
  label,
  className,
  itemClassName,
  iconClassName,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentOption<T>[];
  variant?: "tabs" | "range";
  label: string;
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        const selected = next[0] as T | undefined;
        if (selected && selected !== value) onValueChange(selected);
      }}
      className={cn(
        "inline-flex items-center",
        variant === "tabs"
          ? "rounded-[8px] bg-track p-[2px] shadow-[inset_0_2px_8px_rgb(0_0_0/0.25)]"
          : "rounded-[6px] bg-track",
        className,
      )}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          aria-label={option.ariaLabel}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-[6px] border border-transparent px-[10px] text-[14px] leading-[1.45] whitespace-nowrap text-label outline-none select-none",
            "transition-[background-color,border-color] duration-150 ease-out",
            "hover:bg-raised/50",
            "data-[pressed]:bg-raised data-[pressed]:shadow-[0_0_4.6px_rgb(0_0_0/0.5)]",
            variant === "tabs"
              ? "data-[pressed]:border-track data-[pressed]:shadow-[0_0_4.6px_rgb(0_0_0/0.5),inset_0_2px_4px_rgb(255_255_255/0.2)]"
              : "data-[pressed]:border-line",
            "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
            itemClassName,
          )}
        >
          {option.icon ? <Icon icon={option.icon} size={16} className={iconClassName} /> : null}
          <span className="min-w-0 truncate">{option.label}</span>
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
