import { NextResponse } from "next/server";

/**
 * Returns whether the test webhook URL is provided by the server environment
 * and whether the app is running in production (e.g. Vercel).
 * Does not expose the actual URL (server-only).
 */
export async function GET() {
  const fromEnv = Boolean(process.env.N8N_WEBHOOK_TEST?.trim());
  const isProduction = process.env.VERCEL === "1";
  return NextResponse.json({ n8nWebhookTestFromEnv: fromEnv, isProduction });
}
