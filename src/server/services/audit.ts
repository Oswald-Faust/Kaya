import "server-only";
import type { Db, Tx } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";
import { newId } from "@/lib/ids";

export interface AuditEntry {
  workspaceId: string;
  actorType: "user" | "agent" | "system";
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  toolCallId?: string | null;
  approvalId?: string | null;
  isExternalMutation?: boolean;
  payload?: Record<string, unknown>;
  at?: Date;
}

/** Append-only. The table rejects UPDATE/DELETE at the database level. */
export async function recordAudit(conn: Db | Tx, entry: AuditEntry): Promise<void> {
  await conn.insert(auditLogs).values({
    id: newId("aud"),
    workspaceId: entry.workspaceId,
    actorType: entry.actorType,
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId ?? null,
    toolCallId: entry.toolCallId ?? null,
    approvalId: entry.approvalId ?? null,
    isExternalMutation: entry.isExternalMutation ?? false,
    payload: entry.payload ?? {},
    createdAt: entry.at ?? new Date(),
  });
}
