import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { localizedError } from "@/i18n/errors";
import { newId } from "@/lib/ids";

/**
 * Avatars and workspace icons. The browser crops and resizes to 256px before
 * uploading; the server still checks the real bytes, not the declared type.
 */

const MAX_BYTES = 512 * 1024;
const PREFIX = "/api/images/";

function sniff(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export async function storeImage(file: unknown, uploadedBy: string): Promise<string> {
  if (!(file instanceof Blob)) throw localizedError("validation", "imageType");
  if (file.size > MAX_BYTES) throw localizedError("validation", "imageSize");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = sniff(bytes);
  if (!contentType) throw localizedError("validation", "imageType");
  const id = newId("img");
  await db.insert(t.images).values({ id, contentType, data: Buffer.from(bytes).toString("base64"), uploadedBy });
  return `${PREFIX}${id}`;
}

/** Deletes an image we host. External URLs (Google avatars) are left alone. */
export async function deleteStoredImage(url: string | null | undefined): Promise<void> {
  if (!url?.startsWith(PREFIX)) return;
  await db.delete(t.images).where(eq(t.images.id, url.slice(PREFIX.length)));
}

export async function readImage(id: string) {
  if (!/^img_[0-9a-z]{10,40}$/.test(id)) return null;
  return db.query.images.findFirst({ where: eq(t.images.id, id) });
}
