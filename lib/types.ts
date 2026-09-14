import type { DashboardState, ResolvedPeriod } from "./dashboard-state";

export type Tier = "EMERALD" | "EAGLE" | "PLATINUM";

export interface Workspace {
  id: string;
  name: string;
  role: string;
  initials: string;
  goalPerPerson: number;
}

export interface MetricPair {
  value: number;
  previous: number | null;
}

export interface KpiData {
  activeSubs: MetricPair;
  newCustomers: MetricPair;
  mg1: MetricPair;
  efficiency: MetricPair;
  positive: MetricPair;
  reportingRate: MetricPair;
}

export interface PipelineData {
  positive: number;
  mg1: number;
  followUps: number;
  newCustomers: number;
}

export interface SourcesData {
  walkIns: number;
  referrals: number;
  campaigns: number;
  other: number;
}

export interface ChartPoint {
  day: string;
  customers: number;
  mg1: number;
  efficiency: number;
}

export interface TeamRow {
  id: number;
  name: string;
  tier: Tier | null;
  people: number;
  reporting: number;
  pinned: boolean;
  mg1: number;
  positive: number;
  share: number;
  efficiency: number;
  momentum: number | null;
  weeksHit: number;
  weeksTotal: number;
  spark: number[];
}

export interface LeaderRow {
  id: number;
  name: string;
  mg1: number;
  rank: number;
  pinned: boolean;
}

export type NotificationKind = "tier" | "report" | "alert" | "mention";

export interface NotificationData {
  id: number;
  kind: NotificationKind;
  title: string;
  highlight: string | null;
  source: string;
  legId: number | null;
  createdAt: string;
  readAt: string | null;
}

export interface DashboardData {
  state: DashboardState;
  workspace: Workspace;
  workspaces: Workspace[];
  asOf: string;
  minDay: string;
  period: ResolvedPeriod;
  compare: ResolvedPeriod | null;
  rangeLabel: string;
  kpis: KpiData;
  pipeline: PipelineData;
  sources: SourcesData;
  chart: ChartPoint[];
  team: TeamRow[];
  leaderboard: LeaderRow[];
  notifications: NotificationData[];
  memberCount: number;
}

export interface ShellData {
  workspace: Workspace;
  workspaces: Workspace[];
  notifications: NotificationData[];
  memberCount: number;
}

export interface MemberData {
  id: number;
  name: string;
  role: string;
  mg1: number;
}

export interface LegDetail {
  id: number;
  name: string;
  tier: Tier | null;
  people: number;
  reporting: number;
  since: string;
  pinned: boolean;
  period: ResolvedPeriod;
  compare: ResolvedPeriod | null;
  kpis: {
    mg1: MetricPair;
    share: MetricPair;
    efficiency: MetricPair;
    newCustomers: MetricPair;
  };
  pipeline: PipelineData;
  members: MemberData[];
}
