"use client";

import { Calendar01Icon, Calendar03Icon, GitCompareIcon } from "@hugeicons/core-free-icons";
import { useRef, useState } from "react";
import { Menu, MenuCheckboxItem, MenuGroup, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator } from "@/components/ui/menu";
import { ButtonContent, IconButton, TitleBlock, secondaryButtonClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  COMPARE_LABELS,
  type CompareKey,
  RANGE_LABELS,
  type RangeKey,
  resolveCompare,
  resolvePresetRange,
} from "@/lib/dashboard-state";
import { formatRange } from "@/lib/dates";
import { useDashboard } from "./dashboard-provider";
import { DateRangePicker } from "./date-range-picker";

const COMPARE_TRIGGER: Record<CompareKey, string> = {
  prior: "Compare to prior",
  year: "Compare to last year",
  none: "No comparison",
};

/* Shorter trigger labels for phones, where the three controls share one row */
const COMPARE_TRIGGER_SHORT: Record<CompareKey, string> = {
  prior: "vs prior",
  year: "vs last year",
  none: "No compare",
};

export function PageHeader() {
  const { data, state, update } = useDashboard();
  const dateTriggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLButtonElement>(null);
  const [picker, setPicker] = useState<{ open: boolean; source: "menu" | "calendar" }>({ open: false, source: "calendar" });
  const anchorRef = picker.source === "menu" ? dateTriggerRef : calendarRef;

  const label = state.range === "custom" && state.from && state.to ? formatRange(state.from, state.to) : RANGE_LABELS[state.range as Exclude<RangeKey, "custom">];
  const comparePreview = (key: CompareKey) => {
    const period = resolveCompare(data.period, key, data.minDay);
    return period ? formatRange(period.from, period.to, key === "year") : undefined;
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-3 py-3">
      <TitleBlock as="h1" title="Performance overview" subtitle="Personal, team and leadership metrics" />
      <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-[10px] sm:flex sm:w-auto sm:flex-wrap">
        <Menu
          triggerRef={dateTriggerRef}
          triggerClassName={cn(secondaryButtonClass, "min-w-0 pl-[8px]")}
          trigger={
            <ButtonContent icon={Calendar01Icon} chevron>
              {label}
            </ButtonContent>
          }
          width={272}
        >
          <MenuGroup label="Presets">
            <MenuRadioGroup value={state.range} onValueChange={(value) => update({ range: value as RangeKey, from: null, to: null })}>
              {(Object.keys(RANGE_LABELS) as Exclude<RangeKey, "custom">[]).map((key) => {
                const r = resolvePresetRange(key, data.asOf);
                return <MenuRadioItem key={key} value={key} label={RANGE_LABELS[key]} meta={formatRange(r.from, r.to)} />;
              })}
            </MenuRadioGroup>
          </MenuGroup>
          <MenuSeparator />
          <MenuItem
            icon={Calendar01Icon}
            label="Custom range…"
            meta={state.range === "custom" ? label : undefined}
            onClick={() => setPicker({ open: true, source: "menu" })}
          />
        </Menu>

        <Menu
          align="end"
          triggerClassName={cn(secondaryButtonClass, "min-w-0 pl-[8px]")}
          trigger={
            <ButtonContent icon={GitCompareIcon} chevron>
              <span className="sm:hidden">{COMPARE_TRIGGER_SHORT[state.cmp]}</span>
              <span className="hidden sm:inline">{COMPARE_TRIGGER[state.cmp]}</span>
            </ButtonContent>
          }
          width={340}
        >
          <MenuGroup label="Compare against">
            <MenuRadioGroup value={state.cmp} onValueChange={(value) => update({ cmp: value as CompareKey })}>
              <MenuRadioItem value="prior" label={COMPARE_LABELS.prior} meta={comparePreview("prior")} />
              <MenuRadioItem value="year" label={COMPARE_LABELS.year} meta={comparePreview("year") ?? "No data"} />
              <MenuRadioItem value="none" label={COMPARE_LABELS.none} />
            </MenuRadioGroup>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup label="Display">
            <MenuCheckboxItem checked={state.pct} onCheckedChange={(checked) => update({ pct: checked })} label="Show change as %" />
          </MenuGroup>
        </Menu>

        <IconButton
          ref={calendarRef}
          icon={Calendar03Icon}
          label="Pick a custom date range"
          data-popup-open={picker.open && picker.source === "calendar" ? "" : undefined}
          aria-expanded={picker.open && picker.source === "calendar"}
          onClick={() => setPicker((p) => ({ open: !(p.open && p.source === "calendar"), source: "calendar" }))}
        />
        <DateRangePicker
          open={picker.open}
          onOpenChange={(open) => setPicker((p) => ({ ...p, open }))}
          anchor={anchorRef}
          finalFocus={anchorRef}
        />
      </div>
    </header>
  );
}
