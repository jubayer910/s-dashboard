const integer = new Intl.NumberFormat("en-US");

export const MINUS = "−";

export function formatInt(value: number) {
  const text = integer.format(Math.round(Math.abs(value)));
  return value < 0 ? `${MINUS}${text}` : text;
}

export function formatPercent(ratio: number, digits = 2) {
  return `${(ratio * 100).toFixed(digits)}%`;
}

function signed(text: string, value: number) {
  if (value > 0) return `+${text}`;
  if (value < 0) return `${MINUS}${text}`;
  return text;
}

/** Relative change as a percentage: "+8.4%", "−12.0%". */
export function formatChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? "0.0%" : "New";
  const change = (current - previous) / previous;
  return signed(`${Math.abs(change * 100).toFixed(1)}%`, change);
}

/** Absolute change: "+84", "−12". */
export function formatDiff(current: number, previous: number) {
  const diff = Math.round(current - previous);
  return signed(integer.format(Math.abs(diff)), diff);
}

/** Change between two ratios in percentage points: "+3.2 pts". */
export function formatPoints(current: number, previous: number) {
  const diff = (current - previous) * 100;
  return signed(`${Math.abs(diff).toFixed(1)} pts`, Number(diff.toFixed(1)));
}

export function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function tone(current: number, previous: number): "positive" | "negative" | "neutral" {
  const diff = Number((current - previous).toFixed(6));
  if (diff > 0) return "positive";
  if (diff < 0) return "negative";
  return "neutral";
}

export function relativeTime(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
