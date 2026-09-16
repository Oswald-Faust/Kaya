import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { credentialReferences, vaultEntries } from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { env } from "@/server/env";
import { newId } from "@/lib/ids";
import { open, parseKey, seal } from "./crypto";
import type { Credentials } from "./providers/types";

export function vaultKey(): Buffer {
  if (!env.INTEGRATIONS_ENCRYPTION_KEY) throw new DomainError("upstream", "Live integrations aren't enabled on this server (INTEGRATIONS_ENCRYPTION_KEY is missing).");
  return parseKey(env.INTEGRATIONS_ENCRYPTION_KEY);
}

export const vaultEnabled = () => Boolean(env.INTEGRATIONS_ENCRYPTION_KEY);

/** Stores credentials and returns the credential reference id. Replaces the previous secret when `existingRefId` is given. */
export async function storeCredentials(workspaceId: string, provider: string, authType: "oauth" | "api_key", creds: Credentials, existingRefId?: string | null): Promise<string> {
  const sealed = seal(JSON.stringify(creds), vaultKey(), workspaceId);
  const expiresAt = creds.expiresAt ? new Date(creds.expiresAt) : null;
  const scopes = creds.scope ? creds.scope.split(/[ ,]+/).filter(Boolean) : [];

  if (existingRefId) {
    const ref = await db.query.credentialReferences.findFirst({ where: eq(credentialReferences.id, existingRefId) });
    if (ref && ref.workspaceId === workspaceId) {
      await db.update(vaultEntries).set({ ...sealed, updatedAt: new Date() }).where(eq(vaultEntries.id, ref.vaultKey));
      await db.update(credentialReferences).set({ expiresAt, scopes, revokedAt: null }).where(eq(credentialReferences.id, ref.id));
      return ref.id;
    }
  }

  const vaultId = newId("vlt");
  const refId = newId("cred");
  await db.transaction(async (tx) => {
    await tx.insert(vaultEntries).values({ id: vaultId, workspaceId, ...sealed });
    await tx.insert(credentialReferences).values({ id: refId, workspaceId, provider, vaultKey: vaultId, authType, scopes, expiresAt });
  });
  return refId;
}

export async function readCredentials(workspaceId: string, refId: string): Promise<Credentials> {
  const [row] = await db
    .select({ ref: credentialReferences, entry: vaultEntries })
    .from(credentialReferences)
    .innerJoin(vaultEntries, eq(vaultEntries.id, credentialReferences.vaultKey))
    .where(eq(credentialReferences.id, refId))
    .limit(1);
  if (!row || row.ref.workspaceId !== workspaceId || row.ref.revokedAt) throw new DomainError("not_found", "These credentials were removed. Reconnect the integration.");
  return JSON.parse(open(row.entry, vaultKey(), workspaceId)) as Credentials;
}

export async function destroyCredentials(workspaceId: string, refId: string): Promise<void> {
  const ref = await db.query.credentialReferences.findFirst({ where: eq(credentialReferences.id, refId) });
  if (!ref || ref.workspaceId !== workspaceId) return;
  await db.transaction(async (tx) => {
    await tx.update(credentialReferences).set({ revokedAt: new Date() }).where(eq(credentialReferences.id, ref.id));
    // The secret itself is deleted; only the revoked reference remains for the audit trail.
    await tx.delete(vaultEntries).where(eq(vaultEntries.id, ref.vaultKey));
  });
}
