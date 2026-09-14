"use client";

import { Popover } from "@base-ui/react/popover";
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { Icon } from "@/components/ui/icon";
import { Button, Divider, IconButton } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { RANGE_LABELS, type RangeKey, resolvePresetRange } from "@/lib/dashboard-state";
import {
  addDays,
  daysInMonth,
  diffDays,
  formatMonthYear,
  formatRange,
  maxIso,
  minIso,
  toDate,
  toIso,
  weekdayIndex,
} from "@/lib/dates";
import { useDashboard } from "./dashboard-provider";

type Preset = Exclude<RangeKey, "custom"> | "today" | "yesterday";
const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  ...(Object.keys(RANGE_LABELS) as Exclude<RangeKey, "custom">[]).map((key) => ({ key, label: RANGE_LABELS[key] })),
];

function presetRange(key: Preset, asOf: string) {
  if (key === "today") return { from: asOf, to: asOf };
  if (key === "yesterday") return { from: addDays(asOf, -1), to: addDays(asOf, -1) };
  return resolvePresetRange(key, asOf);
}

function monthOf(iso: string) {
  const d = toDate(iso);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

function shiftMonth(m: { year: number; month: number }, delta: number) {
  const d = new Date(Date.UTC(m.year, m.month + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

function monthKey(m: { year: number; month: number }) {
  return m.year * 12 + m.month;
}

function MonthGrid({
  year,
  month,
  draft,
  hovered,
  selecting,
  focusDay,
  minDay,
  asOf,
  onHover,
  onPick,
  onKeyDown,
  registerCell,
}: {
  year: number;
  month: number;
  draft: { from: string; to: string };
  hovered: string | null;
  selecting: "start" | "end";
  focusDay: string;
  minDay: string;
  asOf: string;
  onHover: (day: string | null) => void;
  onPick: (day: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, day: string) => void;
  registerCell: (day: string, element: HTMLButtonElement | null) => void;
}) {
  const first = toIso(new Date(Date.UTC(year, month, 1)));
  const offset = weekdayIndex(first);
  const total = daysInMonth(year, month);
  const cells = Math.ceil((offset + total) / 7) * 7;

  // While choosing the end, preview the band up to the hovered day.
  const bandFrom = selecting === "end" && hovered ? minIso(draft.from, hovered) : draft.from;
  const bandTo = selecting === "end" && hovered ? maxIso(draft.from, hovered) : draft.to;

  return (
    <div role="grid" aria-label={formatMonthYear(year, month)} className="flex flex-col gap-[2px]" onMouseLeave={() => onHover(null)}>
      <div role="row" className="flex">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} role="columnheader" className="grid h-5 w-[34px] place-items-center text-[12px] leading-4 text-th">
            {d}
          </span>
        ))}
      </div>
      {Array.from({ length: cells / 7 }, (_, row) => (
        <div role="row" key={row} className="flex">
          {Array.from({ length: 7 }, (_, col) => {
            const index = row * 7 + col;
            const date = index - offset + 1;
            if (date < 1 || date > total) return <span key={col} role="gridcell" className="h-8 w-[34px]" />;
            const day = toIso(new Date(Date.UTC(year, month, date)));
            const disabled = day > asOf || day < minDay;
            const isStart = day === bandFrom;
            const isEnd = day === bandTo;
            const inBand = day > bandFrom && day < bandTo;
            const leftEdge = col === 0 || date === 1;
            const rightEdge = col === 6 || date === total;
            return (
              <span key={col} role="gridcell" aria-selected={isStart || isEnd || inBand} className="relative">
                <button
                  ref={(el) => registerCell(day, el)}
                  type="button"
                  tabIndex={day === focusDay ? 0 : -1}
                  disabled={disabled}
                  aria-label={toDate(day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
                  aria-current={day === asOf ? "date" : undefined}
                  onMouseEnter={() => onHover(day)}
                  onFocus={() => onHover(null)}
                  onClick={() => onPick(day)}
                  onKeyDown={(event) => onKeyDown(event, day)}
                  className={cn(
                    "tnum relative grid h-8 w-[34px] place-items-center text-[14px] leading-5 outline-none select-none disabled:opacity-30",
                    "focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-lime",
                    inBand && "bg-lime/10 text-lime",
                    inBand && leftEdge && "rounded-l-[6px]",
                    inBand && rightEdge && "rounded-r-[6px]",
                    (isStart || isEnd) && "bg-lime font-medium text-track",
                    isStart && !isEnd && "rounded-l-[6px]",
                    isEnd && !isStart && "rounded-r-[6px]",
                    isStart && isEnd && "rounded-[6px]",
                    !inBand && !isStart && !isEnd && "rounded-[6px] text-nav hover:bg-raised",
                    day === asOf && !isStart && !isEnd && "font-medium text-ink",
                  )}
                >
                  {date}
                  {day === asOf ? <span aria-hidden className="absolute bottom-[3px] left-1/2 size-1 -translate-x-1/2 rounded-[1px] bg-lime" /> : null}
                </button>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function DateRangePicker({
  open,
  onOpenChange,
  anchor,
  finalFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: RefObject<HTMLElement | null>;
  finalFocus: RefObject<HTMLElement | null>;
}) {
  const { data, state, update } = useDashboard();
  const { asOf, minDay, period } = data;
  const [draft, setDraft] = useState({ from: period.from, to: period.to });
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [hovered, setHovered] = useState<string | null>(null);
  const [rightMonth, setRightMonth] = useState(() => monthOf(period.to));
  const [focusDay, setFocusDay] = useState(period.from);
  const [keyboard, setKeyboard] = useState(false);
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);

  // Reset the draft to the applied range every time the picker opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft({ from: period.from, to: period.to });
      setSelecting("start");
      setHovered(null);
      setRightMonth(monthOf(period.to));
      setFocusDay(period.from);
    }
  }

  useEffect(() => {
    if (pendingFocus.current) {
      cells.current.get(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  });

  const leftMonth = shiftMonth(rightMonth, -1);
  const canPrev = monthKey(leftMonth) > monthKey(monthOf(minDay));
  const canNext = monthKey(rightMonth) < monthKey(monthOf(asOf));

  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.key, asOf);
    return r.from === draft.from && r.to === draft.to && selecting === "start";
  })?.key;

  const pick = (day: string) => {
    if (selecting === "start" || day < draft.from) {
      setDraft({ from: day, to: day });
      setSelecting("end");
    } else {
      setDraft({ from: draft.from, to: day });
      setSelecting("start");
    }
    setFocusDay(day);
  };

  const moveFocus = (day: string) => {
    const clamped = minIso(maxIso(day, minDay), asOf);
    const target = monthOf(clamped);
    if (monthKey(target) > monthKey(rightMonth)) setRightMonth(target);
    else if (monthKey(target) < monthKey(leftMonth)) setRightMonth(shiftMonth(target, 1));
    setFocusDay(clamped);
    pendingFocus.current = clamped;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, day: string) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in steps) {
      event.preventDefault();
      moveFocus(addDays(day, steps[event.key]));
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const d = toDate(day);
      d.setUTCMonth(d.getUTCMonth() + (event.key === "PageUp" ? -1 : 1));
      moveFocus(toIso(d));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      moveFocus(addDays(day, event.key === "Home" ? -weekdayIndex(day) : 6 - weekdayIndex(day)));
    }
  };

  const apply = () => {
    const range = selecting === "end" ? { from: draft.from, to: draft.from } : draft;
    const preset = (Object.keys(RANGE_LABELS) as Exclude<RangeKey, "custom">[]).find((key) => {
      const r = resolvePresetRange(key, asOf);
      return r.from === range.from && r.to === range.to;
    });
    if (preset) update({ range: preset, from: null, to: null });
    else update({ range: "custom", from: range.from, to: range.to });
    onOpenChange(false);
  };

  const summaryTo = selecting === "end" && hovered && hovered >= draft.from ? hovered : draft.to;
  const dayCount = diffDays(draft.from, summaryTo) + 1;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next, details) => {
        setKeyboard(details.event instanceof KeyboardEvent);
        // Clicking the anchor itself is handled by the anchor's own toggle.
        if (!next && details.reason === "outside-press" && anchor.current?.contains(details.event.target as Node)) {
          details.cancel();
          return;
        }
        onOpenChange(next);
      }}
    >
      <Popover.Portal>
        <Popover.Positioner anchor={anchor} align="end" sideOffset={6} collisionPadding={12} className="z-50">
          <Popover.Popup
            data-kbd={keyboard || undefined}
            finalFocus={finalFocus}
            initialFocus={() => cells.current.get(focusDay) ?? true}
            className="overlay-surface pop-panel max-w-[calc(100vw-24px)] overflow-hidden rounded-[10px] outline-none"
          >
            <Popover.Title className="sr-only">Choose a date range</Popover.Title>
            <div className="flex overflow-x-auto">
              <div className="flex w-[188px] shrink-0 flex-col p-1">
                <span className="px-[10px] py-[6px] text-[12px] tracking-[0.48px] text-section uppercase">Presets</span>
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={activePreset === p.key}
                    onClick={() => {
                      const r = presetRange(p.key, asOf);
                      setDraft({ from: r.from, to: r.to });
                      setSelecting("start");
                      setRightMonth(monthOf(r.to));
                      setFocusDay(r.from);
                    }}
                    className="flex h-[30px] items-center justify-between rounded-[6px] border border-transparent px-[6px] text-left text-[14px] tracking-[-0.28px] text-nav outline-none hover:nav-surface focus-visible:nav-surface aria-pressed:text-ink"
                  >
                    {p.label}
                    {activePreset === p.key ? <Icon icon={Tick02Icon} size={15} className="icon-swap text-lime" /> : null}
                  </button>
                ))}
                <span
                  aria-pressed={!activePreset}
                  className="flex h-[30px] items-center justify-between rounded-[6px] border border-transparent px-[6px] text-[14px] tracking-[-0.28px] text-nav aria-pressed:text-ink"
                >
                  Custom
                  {!activePreset ? <Icon icon={Tick02Icon} size={15} className="text-lime" /> : null}
                </span>
              </div>
              <Divider orientation="vertical" />
              <div className="flex gap-7 px-5 pt-3 pb-4">
                {[leftMonth, rightMonth].map((m, i) => (
                  <div key={monthKey(m)} className="flex flex-col gap-2">
                    <div className="flex h-8 w-[238px] items-center justify-between">
                      {i === 0 ? (
                        <IconButton icon={ArrowLeft01Icon} label="Previous month" iconSize={16} disabled={!canPrev} onClick={() => setRightMonth(shiftMonth(rightMonth, -1))} />
                      ) : (
                        <span className="size-8" />
                      )}
                      <span aria-live="polite" className="text-[14px] leading-5 font-medium text-ink">
                        {formatMonthYear(m.year, m.month)}
                      </span>
                      {i === 1 ? (
                        <IconButton icon={ArrowRight01Icon} label="Next month" iconSize={16} disabled={!canNext} onClick={() => setRightMonth(shiftMonth(rightMonth, 1))} />
                      ) : (
                        <span className="size-8" />
                      )}
                    </div>
                    <MonthGrid
                      year={m.year}
                      month={m.month}
                      draft={draft}
                      hovered={hovered}
                      selecting={selecting}
                      focusDay={focusDay}
                      minDay={minDay}
                      asOf={asOf}
                      onHover={setHovered}
                      onPick={pick}
                      onKeyDown={onKeyDown}
                      registerCell={(day, el) => {
                        if (el) cells.current.set(day, el);
                        else cells.current.delete(day);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <Divider />
            <div className="flex items-center justify-between gap-4 py-3 pr-3 pl-4">
              <p className="flex items-center gap-2 font-mono text-[11px] leading-[15px]" aria-live="polite">
                <span className="tnum text-ink">{formatRange(draft.from, summaryTo, true)}</span>
                <span className="tnum text-muted">
                  {dayCount} {dayCount === 1 ? "day" : "days"}
                  {selecting === "end" ? " · pick an end date" : ""}
                </span>
              </p>
              <div className="flex items-center gap-[10px]">
                <Button onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button icon={Tick02Icon} iconClassName="text-lime" className="text-lime" onClick={apply}>
                  Apply
                </Button>
              </div>
            </div>
            <span className="sr-only" aria-live="polite">
              {state.range === "custom" ? "Custom range applied" : ""}
            </span>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
