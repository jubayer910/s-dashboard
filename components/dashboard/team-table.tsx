"use client";

import { ArrowDown01Icon, ArrowUp01Icon, InformationCircleIcon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import type { KeyboardEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { ContextMenu, Menu } from "@/components/ui/menu";
import { TierBadge, iconButtonClass } from "@/components/ui/primitives";
import { DefinitionTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { DEFAULT_STATE, type SortKey, TAB_LABELS } from "@/lib/dashboard-state";
import { MINUS, formatInt, formatPercent, ratio } from "@/lib/format";
import type { TeamRow } from "@/lib/types";
import { useDashboard } from "./dashboard-provider";
import { TeamActionItems } from "./team-actions";

const GRID = "grid grid-cols-[minmax(250px,1fr)_76px_68px_84px_84px_72px_96px]";

const COLUMNS: { key: SortKey; label: string; definition?: string; align: "left" | "right" }[] = [
  { key: "name", label: "Leg", align: "left" },
  { key: "mg1", label: "MG1", align: "right", definition: "First meetings booked in the selected range." },
  { key: "share", label: "Share", align: "right", definition: "This leg’s MG1 as a share of every leg in the table." },
  { key: "eff", label: "EFF", align: "right", definition: "MG1 divided by positive messages in the selected range." },
  { key: "moment", label: "Moment", align: "right", definition: "Change in MG1 against the comparison period." },
  { key: "weeks", label: "Weeks", align: "right", definition: "Weeks in the range where MG1 met the goal (goal per person × people)." },
];

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const points = values.map((v, i) => `${((i / (values.length - 1)) * 70).toFixed(1)},${(22 - ((v - min) / span) * 20).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 70 24" width={70} height={24} aria-hidden>
      <polyline points={points} fill="none" stroke="#7b5bff" strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function SortHeader({ column }: { column: (typeof COLUMNS)[number] }) {
  const { state, update } = useDashboard();
  const sorted = state.sort === column.key;
  const next = () => {
    if (!sorted) update({ sort: column.key, dir: column.key === "name" ? "asc" : "desc" });
    else if (state.dir === (column.key === "name" ? "asc" : "desc")) update({ dir: state.dir === "asc" ? "desc" : "asc" });
    else update({ sort: DEFAULT_STATE.sort, dir: DEFAULT_STATE.dir });
  };
  return (
    <div
      role="columnheader"
      aria-sort={sorted ? (state.dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn("flex h-9 items-center gap-[2px] border-b border-row-line", column.align === "right" ? "justify-end" : "px-3")}
    >
      <button
        type="button"
        onClick={next}
        className={cn(
          "flex items-center gap-[2px] rounded-[4px] text-[14px] leading-5 outline-none transition-colors duration-150 ease-out hover:text-label",
          sorted ? "text-label" : "text-th",
        )}
      >
        {column.label}
        {sorted ? <Icon icon={state.dir === "asc" ? ArrowUp01Icon : ArrowDown01Icon} size={12} /> : null}
      </button>
      {column.definition ? (
        <DefinitionTooltip title={column.label} body={column.definition}>
          <button type="button" aria-label={`About ${column.label}`} className="-m-[7px] grid size-6 place-items-center rounded-full text-th outline-none hover:text-label focus-visible:text-label">
            <Icon icon={InformationCircleIcon} size={10} />
          </button>
        </DefinitionTooltip>
      ) : null}
    </div>
  );
}

function Row({ row, hasCompare }: { row: TeamRow; hasCompare: boolean }) {
  const { openTeam } = useDashboard();
  const weeksRatio = ratio(row.weeksHit, row.weeksTotal);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTeam(row.id);
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const sibling = event.key === "ArrowDown" ? event.currentTarget.parentElement?.nextElementSibling : event.currentTarget.parentElement?.previousElementSibling;
      (sibling?.querySelector('[role="row"]') as HTMLElement | null)?.focus();
    }
  };

  return (
    <ContextMenu content={<TeamActionItems leg={row} />} className="block">
      <div
        role="row"
        tabIndex={0}
        aria-label={`${row.name}, MG1 ${formatInt(row.mg1)}`}
        onClick={() => openTeam(row.id)}
        onKeyDown={onKeyDown}
        className={cn(
          GRID,
          "group h-16 cursor-pointer items-center border-b border-row-line bg-page outline-none",
          "transition-[background-color] duration-100 ease-out hover:bg-raised hover:duration-0 focus-visible:bg-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand has-[[data-popup-open]]:bg-raised",
        )}
      >
        <div role="cell" className="flex min-w-0 items-center gap-3 py-3 pr-4 pl-3">
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate text-[14px] leading-5 font-medium tracking-[-0.084px] text-ink">{row.name}</span>
              {row.tier ? <TierBadge tier={row.tier} /> : null}
            </div>
            <div className="flex items-center gap-[6px] text-[12px] leading-4 text-muted-2">
              <span>{row.people} people</span>
              {row.reporting ? (
                <>
                  <span aria-hidden className="size-[3px] rounded-full bg-[#6b6b6b]" />
                  <span>{row.reporting} reporting</span>
                </>
              ) : null}
            </div>
          </div>
          <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
            <Menu
              align="end"
              width={232}
              triggerLabel={`Actions for ${row.name}`}
              triggerClassName={cn(
                iconButtonClass,
                "opacity-0 transition-opacity duration-100 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100",
              )}
              trigger={<Icon icon={MoreHorizontalIcon} size={16} />}
            >
              <TeamActionItems leg={row} />
            </Menu>
          </div>
        </div>
        <div role="cell" className="tnum text-right text-[14px] font-medium text-ink">{formatInt(row.mg1)}</div>
        <div role="cell" className="tnum text-right text-[14px] text-muted-2">{formatPercent(row.share, 0)}</div>
        <div role="cell" className="tnum text-right text-[14px] font-medium text-ink">{formatPercent(row.efficiency)}</div>
        <div
          role="cell"
          className={cn(
            "tnum text-right text-[14px] font-medium",
            row.momentum === null ? "text-muted" : row.momentum >= 0 ? "text-[#5bc98b]" : "text-negative-soft",
          )}
        >
          {row.momentum === null ? (hasCompare ? "New" : "—") : `${row.momentum >= 0 ? "+" : MINUS}${Math.abs(Math.round(row.momentum * 100))}%`}
        </div>
        <div
          role="cell"
          title={`${row.weeksHit} of ${row.weeksTotal} weeks met the goal`}
          className={cn("tnum text-right text-[14px] font-medium", weeksRatio < 0.6 ? "text-negative-soft" : "text-kpi")}
        >
          {formatPercent(weeksRatio, 0)}
        </div>
        <div role="cell" className="flex justify-end pr-4">
          <Sparkline values={row.spark} />
        </div>
      </div>
    </ContextMenu>
  );
}

export function TeamTable() {
  const { data, state, pending } = useDashboard();
  const title = state.tab === "upper" ? "Upper leaders" : state.tab === "team" ? "My team" : "Team performance";
  return (
    <section aria-labelledby="team-title" className="flex flex-col">
      <div className="flex items-end justify-between gap-4 px-3 pt-5 pb-5">
        <div className="flex flex-col gap-1">
          <h2 id="team-title" className="text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">
            {title}
          </h2>
          <p className="text-[14px] leading-[18px] text-muted">
            {data.team.length} legs · {TAB_LABELS[state.tab]} · click a row for details
          </p>
        </div>
      </div>
      <div className="divider-h w-full" />
      <div data-pending={pending} className="data-region overflow-x-auto">
        <div role="table" aria-labelledby="team-title" className="min-w-[730px]">
          <div role="rowgroup">
            <div role="row" className={GRID}>
              {COLUMNS.map((column) => (
                <SortHeader key={column.key} column={column} />
              ))}
              <div role="columnheader" className="flex h-9 items-center justify-end border-b border-row-line pr-4 text-[14px] text-th">
                26 Weeks
              </div>
            </div>
          </div>
          <div role="rowgroup">
            {data.team.length === 0 ? (
              <p className="px-3 py-10 text-center text-[14px] text-muted">No legs in this scope.</p>
            ) : (
              data.team.map((row) => <Row key={row.id} row={row} hasCompare={data.compare !== null} />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
