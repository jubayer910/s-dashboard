import { parseState, resolveRange } from "@/lib/dashboard-state";
import { getBounds, getLegDailyRows } from "@/lib/queries";

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const legId = Number(url.searchParams.get("leg"));
  if (!Number.isInteger(legId) || legId <= 0) {
    return Response.json({ error: "Pass ?leg=<team id>" }, { status: 400 });
  }
  const state = parseState(url.searchParams);
  const { asOf, minDay } = await getBounds();
  const period = resolveRange(state, asOf, minDay);
  const rows = await getLegDailyRows(legId, period);
  if (rows.length === 0) return Response.json({ error: "No data for that team and range" }, { status: 404 });

  const header = Object.keys(rows[0]);
  const csv = [header.join(","), ...rows.map((row) => header.map((key) => csvCell(row[key])).join(","))].join("\n");
  const slug = String(rows[0].leg)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-${period.from}-to-${period.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
