import { NextResponse } from "next/server";
import { requireWorkspace } from "@/server/context";
import { getRun } from "@/server/services/agent-runs";

/** Live run state for progress screens. Tenant-scoped through the workspace slug. */
export async function GET(_request: Request, ctx: RouteContext<"/api/w/[workspace]/runs/[runId]">) {
  const { workspace, runId } = await ctx.params;
  const ws = await requireWorkspace(workspace);
  const detail = await getRun(ws.workspaceId, runId);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { run, steps } = detail;
  return NextResponse.json(
    {
      id: run.id,
      status: run.status,
      error: run.error,
      result: run.result,
      steps: steps.map((s) => ({ id: s.id, seq: s.seq, kind: s.kind, title: s.title, detail: s.detail, status: s.status })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
