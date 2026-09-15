import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/server/auth/session";
import { LEGACY_SESSION_COOKIE } from "@/server/context";

export async function POST(request: NextRequest) {
  await destroySession();
  (await cookies()).delete(LEGACY_SESSION_COOKIE);
  return NextResponse.redirect(new URL("/", request.url), 303);
}
