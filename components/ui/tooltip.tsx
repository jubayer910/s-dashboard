"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** 400ms before the first tooltip; neighbours open instantly after that. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <BaseTooltip.Provider delay={400} closeDelay={0} timeout={400}>
      {children}
    </BaseTooltip.Provider>
  );
}

function TooltipShell({
  trigger,
  children,
  side = "bottom",
  align = "center",
  className,
  trackCursorAxis,
}: {
  trigger: ReactElement;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
  trackCursorAxis?: "none" | "x" | "y" | "both";
}) {
  return (
    <BaseTooltip.Root trackCursorAxis={trackCursorAxis} disableHoverablePopup>
      <BaseTooltip.Trigger render={trigger} delay={400} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} align={align} sideOffset={6} collisionPadding={12} className="z-50">
          <BaseTooltip.Popup className={cn("tooltip-surface tooltip-popup flex flex-col gap-[3px] p-[7px]", className)}>
            {children}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/* Tooltip / Definition */
export function DefinitionTooltip({
  title,
  body,
  children,
  side,
}: {
  title: string;
  body: string;
  children: ReactElement;
  side?: "top" | "bottom";
}) {
  return (
    <TooltipShell trigger={children} side={side} className="w-[200px]">
      <span className="text-[10.5px] leading-[1.35] font-medium tracking-[0.21px] text-white">{title}</span>
      <span className="text-[10.5px] leading-[1.35] tracking-[0.21px] text-white/80">{body}</span>
    </TooltipShell>
  );
}

/* Tooltip / Data */
export function DataTooltipContent({
  header,
  rows,
}: {
  header: string;
  rows: { color: string; label: string; value: string }[];
}) {
  return (
    <>
      <span className="text-[10.5px] leading-[1.35] tracking-[0.21px] text-white/30">{header}</span>
      {rows.map((row) => (
        <span key={row.label} className="flex items-center gap-[3.5px] text-[10.5px] leading-[1.35] tracking-[0.21px]">
          <span
            className="size-[9px] rounded-[1.75px] shadow-[inset_0_3.5px_3.5px_rgb(255_255_255/0.29)]"
            style={{ backgroundColor: row.color }}
          />
          <span className="text-white/80">{row.label}</span>
          <span className="tnum font-medium text-white">{row.value}</span>
        </span>
      ))}
    </>
  );
}

export function DataTooltip({
  header,
  rows,
  children,
  side = "top",
  trackCursorAxis = "x",
}: {
  header: string;
  rows: { color: string; label: string; value: string }[];
  children: ReactElement;
  side?: "top" | "bottom";
  trackCursorAxis?: "none" | "x";
}) {
  return (
    <TooltipShell trigger={children} side={side} trackCursorAxis={trackCursorAxis}>
      <DataTooltipContent header={header} rows={rows} />
    </TooltipShell>
  );
}
