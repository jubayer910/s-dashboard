"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Segmented } from "@/components/ui/segmented";
import { DataTooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import type { ChartKey } from "@/lib/dashboard-state";
import { formatDay, toDate } from "@/lib/dates";
import { formatInt, formatPercent } from "@/lib/format";
import type { ChartPoint } from "@/lib/types";
import { useDashboard } from "./dashboard-provider";

type SeriesKey = "customers" | "mg1" | "efficiency";

/* Values from the v2 Figma chart (Group 2147229862 / Group 46) */
const SERIES: {
  key: SeriesKey;
  label: string;
  legend: string;
  stroke: string;
  dot: string;
  width: number;
  opacity: number;
}[] = [
  { key: "customers", label: "Customers", legend: "#7aa2f7", stroke: "#7aa2f7", dot: "#7aa2f7", width: 1.07, opacity: 0.2 },
  { key: "mg1", label: "MGI", legend: "#e5559b", stroke: "#e5559b", dot: "#e5559b", width: 1.07, opacity: 0.3 },
  { key: "efficiency", label: "Efficiency", legend: "#7b5bff", stroke: "#7b5bff", dot: "#7b5bff", width: 2, opacity: 1 },
];

const HEIGHT = 212;
const PAD_LEFT = 40;
const PAD_RIGHT = 36;
const PAD_TOP = 10.5;
const PAD_BOTTOM = 10.5;

function niceMax(value: number) {
  if (value <= 0) return 3;
  const rough = value / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 3, 5, 6, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  return step * 3;
}

function linePath(points: ChartPoint[], x: (i: number) => number, y: (p: ChartPoint) => number) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p).toFixed(2)}`).join("");
}

function tooltipDate(iso: string) {
  return toDate(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
}

export function PerformanceChart() {
  const { data, state, update, pending } = useDashboard();
  const points = data.chart;
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(774);
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());
  const [hoveredLegend, setHoveredLegend] = useState<SeriesKey | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const plotWidth = width - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  // Each band keeps the Figma layout: efficiency on top, MGI in the middle, customers underneath.
  const scales = useMemo(() => {
    const mg1Peak = Math.max(0, ...points.map((p) => p.mg1));
    const customersPeak = Math.max(0, ...points.map((p) => p.customers));
    const effPeak = Math.max(0, ...points.map((p) => p.efficiency));
    const stepPct = Math.max(5, Math.ceil((effPeak * 100) / 2.85 / 5) * 5);
    return {
      left: niceMax(Math.max(mg1Peak / 0.62, customersPeak / 0.3, 3)),
      right: (stepPct * 3) / 100,
    };
  }, [points]);

  const x = (i: number) => PAD_LEFT + (points.length <= 1 ? 0 : (i / (points.length - 1)) * plotWidth);
  const yLeft = (v: number) => PAD_TOP + plotHeight - (v / scales.left) * plotHeight;
  const yRight = (v: number) => PAD_TOP + plotHeight - (v / scales.right) * plotHeight;
  const yFor = (key: SeriesKey) => (p: ChartPoint) => (key === "efficiency" ? yRight(p.efficiency) : yLeft(p[key]));

  const visible = SERIES.filter((s) => !hidden.has(s.key));
  const legendFocus = hoveredLegend && !hidden.has(hoveredLegend) ? hoveredLegend : null;
  const primary: SeriesKey = legendFocus ?? (hidden.has("efficiency") ? (visible[0]?.key ?? "efficiency") : "efficiency");
  const primarySeries = SERIES.find((s) => s.key === primary)!;

  const ticks = [3, 2, 1, 0];
  const labelIndexes = points.length > 1 ? Array.from({ length: 6 }, (_, i) => Math.round((i / 5) * (points.length - 1))) : [0];

  const toggle = (key: SeriesKey) => {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else if (SERIES.length - next.size > 1) next.add(key);
      return next;
    });
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relative = ((event.clientX - rect.left) / rect.width) * width - PAD_LEFT;
    const index = Math.round((relative / plotWidth) * (points.length - 1));
    setActive(Math.min(points.length - 1, Math.max(0, index)));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      setActive((current) => Math.min(points.length - 1, Math.max(0, (current ?? points.length - 1) + delta)));
    } else if (event.key === "Escape") {
      setActive(null);
    }
  };

  const activePoint = active !== null ? points[active] : null;
  const areaPath =
    !hidden.has("efficiency") && points.length > 1
      ? `${linePath(points, x, yFor("efficiency"))}L${x(points.length - 1).toFixed(2)},${HEIGHT - PAD_BOTTOM}L${x(0).toFixed(2)},${HEIGHT - PAD_BOTTOM}Z`
      : null;

  const dotX = active !== null ? x(active) : 0;
  const dotY = activePoint ? yFor(primary)(activePoint) : 0;
  const flip = dotX > width - 140;

  return (
    <section aria-labelledby="trend-title" className="flex flex-col px-3 pt-[18px] pb-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-[7px]">
          <h2 id="trend-title" className="text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">
            Performance trend
          </h2>
          <div className="flex items-center gap-2" role="group" aria-label="Series">
            {SERIES.map((s) => {
              const off = hidden.has(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={!off}
                  onClick={() => toggle(s.key)}
                  onMouseEnter={() => setHoveredLegend(s.key)}
                  onMouseLeave={() => setHoveredLegend(null)}
                  onFocus={() => setHoveredLegend(s.key)}
                  onBlur={() => setHoveredLegend(null)}
                  className={cn(
                    "-m-[3px] flex items-center gap-1 rounded-[3px] p-[3px] text-[9px] leading-none text-legend outline-none transition-opacity duration-150 ease-out focus-visible:outline-1 focus-visible:outline-brand",
                    off && "line-through opacity-40",
                  )}
                >
                  <span className="size-2 rounded-[2px]" style={{ backgroundColor: s.legend }} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
        <Segmented<ChartKey>
          variant="range"
          label="Chart range"
          value={state.chart}
          onValueChange={(chart) => update({ chart })}
          options={[
            { value: "4w", label: "4W", ariaLabel: "4 weeks" },
            { value: "8w", label: "8W", ariaLabel: "8 weeks" },
            { value: "12w", label: "12W", ariaLabel: "12 weeks" },
          ]}
        />
      </div>

      <div ref={containerRef} data-pending={pending} className="data-region relative mt-[18px]">
        <svg
          role="img"
          aria-label={`Performance trend, ${points.length} days. Use the left and right arrow keys to read values.`}
          tabIndex={0}
          width="100%"
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block touch-pan-y overflow-visible outline-none focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-brand"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          <defs>
            <linearGradient id="trend-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7b5bff" />
              <stop offset="100%" stopColor="#7b5bff" stopOpacity="0.1" />
            </linearGradient>
            <filter id="trend-line-shadow" x="-5%" y="-20%" width="110%" height="140%">
              <feDropShadow dx="0" dy="3.06" stdDeviation="1.53" floodColor="#000" floodOpacity="0.04" />
            </filter>
            <filter id="trend-dot-shadow" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="1.53" stdDeviation="1.53" floodColor="#000" floodOpacity="0.18" />
            </filter>
          </defs>

          {ticks.map((t) => {
            const y = PAD_TOP + plotHeight - (t / 3) * plotHeight;
            return (
              <g key={t}>
                <line x1={PAD_LEFT} x2={width - PAD_RIGHT} y1={y} y2={y} stroke="#e4e4e4" strokeOpacity={0.1} strokeDasharray="4 4" />
                <text x={PAD_LEFT - 5} y={y} dy="0.35em" textAnchor="end" className="tnum fill-axis text-[14px]">
                  {formatInt((scales.left / 3) * t)}
                </text>
                <text x={width - PAD_RIGHT + 5} y={y} dy="0.35em" textAnchor="start" className="tnum fill-axis text-[14px]">
                  {Math.round(((scales.right * 100) / 3) * t)}%
                </text>
              </g>
            );
          })}

          {areaPath ? <path d={areaPath} fill="url(#trend-area)" fillOpacity={0.05} /> : null}

          {[...SERIES].map((s) =>
            hidden.has(s.key) || points.length < 2 ? null : (
              <path
                key={s.key}
                d={linePath(points, x, yFor(s.key))}
                fill="none"
                stroke={s.stroke}
                strokeWidth={s.width}
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#trend-line-shadow)"
                opacity={legendFocus === s.key && s.key !== "efficiency" ? 0.8 : s.opacity}
                className="transition-opacity duration-150 ease-out"
              />
            ),
          )}

          {activePoint ? (
            <g aria-hidden>
              <line
                x1={dotX}
                x2={dotX}
                y1={PAD_TOP - 1.5}
                y2={HEIGHT - PAD_BOTTOM + 0.5}
                stroke="#909090"
                strokeOpacity={0.1}
                strokeWidth={0.76}
                strokeDasharray="4 4"
              />
              {visible.map((s) => (
                <g key={s.key} opacity={s.key === primary ? 1 : 0.1} filter="url(#trend-dot-shadow)">
                  <circle cx={dotX} cy={yFor(s.key)(activePoint)} r={4} fill={s.dot} />
                  <circle cx={dotX} cy={yFor(s.key)(activePoint)} r={3.24} fill="none" stroke="#fff" strokeWidth={1.53} />
                </g>
              ))}
            </g>
          ) : null}
        </svg>

        {activePoint ? (
          <div
            aria-hidden
            className="tooltip-surface pointer-events-none absolute z-10 flex flex-col gap-[3px] p-[7px]"
            style={{
              top: Math.max(0, dotY - 20),
              left: flip ? undefined : dotX + 6,
              right: flip ? width - dotX + 6 : undefined,
            }}
          >
            <DataTooltipContent
              header={tooltipDate(activePoint.day)}
              rows={[
                {
                  color: primarySeries.dot,
                  label: primarySeries.label,
                  value: primary === "efficiency" ? formatPercent(activePoint.efficiency, 0) : formatInt(activePoint[primary]),
                },
              ]}
            />
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {activePoint
            ? `${formatDay(activePoint.day)}: efficiency ${formatPercent(activePoint.efficiency, 0)}, MGI ${formatInt(activePoint.mg1)} over 7 days, customers ${formatInt(activePoint.customers)} over 28 days`
            : ""}
        </p>
      </div>

      <div className="relative mt-[14px] h-[21px]" aria-hidden>
        {labelIndexes.map((i, n) => (
          <span
            key={`${i}-${n}`}
            className="tnum absolute top-0 text-[14px] leading-[1.5] whitespace-nowrap text-axis"
            style={{
              left: `${(x(i) / width) * 100}%`,
              transform: n === 0 ? "translateX(0)" : n === labelIndexes.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
            }}
          >
            {points[i] ? formatDay(points[i].day) : ""}
          </span>
        ))}
      </div>
    </section>
  );
}
