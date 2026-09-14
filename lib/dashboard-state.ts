import { addDays, addYears, diffDays, formatRange, isIsoDay, maxIso, minIso, startOfQuarter, startOfYear } from "./dates";

export const RANGE_KEYS = ["7d", "4w", "8w", "12w", "qtd", "ytd", "custom"] as const;
export const COMPARE_KEYS = ["prior", "year", "none"] as const;
export const TAB_KEYS = ["me", "team", "upper"] as const;
export const CHART_KEYS = ["4w", "8w", "12w"] as const;
export const SORT_KEYS = ["name", "mg1", "share", "eff", "moment", "weeks"] as const;

export type RangeKey = (typeof RANGE_KEYS)[number];
export type CompareKey = (typeof COMPARE_KEYS)[number];
export type TabKey = (typeof TAB_KEYS)[number];
export type ChartKey = (typeof CHART_KEYS)[number];
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export interface DashboardState {
  ws: string | null;
  range: RangeKey;
  from: string | null;
  to: string | null;
  cmp: CompareKey;
  pct: boolean;
  tab: TabKey;
  chart: ChartKey;
  sort: SortKey;
  dir: SortDir;
}

export const DEFAULT_STATE: DashboardState = {
  ws: null,
  range: "4w",
  from: null,
  to: null,
  cmp: "prior",
  pct: true,
  tab: "me",
  chart: "8w",
  sort: "mg1",
  dir: "desc",
};

export const RANGE_LABELS: Record<Exclude<RangeKey, "custom">, string> = {
  "7d": "Last 7 days",
  "4w": "Last 4 weeks",
  "8w": "Last 8 weeks",
  "12w": "Last 12 weeks",
  qtd: "Quarter to date",
  ytd: "Year to date",
};

export const COMPARE_LABELS: Record<CompareKey, string> = {
  prior: "Previous period",
  year: "Same period last year",
  none: "No comparison",
};

export const TAB_LABELS: Record<TabKey, string> = {
  me: "My performance",
  team: "My team",
  upper: "Upper leaders",
};

export const CHART_DAYS: Record<ChartKey, number> = { "4w": 28, "8w": 56, "12w": 84 };

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

type SearchInput = URLSearchParams | Record<string, string | string[] | undefined>;

function read(input: SearchInput, key: string) {
  if (input instanceof URLSearchParams) return input.get(key) ?? undefined;
  const value = input[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseState(input: SearchInput): DashboardState {
  const from = read(input, "from");
  const to = read(input, "to");
  const range = pick(read(input, "range"), RANGE_KEYS, DEFAULT_STATE.range);
  const validCustom = range === "custom" && isIsoDay(from) && isIsoDay(to);
  return {
    ws: read(input, "ws") ?? null,
    range: range === "custom" && !validCustom ? DEFAULT_STATE.range : range,
    from: validCustom ? minIso(from, to) : null,
    to: validCustom ? maxIso(from, to) : null,
    cmp: pick(read(input, "cmp"), COMPARE_KEYS, DEFAULT_STATE.cmp),
    pct: read(input, "pct") !== "0",
    tab: pick(read(input, "tab"), TAB_KEYS, DEFAULT_STATE.tab),
    chart: pick(read(input, "chart"), CHART_KEYS, DEFAULT_STATE.chart),
    sort: pick(read(input, "sort"), SORT_KEYS, DEFAULT_STATE.sort),
    dir: read(input, "dir") === "asc" ? "asc" : "desc",
  };
}

/** Serialises state to a query string, omitting defaults to keep URLs short. */
export function toQuery(state: DashboardState) {
  const params = new URLSearchParams();
  if (state.ws) params.set("ws", state.ws);
  if (state.range !== DEFAULT_STATE.range) params.set("range", state.range);
  if (state.range === "custom" && state.from && state.to) {
    params.set("from", state.from);
    params.set("to", state.to);
  }
  if (state.cmp !== DEFAULT_STATE.cmp) params.set("cmp", state.cmp);
  if (!state.pct) params.set("pct", "0");
  if (state.tab !== DEFAULT_STATE.tab) params.set("tab", state.tab);
  if (state.chart !== DEFAULT_STATE.chart) params.set("chart", state.chart);
  if (state.sort !== DEFAULT_STATE.sort) params.set("sort", state.sort);
  if (state.dir !== DEFAULT_STATE.dir) params.set("dir", state.dir);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export interface ResolvedPeriod {
  from: string;
  to: string;
  days: number;
}

export function resolvePresetRange(key: Exclude<RangeKey, "custom">, asOf: string): ResolvedPeriod {
  const lengths = { "7d": 7, "4w": 28, "8w": 56, "12w": 84 } as const;
  const from =
    key === "qtd" ? startOfQuarter(asOf) : key === "ytd" ? startOfYear(asOf) : addDays(asOf, -(lengths[key] - 1));
  return { from, to: asOf, days: diffDays(from, asOf) + 1 };
}

export function resolveRange(state: DashboardState, asOf: string, minDay: string): ResolvedPeriod {
  if (state.range === "custom" && state.from && state.to) {
    const to = minIso(maxIso(state.to, minDay), asOf);
    const from = minIso(maxIso(state.from, minDay), to);
    return { from, to, days: diffDays(from, to) + 1 };
  }
  const preset = resolvePresetRange(state.range === "custom" ? "4w" : state.range, asOf);
  const from = maxIso(preset.from, minDay);
  return { from, to: preset.to, days: diffDays(from, preset.to) + 1 };
}

export function resolveCompare(period: ResolvedPeriod, cmp: CompareKey, minDay: string): ResolvedPeriod | null {
  if (cmp === "none") return null;
  const candidate =
    cmp === "prior"
      ? { from: addDays(period.from, -period.days), to: addDays(period.from, -1) }
      : { from: addYears(period.from, -1), to: addYears(period.to, -1) };
  if (candidate.to < minDay) return null;
  const from = maxIso(candidate.from, minDay);
  return { from, to: candidate.to, days: diffDays(from, candidate.to) + 1 };
}

export function rangeLabel(state: DashboardState, period: ResolvedPeriod) {
  if (state.range === "custom") return formatRange(period.from, period.to);
  return RANGE_LABELS[state.range];
}
