/** Date helpers on ISO calendar days (YYYY-MM-DD), always computed in UTC. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function toDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export function addYears(iso: string, years: number) {
  const d = toDate(iso);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return toIso(d);
}

export function diffDays(from: string, to: string) {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000);
}

export function isIsoDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toDate(value).getTime());
}

export function minIso(a: string, b: string) {
  return a < b ? a : b;
}

export function maxIso(a: string, b: string) {
  return a > b ? a : b;
}

export function formatDay(iso: string) {
  const d = toDate(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function formatMonthYear(year: number, month: number) {
  return `${new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" })} ${year}`;
}

/** "Jul 3–30", "Jun 5–Jul 30", "Dec 28, 2025–Jan 3, 2026". */
export function formatRange(from: string, to: string, withYear = false) {
  const a = toDate(from);
  const b = toDate(to);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const yearA = !sameYear || withYear ? `, ${a.getUTCFullYear()}` : "";
  const yearB = withYear || !sameYear ? `, ${b.getUTCFullYear()}` : "";
  if (a.getUTCMonth() === b.getUTCMonth() && sameYear) {
    return `${MONTHS[a.getUTCMonth()]} ${a.getUTCDate()}–${b.getUTCDate()}${yearB}`;
  }
  return `${formatDay(from)}${sameYear ? "" : yearA}–${formatDay(to)}${yearB}`;
}

export function startOfQuarter(iso: string) {
  const d = toDate(iso);
  const month = Math.floor(d.getUTCMonth() / 3) * 3;
  return toIso(new Date(Date.UTC(d.getUTCFullYear(), month, 1)));
}

export function startOfYear(iso: string) {
  return `${iso.slice(0, 4)}-01-01`;
}

/** Monday-first weekday index (0 = Monday). */
export function weekdayIndex(iso: string) {
  return (toDate(iso).getUTCDay() + 6) % 7;
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}
