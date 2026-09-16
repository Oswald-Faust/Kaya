import "server-only";
import { emailEnabled, env } from "@/server/env";

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends through Resend when configured. Returns false (never throws) so callers can fall back to a copyable link. */
export async function sendEmail(message: OutgoingEmail): Promise<boolean> {
  if (!emailEnabled) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(JSON.stringify({ level: "warn", msg: "email_send_failed", status: res.status }));
      return false;
    }
    return true;
  } catch (error) {
    console.error(JSON.stringify({ level: "warn", msg: "email_send_failed", error: String(error) }));
    return false;
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
