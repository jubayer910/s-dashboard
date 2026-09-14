"use client";

import { Download04Icon, FlashIcon, Mail01Icon, Pin02Icon, PinOffIcon, UserAdd02Icon, UserGroupIcon, DashboardSpeed01Icon } from "@hugeicons/core-free-icons";
import { Fragment, useEffect, useState } from "react";
import { useShell } from "@/components/shell/shell-provider";
import { Dialog, DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Button, Divider, TierBadge, secondaryButtonClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { formatRange } from "@/lib/dates";
import { formatInt } from "@/lib/format";
import type { LegDetail } from "@/lib/types";
import { LeaderboardRow, PipelineRow } from "./insights-column";
import { Kpi } from "./kpi";
import { useDashboard } from "./dashboard-provider";
import { exportUrl, usePinToggle } from "./team-actions";

function useLegDetail(teamId: number | null, query: string, version: string) {
  const [state, setState] = useState<{ id: number | null; detail: LegDetail | null; error: string | null }>({ id: null, detail: null, error: null });

  useEffect(() => {
    if (!teamId) return;
    const controller = new AbortController();
    const params = new URLSearchParams(query.replace(/^\?/, ""));
    fetch(`/api/legs/${teamId}?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Couldn’t load this team");
        setState({ id: teamId, detail: body as LegDetail, error: null });
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setState({ id: teamId, detail: null, error: error.message });
      });
    return () => controller.abort();
  }, [teamId, query, version]);

  return state.id === teamId ? state : { id: teamId, detail: null, error: null };
}

function Skeleton({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-[4px] bg-white/[0.04]", className)} />;
}

export function TeamDetailDialog() {
  const { data, state, query, teamId, closeTeam } = useDashboard();
  const { openDialog } = useShell();
  const { toggle, pending: pinning } = usePinToggle();
  const [showAll, setShowAll] = useState(false);
  // Refetch when the server data changes (for example after pinning).
  const version = `${data.period.from}:${data.period.to}:${data.team.map((t) => `${t.id}${t.pinned ? "p" : ""}`).join(",")}`;
  const { detail, error } = useLegDetail(teamId, query, version);

  // Keep the last team visible during the exit transition.
  const [shownId, setShownId] = useState(teamId);
  if (teamId !== null && teamId !== shownId) {
    setShownId(teamId);
    setShowAll(false);
  }
  const row = data.team.find((t) => t.id === shownId);
  const name = detail?.name ?? row?.name ?? "Team";
  const tier = detail?.tier ?? row?.tier ?? null;
  const people = detail?.people ?? row?.people;
  const reporting = detail?.reporting ?? row?.reporting;
  const pinned = detail?.pinned ?? row?.pinned ?? false;
  const caption = state.cmp === "year" ? "vs last year" : "vs prior";
  const members = detail ? (showAll ? detail.members : detail.members.slice(0, 3)) : [];

  return (
    <Dialog open={teamId !== null} onOpenChange={(open) => !open && closeTeam()} width={860}>
      <div className="flex items-center justify-between gap-4 py-5 pr-5 pl-6">
        <div className="flex min-w-0 items-start gap-[10px]">
          <div className="flex min-w-0 flex-col gap-1">
            <DialogTitle className="truncate text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">{name}</DialogTitle>
            <DialogDescription className="text-[14px] leading-[18px] text-muted">
              {people !== undefined ? `${people} people · ${reporting} reporting` : "Loading…"}
              {detail ? ` · Leg since ${new Date(detail.since).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}` : ""}
            </DialogDescription>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {tier ? <TierBadge tier={tier} /> : null}
          <DialogClose />
        </div>
      </div>
      <Divider />

      {error ? (
        <p role="alert" className="px-6 py-10 text-center text-[14px] text-negative-soft">
          {error}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="flex h-[110px] min-w-[780px] items-center gap-3 px-6">
              {detail ? (
                <>
                  <Kpi label="MG1" metric={detail.kpis.mg1} format="count" icon={FlashIcon} definition="First meetings booked in the selected range." pct={state.pct} caption={caption} />
                  <Divider orientation="vertical" className="h-[110px] self-auto" />
                  <Kpi label="Share" metric={detail.kpis.share} format="ratio" icon={UserGroupIcon} definition="This leg’s MG1 as a share of every leg in the current scope." pct={state.pct} caption={caption} />
                  <Divider orientation="vertical" className="h-[110px] self-auto" />
                  <Kpi label="Efficiency" metric={detail.kpis.efficiency} format="ratio" icon={DashboardSpeed01Icon} definition="MG1 divided by positive messages." pct={state.pct} caption={caption} />
                  <Divider orientation="vertical" className="h-[110px] self-auto" />
                  <Kpi label="New customers" metric={detail.kpis.newCustomers} format="count" icon={UserAdd02Icon} definition="Customers who completed onboarding in the range." pct={state.pct} caption={caption} />
                </>
              ) : (
                Array.from({ length: 4 }, (_, i) => (
                  <Fragment key={i}>
                    {i > 0 ? <Divider orientation="vertical" className="h-[110px] self-auto" /> : null}
                    <div className="flex h-[88px] flex-1 flex-col gap-3">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="mt-auto h-4 w-20" />
                    </div>
                  </Fragment>
                ))
              )}
            </div>
          </div>
          <Divider />
          <div className="grid md:grid-cols-[1fr_1px_1fr]">
            <section aria-labelledby="detail-pipeline" className="flex flex-col gap-4 px-6 pt-5 pb-6">
              <h3 id="detail-pipeline" className="text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">
                Conversion pipeline
              </h3>
              {detail ? (
                (() => {
                  const stages = [
                    { label: "Positive messages", value: detail.pipeline.positive, color: "#bef264" },
                    { label: "MG1", value: detail.pipeline.mg1, color: "#a3e735" },
                    { label: "Follow up 2+", value: detail.pipeline.followUps, color: "#84cd16" },
                    { label: "New customers", value: detail.pipeline.newCustomers, color: "#65a30d" },
                  ];
                  return stages.map((stage, i) => (
                    <PipelineRow key={stage.label} {...stage} total={detail.pipeline.positive} previous={i > 0 ? stages[i - 1] : undefined} />
                  ));
                })()
              ) : (
                Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[26px] w-full" />)
              )}
              {detail ? (
                <p className="font-mono text-[11px] leading-[15px] text-muted">{formatRange(detail.period.from, detail.period.to, true)}</p>
              ) : null}
            </section>
            <div className="divider-v hidden md:block" />
            <section aria-labelledby="detail-members" className="flex flex-col gap-3 px-6 pt-5 pb-6">
              <div className="flex items-center justify-between">
                <h3 id="detail-members" className="text-[18px] leading-[1.1] font-medium tracking-[-0.36px] text-ink">
                  Top members
                </h3>
                {detail && detail.members.length > 3 ? (
                  <button type="button" onClick={() => setShowAll((v) => !v)} className="rounded-[4px] text-[12px] leading-4 text-lime outline-none hover:underline">
                    {showAll ? "Show top 3" : `View all ${detail.members.length}`}
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-[6px]">
                <Divider />
                {detail
                  ? members.map((member, i) => (
                      <Fragment key={member.id}>
                        <LeaderboardRow row={{ id: member.id, name: member.name, mg1: member.mg1, rank: i + 1, pinned: false }} subtitle={member.role} />
                        <Divider />
                      </Fragment>
                    ))
                  : Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
              </div>
              {detail && detail.members.length === 0 ? <p className="text-[14px] text-muted">No member data yet.</p> : null}
            </section>
          </div>
        </>
      )}

      <Divider />
      <div className="flex flex-wrap items-center justify-between gap-3 py-[14px] pr-5 pl-6">
        {shownId ? (
          <a href={exportUrl(shownId, query)} download className={cn(secondaryButtonClass, "pl-[8px]")}>
            <Icon icon={Download04Icon} size={16} />
            Export CSV
          </a>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-[10px]">
          <Button
            icon={Mail01Icon}
            onClick={() => {
              if (!shownId) return;
              closeTeam();
              openDialog({ kind: "message", legId: shownId, legName: name });
            }}
          >
            Message leaders
          </Button>
          <Button
            icon={pinned ? PinOffIcon : Pin02Icon}
            iconClassName="text-lime"
            className="text-lime"
            disabled={pinning || !shownId}
            onClick={() => shownId && toggle({ id: shownId, name, pinned })}
          >
            {pinned ? "Unpin from leaderboard" : "Pin to leaderboard"}
          </Button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {detail ? `Loaded ${formatInt(detail.kpis.mg1.value)} MG1 for ${detail.name}` : ""}
      </span>
    </Dialog>
  );
}
