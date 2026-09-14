import { sql, type SQL } from "drizzle-orm";
import { query } from "./db";
import {
  CHART_DAYS,
  type DashboardState,
  type ResolvedPeriod,
  type TabKey,
  rangeLabel,
  resolveCompare,
  resolveRange,
} from "./dashboard-state";
import { addDays } from "./dates";
import { ratio } from "./format";
import type {
  ChartPoint,
  DashboardData,
  LeaderRow,
  LegDetail,
  NotificationData,
  PipelineData,
  SourcesData,
  TeamRow,
  Tier,
  Workspace,
} from "./types";

const NEVER = "1900-01-01";

function scopeFilter(tab: TabKey): SQL {
  if (tab === "me") return sql`l.scope = 'mine'`;
  if (tab === "team") return sql`l.scope in ('mine', 'peer')`;
  return sql`l.scope = 'upper'`;
}

interface Totals extends PipelineData, SourcesData {
  reporters: number;
  peopleDays: number;
}

const EMPTY_TOTALS: Totals = {
  positive: 0,
  mg1: 0,
  followUps: 0,
  newCustomers: 0,
  walkIns: 0,
  referrals: 0,
  campaigns: 0,
  other: 0,
  reporters: 0,
  peopleDays: 0,
};

async function totals(where: SQL, period: ResolvedPeriod | null): Promise<Totals> {
  if (!period) return EMPTY_TOTALS;
  const [row] = await query<Totals>(sql`
    select
      coalesce(sum(d.positive_messages), 0)::int as positive,
      coalesce(sum(d.mg1), 0)::int as mg1,
      coalesce(sum(d.follow_ups), 0)::int as "followUps",
      coalesce(sum(d.new_customers), 0)::int as "newCustomers",
      coalesce(sum(d.walk_ins), 0)::int as "walkIns",
      coalesce(sum(d.referrals), 0)::int as referrals,
      coalesce(sum(d.campaigns), 0)::int as campaigns,
      coalesce(sum(d.other), 0)::int as other,
      coalesce(sum(d.reporters), 0)::int as reporters,
      coalesce(sum(l.people), 0)::int as "peopleDays"
    from daily_metrics d
    join legs l on l.id = d.leg_id
    where ${where} and d.day between ${period.from} and ${period.to}
  `);
  return row ?? EMPTY_TOTALS;
}

export async function getWorkspaces() {
  return query<Workspace>(sql`
    select id, name, role, initials, goal_per_person as "goalPerPerson"
    from workspaces order by sort_order
  `);
}

export async function getBounds() {
  const [row] = await query<{ asOf: string | null; minDay: string | null }>(sql`
    select max(day)::text as "asOf", min(day)::text as "minDay" from daily_metrics
  `);
  if (!row?.asOf || !row.minDay) throw new Error("The database has no metrics yet. Run npm run db:seed.");
  return { asOf: row.asOf, minDay: row.minDay };
}

function toIsoString(value: unknown) {
  return value == null ? null : new Date(value as string).toISOString();
}

export async function getDashboardData(state: DashboardState): Promise<DashboardData> {
  const [workspaces, bounds] = await Promise.all([getWorkspaces(), getBounds()]);
  const workspace = workspaces.find((w) => w.id === state.ws) ?? workspaces[0];
  const { asOf, minDay } = bounds;
  const period = resolveRange(state, asOf, minDay);
  const compare = resolveCompare(period, state.cmp, minDay);

  const where = sql`l.workspace_id = ${workspace.id} and ${scopeFilter(state.tab)}`;
  const weeksTotal = Math.max(1, Math.floor(period.days / 7));
  const lookback = Math.max(182, weeksTotal * 7);
  const chartDays = CHART_DAYS[state.chart];
  const chartFrom = addDays(period.to, -(chartDays - 1) - 27);
  const cmpFrom = compare?.from ?? NEVER;
  const cmpTo = compare?.to ?? NEVER;
  const joinFrom = compare && compare.from < period.from ? compare.from : period.from;

  const [current, previous, subs, legRows, weekly, daily, notificationRows, members] = await Promise.all([
    totals(where, period),
    totals(where, compare),
    query<{ current: number; previous: number }>(sql`
      select
        coalesce(sum(d.active_subs) filter (where d.day = ${period.to}), 0)::int as current,
        coalesce(sum(d.active_subs) filter (where d.day = ${cmpTo}), 0)::int as previous
      from daily_metrics d join legs l on l.id = d.leg_id
      where ${where} and d.day in (${period.to}, ${cmpTo})
    `),
    query<{
      id: number;
      name: string;
      tier: Tier | null;
      people: number;
      reporting: number;
      pinned: boolean;
      mg1: number;
      positive: number;
      prevMg1: number;
    }>(sql`
      select l.id, l.name, l.tier, l.people, l.reporting, l.pinned,
        coalesce(sum(d.mg1) filter (where d.day >= ${period.from}), 0)::int as mg1,
        coalesce(sum(d.positive_messages) filter (where d.day >= ${period.from}), 0)::int as positive,
        coalesce(sum(d.mg1) filter (where d.day between ${cmpFrom} and ${cmpTo}), 0)::int as "prevMg1"
      from legs l
      left join daily_metrics d on d.leg_id = l.id and d.day between ${joinFrom} and ${period.to}
      where ${where}
      group by l.id
      order by l.id
    `),
    query<{ legId: number; week: number; mg1: number }>(sql`
      select d.leg_id as "legId", ((${period.to}::date - d.day) / 7)::int as week, sum(d.mg1)::int as mg1
      from daily_metrics d join legs l on l.id = d.leg_id
      where ${where} and d.day > (${period.to}::date - ${lookback}::int) and d.day <= ${period.to}::date
      group by 1, 2
    `),
    query<{ day: string; newCustomers: number; mg1: number; positive: number }>(sql`
      select d.day::text as day, sum(d.new_customers)::int as "newCustomers", sum(d.mg1)::int as mg1, sum(d.positive_messages)::int as positive
      from daily_metrics d join legs l on l.id = d.leg_id
      where ${where} and d.day between ${chartFrom} and ${period.to}
      group by d.day order by d.day
    `),
    query<NotificationData>(sql`
      select id, kind, title, highlight, source, leg_id as "legId", created_at as "createdAt", read_at as "readAt"
      from notifications where workspace_id = ${workspace.id}
      order by created_at desc limit 30
    `),
    query<{ people: number }>(sql`
      select coalesce(sum(people), 0)::int as people from legs where workspace_id = ${workspace.id} and scope = 'mine'
    `),
  ]);

  // Chart (daily): efficiency that day, MG1 over the last 7 days, new customers over the last 28 days.
  const chart: ChartPoint[] = [];
  for (let i = 0; i < daily.length; i++) {
    const point = daily[i];
    if (point.day < addDays(period.to, -(chartDays - 1))) continue;
    let mg1Week = 0;
    let customersMonth = 0;
    for (let j = Math.max(0, i - 6); j <= i; j++) mg1Week += daily[j].mg1;
    for (let j = Math.max(0, i - 27); j <= i; j++) customersMonth += daily[j].newCustomers;
    chart.push({ day: point.day, customers: customersMonth, mg1: mg1Week, efficiency: ratio(point.mg1, point.positive) });
  }

  // Team table
  const weeklyByLeg = new Map<number, number[]>();
  for (const w of weekly) {
    const list = weeklyByLeg.get(w.legId) ?? [];
    list[w.week] = w.mg1;
    weeklyByLeg.set(w.legId, list);
  }
  const totalMg1 = legRows.reduce((sum, r) => sum + r.mg1, 0);
  const team: TeamRow[] = legRows.map((r) => {
    const weeks = weeklyByLeg.get(r.id) ?? [];
    const goal = workspace.goalPerPerson * r.people;
    let weeksHit = 0;
    for (let w = 0; w < weeksTotal; w++) if ((weeks[w] ?? 0) >= goal) weeksHit++;
    return {
      id: r.id,
      name: r.name,
      tier: r.tier,
      people: r.people,
      reporting: r.reporting,
      pinned: r.pinned,
      mg1: r.mg1,
      positive: r.positive,
      share: ratio(r.mg1, totalMg1),
      efficiency: ratio(r.mg1, r.positive),
      momentum: compare && r.prevMg1 > 0 ? (r.mg1 - r.prevMg1) / r.prevMg1 : null,
      weeksHit,
      weeksTotal,
      spark: Array.from({ length: 26 }, (_, i) => weeks[25 - i] ?? 0),
    };
  });

  const direction = state.dir === "asc" ? 1 : -1;
  const sortValue = (row: TeamRow) => {
    switch (state.sort) {
      case "name":
        return row.name;
      case "share":
        return row.share;
      case "eff":
        return row.efficiency;
      case "moment":
        return row.momentum ?? -Infinity;
      case "weeks":
        return ratio(row.weeksHit, row.weeksTotal);
      default:
        return row.mg1;
    }
  };
  team.sort((a, b) => {
    const av = sortValue(a);
    const bv = sortValue(b);
    const result = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return result * direction || a.name.localeCompare(b.name);
  });

  // Leaderboard: top 4 by MG1, plus pinned legs outside the top 4.
  const ranked = [...team].sort((a, b) => b.mg1 - a.mg1 || a.name.localeCompare(b.name));
  const leaderboard: LeaderRow[] = ranked
    .map((r, i) => ({ id: r.id, name: r.name, mg1: r.mg1, rank: i + 1, pinned: r.pinned }))
    .filter((r) => r.rank <= 4 || r.pinned);

  const prev = compare ? previous : null;
  return {
    state,
    workspace,
    workspaces,
    asOf,
    minDay,
    period,
    compare,
    rangeLabel: rangeLabel(state, period),
    kpis: {
      activeSubs: { value: subs[0]?.current ?? 0, previous: compare ? subs[0]?.previous ?? 0 : null },
      newCustomers: { value: current.newCustomers, previous: prev?.newCustomers ?? null },
      mg1: { value: current.mg1, previous: prev?.mg1 ?? null },
      efficiency: { value: ratio(current.mg1, current.positive), previous: prev ? ratio(prev.mg1, prev.positive) : null },
      positive: { value: current.positive, previous: prev?.positive ?? null },
      reportingRate: {
        value: ratio(current.reporters, current.peopleDays),
        previous: prev ? ratio(prev.reporters, prev.peopleDays) : null,
      },
    },
    pipeline: { positive: current.positive, mg1: current.mg1, followUps: current.followUps, newCustomers: current.newCustomers },
    sources: { walkIns: current.walkIns, referrals: current.referrals, campaigns: current.campaigns, other: current.other },
    chart,
    team,
    leaderboard,
    notifications: notificationRows.map((n) => ({
      ...n,
      createdAt: toIsoString(n.createdAt) ?? new Date().toISOString(),
      readAt: toIsoString(n.readAt),
    })),
    memberCount: members[0]?.people ?? 0,
  };
}

export async function getShellData(ws: string | null) {
  const workspaces = await getWorkspaces();
  const workspace = workspaces.find((w) => w.id === ws) ?? workspaces[0];
  const [notificationRows, members] = await Promise.all([
    query<NotificationData>(sql`
      select id, kind, title, highlight, source, leg_id as "legId", created_at as "createdAt", read_at as "readAt"
      from notifications where workspace_id = ${workspace.id}
      order by created_at desc limit 30
    `),
    query<{ people: number }>(sql`
      select coalesce(sum(people), 0)::int as people from legs where workspace_id = ${workspace.id} and scope = 'mine'
    `),
  ]);
  return {
    workspace,
    workspaces,
    notifications: notificationRows.map((n) => ({
      ...n,
      createdAt: toIsoString(n.createdAt) ?? new Date().toISOString(),
      readAt: toIsoString(n.readAt),
    })),
    memberCount: members[0]?.people ?? 0,
  };
}

export async function getLegDetail(legId: number, state: DashboardState): Promise<LegDetail | null> {
  const [legs, bounds] = await Promise.all([
    query<{
      id: number;
      workspaceId: string;
      name: string;
      tier: Tier | null;
      people: number;
      reporting: number;
      since: string;
      pinned: boolean;
    }>(sql`
      select id, workspace_id as "workspaceId", name, tier, people, reporting, since::text as since, pinned
      from legs where id = ${legId}
    `),
    getBounds(),
  ]);
  const leg = legs[0];
  if (!leg) return null;
  const period = resolveRange(state, bounds.asOf, bounds.minDay);
  const compare = resolveCompare(period, state.cmp, bounds.minDay);
  const legWhere = sql`l.id = ${legId}`;
  const scopeWhere = sql`l.workspace_id = ${leg.workspaceId} and ${scopeFilter(state.tab)}`;

  const [current, previous, scopeCurrent, scopePrevious, members] = await Promise.all([
    totals(legWhere, period),
    totals(legWhere, compare),
    totals(scopeWhere, period),
    totals(scopeWhere, compare),
    query<{ id: number; name: string; role: string; share: number }>(sql`
      select id, name, role, share from members where leg_id = ${legId} order by share desc, id
    `),
  ]);

  return {
    id: leg.id,
    name: leg.name,
    tier: leg.tier,
    people: leg.people,
    reporting: leg.reporting,
    since: leg.since,
    pinned: leg.pinned,
    period,
    compare,
    kpis: {
      mg1: { value: current.mg1, previous: compare ? previous.mg1 : null },
      share: {
        value: ratio(current.mg1, scopeCurrent.mg1),
        previous: compare ? ratio(previous.mg1, scopePrevious.mg1) : null,
      },
      efficiency: {
        value: ratio(current.mg1, current.positive),
        previous: compare ? ratio(previous.mg1, previous.positive) : null,
      },
      newCustomers: { value: current.newCustomers, previous: compare ? previous.newCustomers : null },
    },
    pipeline: { positive: current.positive, mg1: current.mg1, followUps: current.followUps, newCustomers: current.newCustomers },
    members: members.map((m) => ({ id: m.id, name: m.name, role: m.role, mg1: Math.round(m.share * current.mg1) })),
  };
}

export async function getLegDailyRows(legId: number, period: ResolvedPeriod) {
  return query<Record<string, string | number>>(sql`
    select d.day::text as day, l.name as leg, d.positive_messages, d.mg1, d.follow_ups, d.new_customers,
      d.active_subs, d.reporters, d.walk_ins, d.referrals, d.campaigns, d.other
    from daily_metrics d join legs l on l.id = d.leg_id
    where l.id = ${legId} and d.day between ${period.from} and ${period.to}
    order by d.day
  `);
}
