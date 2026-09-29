"use client";

import {
  DashboardSpeed01Icon,
  FlashIcon,
  Invoice01Icon,
  Message01Icon,
  TaskDone01Icon,
  UserAdd02Icon,
} from "@hugeicons/core-free-icons";
import type { CSSProperties } from "react";
import { Icon, type IconData } from "@/components/ui/icon";
import { DeltaPill, iconButtonClass } from "@/components/ui/primitives";
import { DefinitionTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { formatChange, formatDiff, formatInt, formatPercent, formatPoints, tone } from "@/lib/format";
import type { MetricPair } from "@/lib/types";
import { useDashboard } from "./dashboard-provider";

export type KpiFormat = "count" | "ratio";

/* KPI (cell from the v2 metric strip) */
export function Kpi({
  label,
  metric,
  format,
  icon,
  definition,
  pct,
  caption,
}: {
  label: string;
  metric: MetricPair;
  format: KpiFormat;
  icon: IconData;
  definition: string;
  pct: boolean;
  caption: string;
}) {
  const value = format === "ratio" ? formatPercent(metric.value) : formatInt(metric.value);
  const hasPrevious = metric.previous !== null;
  const delta = !hasPrevious
    ? null
    : format === "ratio"
      ? formatPoints(metric.value, metric.previous!)
      : pct
        ? formatChange(metric.value, metric.previous!)
        : formatDiff(metric.value, metric.previous!);

  return (
    <div className="relative flex h-[88px] min-w-0 flex-1 flex-col">
      <p className="pr-10 text-[12px] leading-[1.1] text-kpi">{label}</p>
      <p className="tnum mt-[11px] ml-px text-[28px] leading-[23px] font-medium text-ink">{value}</p>
      <div className="mt-auto flex items-center gap-[5px]">
        {delta ? (
          <>
            <DeltaPill tone={tone(metric.value, metric.previous!)}>{delta}</DeltaPill>
            <span className="text-[12px] leading-[1.1] text-caption">{caption}</span>
          </>
        ) : (
          <span className="text-[12px] leading-[1.1] text-muted">{hasPrevious ? "" : "No comparison"}</span>
        )}
      </div>
      <DefinitionTooltip title={label} body={definition}>
        <button type="button" aria-label={`About ${label}`} className={cn(iconButtonClass, "absolute top-0 right-0")}>
          <Icon icon={icon} size={18} className="kpi-icon" />
        </button>
      </DefinitionTooltip>
    </div>
  );
}

export function KpiStrip() {
  const { data, state, pending } = useDashboard();
  const { kpis } = data;
  const caption = state.cmp === "year" ? "vs last year" : "vs prior";
  const cells = [
    { label: "Active subs", metric: kpis.activeSubs, format: "count", icon: Invoice01Icon, accent: "#3fb37f", definition: "Active subscriptions across these legs on the last day of the range." },
    { label: "New Customers", metric: kpis.newCustomers, format: "count", icon: UserAdd02Icon, accent: "#7b5bff", definition: "Customers who completed onboarding during the range." },
    { label: "MG1", metric: kpis.mg1, format: "count", icon: FlashIcon, accent: "#7aa2f7", definition: "First meetings booked from positive messages." },
    { label: "Efficiency", metric: kpis.efficiency, format: "ratio", icon: DashboardSpeed01Icon, accent: "#e5559b", definition: "Share of positive messages that converted to MG1." },
    { label: "Positive messages", metric: kpis.positive, format: "count", icon: Message01Icon, accent: "#e3b341", definition: "Conversations that got a positive reply during the range." },
    { label: "Reporting rate", metric: kpis.reportingRate, format: "ratio", icon: TaskDone01Icon, accent: "#e5484d", definition: "People who reported activity, averaged over every day in the range." },
  ] as const;

  // 6 across on wide screens, 3 × 2 on laptops, 2 × 3 on phones — etched dividers between cells.
  const dividerClasses = [
    "before:hidden sm:before:hidden xl:before:hidden after:hidden sm:after:hidden",
    "before:block sm:before:block xl:before:block after:hidden sm:after:hidden",
    "before:hidden sm:before:block xl:before:block after:block sm:after:hidden",
    "before:block sm:before:hidden xl:before:block after:block sm:after:block",
    "before:hidden sm:before:block xl:before:block after:block sm:after:block",
    "before:block sm:before:block xl:before:block after:block sm:after:block",
  ];

  return (
    <section aria-label="Key metrics" data-pending={pending} className="data-region">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {cells.map(({ accent, ...cell }, i) => (
          <div
            key={cell.label}
            style={{ "--kpi-accent": accent } as CSSProperties}
            className={cn(
              "kpi-cell relative flex h-[110px] min-w-0 items-center px-3",
              "before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-black before:shadow-[1px_0_0_#232323] before:content-['']",
              "after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-black after:shadow-[0_1px_0_#232323] after:content-[''] xl:after:hidden",
              dividerClasses[i],
            )}
          >
            <Kpi {...cell} pct={state.pct} caption={caption} />
          </div>
        ))}
      </div>
    </section>
  );
}
