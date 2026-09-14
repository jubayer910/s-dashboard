import { parseState } from "@/lib/dashboard-state";
import { getLegDetail } from "@/lib/queries";

export async function GET(request: Request, ctx: RouteContext<"/api/legs/[id]">) {
  const { id } = await ctx.params;
  const legId = Number(id);
  if (!Number.isInteger(legId) || legId <= 0) {
    return Response.json({ error: "Invalid team id" }, { status: 400 });
  }
  const state = parseState(new URL(request.url).searchParams);
  const detail = await getLegDetail(legId, state);
  if (!detail) return Response.json({ error: "Team not found" }, { status: 404 });
  return Response.json(detail, { headers: { "Cache-Control": "no-store" } });
}
