import "server-only";
import { and, eq, max } from "drizzle-orm";
import { db } from "@/server/db/client";
import { agentMessages, agentRuns, agentSteps } from "@/server/db/schema";
import { newId } from "@/lib/ids";

type StepKind = "context" | "plan" | "tool" | "approval" | "observation" | "learning" | "message";
type StepStatus = "pending" | "running" | "done" | "failed" | "skipped" | "waiting";

/** Persists run state step by step so an interrupted run stays inspectable and resumable. */
export class RunRecorder {
  private seq = 0;
  private constructor(
    readonly workspaceId: string,
    readonly runId: string,
  ) {}

  static async open(workspaceId: string, runId: string): Promise<RunRecorder> {
    const rec = new RunRecorder(workspaceId, runId);
    const [row] = await db.select({ n: max(agentSteps.seq) }).from(agentSteps).where(eq(agentSteps.runId, runId));
    rec.seq = row?.n ?? 0;
    return rec;
  }

  async step(kind: StepKind, title: string, opts: { detail?: string; status?: StepStatus; output?: Record<string, unknown> } = {}): Promise<string> {
    const id = newId("step");
    const status = opts.status ?? "running";
    await db.insert(agentSteps).values({
      id,
      workspaceId: this.workspaceId,
      runId: this.runId,
      seq: ++this.seq,
      kind,
      title,
      detail: opts.detail ?? null,
      status,
      output: opts.output ?? null,
      startedAt: new Date(),
      finishedAt: status === "running" || status === "waiting" ? null : new Date(),
    });
    return id;
  }

  async finish(stepId: string, status: StepStatus, patch: { title?: string; detail?: string; output?: Record<string, unknown> } = {}): Promise<void> {
    await db
      .update(agentSteps)
      .set({ status, ...patch, finishedAt: status === "waiting" ? null : new Date() })
      .where(and(eq(agentSteps.id, stepId), eq(agentSteps.workspaceId, this.workspaceId)));
  }

  async message(role: "user" | "agent", content: string): Promise<void> {
    await db.insert(agentMessages).values({ id: newId("msg"), workspaceId: this.workspaceId, runId: this.runId, role, content });
  }

  async setRun(patch: Partial<typeof agentRuns.$inferInsert>): Promise<void> {
    await db
      .update(agentRuns)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(agentRuns.id, this.runId), eq(agentRuns.workspaceId, this.workspaceId)));
  }
}
