import { readImage } from "@/server/services/images";

/** Uploaded images never change: a new upload gets a new id, so they cache forever. */
export async function GET(_request: Request, { params }: RouteContext<"/api/images/[id]">) {
  const { id } = await params;
  const image = await readImage(id);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(image.data, "base64"), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
