"use client";

import { ArrowDownDoubleIcon, CrownIcon, Pin02Icon } from "@hugeicons/core-free-icons";
import { Fragment, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Divider, TitleBlock } from "@/components/ui/primitives";
import { DataTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { formatInt, formatPercent, ratio } from "@/lib/format";
import type { LeaderRow, PipelineData, SourcesData } from "@/lib/types";
import { useDashboard } from "./dashboard-provider";

/* Pipeline row */
export function PipelineRow({
  label,
  value,
  total,
  previous,
  color,
}: {
  label: string;
  value: number;
  total: number;
  previous?: { label: string; value: number };
  color: string;
}) {
  const conversion = previous ? ratio(value, previous.value) : null;
  const share = ratio(value, total);
  return (
    <DataTooltip
      header={label}
      rows={[
        { color, label: "Count", value: formatInt(value) },
        ...(previous ? [{ color, label: `From ${previous.label.toLowerCase()}`, value: formatPercent(conversion ?? 0) }] : []),
        { color, label: "Of positive messages", value: formatPercent(share) },
      ]}
    >
      <div tabIndex={0} className="-mx-1 flex flex-col gap-[6px] rounded-[4px] px-1 outline-none focus-visible:outline-2 focus-visible:outline-brand">
        <div className="flex items-center justify-between text-[10px] leading-normal text-pipe">
          <span>{label}</span>
          <span className="flex w-[90px] items-center justify-between">
            <span className="tnum">{formatInt(value)}</span>
            {conversion !== null ? (
              <span className="tnum flex items-center gap-[2px] text-positive">
                <Icon icon={ArrowDownDoubleIcon} size={12} />
                {formatPercent(conversion)}
              </span>
            ) : null}
          </span>
        </div>
        <div className="h-[7px] w-full overflow-hidden rounded-[4px/0.75px] bg-brand/10">
          <div
            className="h-full rounded-[4px/0.75px] transition-[width] duration-[250ms] ease-[var(--ease-in-out-strong)]"
            style={{ width: `${Math.max(share * 100, value > 0 ? 1 : 0)}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </DataTooltip>
  );
}

function ConversionPipeline({ pipeline }: { pipeline: PipelineData }) {
  const stages = [
    { label: "Positive messages", value: pipeline.positive, color: "#9e7bff" },
    { label: "MG1", value: pipeline.mg1, color: "#7b5bff" },
    { label: "Follow up 2+", value: pipeline.followUps, color: "#6a4bf0" },
    { label: "New customers", value: pipeline.newCustomers, color: "#5a3bd6" },
  ];
  return (
    <section aria-labelledby="pipeline-title" className="flex flex-col gap-[14px] px-[13px] pt-[18px] pb-5">
      <TitleBlock id="pipeline-title" title="Conversion Pipeline" />
      <div className="flex flex-col gap-4">
        {stages.map((stage, i) => (
          <PipelineRow
            key={stage.label}
            label={stage.label}
            value={stage.value}
            total={pipeline.positive}
            previous={i > 0 ? stages[i - 1] : undefined}
            color={stage.color}
          />
        ))}
      </div>
    </section>
  );
}

const SOURCES: { key: keyof SourcesData; label: string; color: string }[] = [
  { key: "walkIns", label: "Walk-ins", color: "#7b5bff" },
  { key: "referrals", label: "Referrals", color: "#e5559b" },
  { key: "campaigns", label: "Campaigns", color: "#7aa2f7" },
  { key: "other", label: "Other", color: "#e3b341" },
];

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const point = (angle: number) => [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
  const [x1, y1] = point(start);
  const [x2, y2] = point(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M${x1.toFixed(2)},${y1.toFixed(2)}A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

function SourceDonut({ sources }: { sources: SourcesData }) {
  const [active, setActive] = useState<keyof SourcesData | null>(null);
  const total = SOURCES.reduce((sum, s) => sum + sources[s.key], 0);
  const gap = 0.07;
  const sweeps = SOURCES.map((s) => (total === 0 ? 0 : (sources[s.key] / total) * Math.PI * 2));
  const arcs = SOURCES.map((s, i) => {
    const start = sweeps.slice(0, i).reduce((sum, v) => sum + v, 0);
    return { ...s, start: start + gap / 2, end: start + Math.max(sweeps[i] - gap / 2, gap / 2 + 0.001) };
  });
  const activeSource = SOURCES.find((s) => s.key === active);

  return (
    <section aria-labelledby="sources-title" className="flex flex-col gap-[22px] px-[13px] pt-[18px] pb-5">
      <TitleBlock id="sources-title" title="Positive message by source" />
      <div className="flex items-center justify-center gap-[14px]">
        <div className="relative size-[150px] shrink-0">
          <svg viewBox="0 0 150 150" className="size-full -rotate-0" aria-hidden onMouseLeave={() => setActive(null)}>
            {arcs.map((a) => (
              <path
                key={a.key}
                d={arcPath(75, 75, 64.5, a.start, a.end)}
                fill="none"
                strokeWidth={21}
                strokeLinecap="butt"
                stroke={active && active !== a.key ? `color-mix(in srgb, ${a.color} 35%, #1a1a1a)` : a.color}
                className="transition-[stroke] duration-150 ease-out"
                onMouseEnter={() => setActive(a.key)}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[3.4px]">
            <span className="tnum text-[22px] leading-[0.9] font-medium tracking-[-1.1px] text-ink">
              {activeSource ? formatPercent(ratio(sources[activeSource.key], total), 1) : formatInt(total)}
            </span>
            <span className="text-[12px] leading-[1.2] text-ink/50">{activeSource ? activeSource.label : "Total"}</span>
          </div>
        </div>
        <ul className="flex w-[191px] flex-col gap-[6px]">
          {SOURCES.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                onMouseEnter={() => setActive(s.key)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(s.key)}
                onBlur={() => setActive(null)}
                aria-label={`${s.label}: ${formatInt(sources[s.key])} messages, ${formatPercent(ratio(sources[s.key], total), 1)}`}
                className={cn(
                  "-mx-1 flex w-[calc(100%+8px)] items-center justify-between rounded-[4px] px-1 py-[5px] outline-none transition-opacity duration-150 ease-out",
                  active && active !== s.key && "opacity-40",
                )}
              >
                <span className="flex items-center gap-[6px] text-[14px] leading-[1.3] font-medium text-ink">
                  <span className="size-[6px] rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="tnum text-[12px] leading-[1.3] font-medium text-donut-value">
                  {formatPercent(ratio(sources[s.key], total), 1)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Leaderboard row */
export function LeaderboardRow({ row, onOpen, subtitle }: { row: LeaderRow; onOpen?: (id: number) => void; subtitle?: string }) {
  const Element = onOpen ? "button" : "div";
  return (
    <Element
      {...(onOpen ? { type: "button" as const, onClick: () => onOpen(row.id) } : {})}
      className={cn(
        "-mx-2 flex w-[calc(100%+16px)] items-center justify-between rounded-[6px] border border-transparent px-2 py-[6px] text-left outline-none",
        onOpen && "hover:nav-surface focus-visible:nav-surface",
      )}
    >
      <span className="flex min-w-0 items-center gap-[10px]">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full border border-line bg-raised text-label",
            row.rank > 1 && "shadow-[0_0_4.6px_rgb(0_0_0/0.5)]",
          )}
        >
          {row.rank === 1 ? <Icon icon={CrownIcon} size={24} /> : <span className="tnum text-[22px] leading-[1.3] font-medium text-ink">{row.rank}</span>}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[14px] leading-[1.3] font-medium text-ink">{row.name}</span>
          {subtitle ? <span className="truncate text-[12px] leading-4 text-muted-2">{subtitle}</span> : null}
        </span>
        {row.pinned ? (
          <span className="text-brand" aria-label="Pinned">
            <Icon icon={Pin02Icon} size={14} />
          </span>
        ) : null}
      </span>
      <span className="tnum text-[14px] leading-[1.3] font-medium text-ink-strong">{formatInt(row.mg1)}</span>
    </Element>
  );
}

function Leaderboard({ rows }: { rows: LeaderRow[] }) {
  const { openTeam } = useDashboard();
  return (
    <section aria-labelledby="leaderboard-title" className="flex flex-col gap-[22px] px-[13px] pt-[18px] pb-6">
      <TitleBlock id="leaderboard-title" title="Top leaderboard" />
      {rows.length === 0 ? (
        <p className="text-[14px] text-muted">No legs in this scope yet.</p>
      ) : (
        <div className="flex flex-col gap-[6px]">
          <Divider />
          {rows.map((row) => (
            <Fragment key={row.id}>
              <LeaderboardRow row={row} onOpen={openTeam} />
              <Divider />
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}

export function InsightsColumn() {
  const { data, pending } = useDashboard();
  return (
    <div data-pending={pending} className="data-region flex flex-col">
      <ConversionPipeline pipeline={data.pipeline} />
      <Divider />
      <SourceDonut sources={data.sources} />
      <Divider />
      <Leaderboard rows={data.leaderboard} />
    </div>
  );
}
