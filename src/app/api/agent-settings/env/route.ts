import { NextResponse } from "next/server";

/**
 * Returns whether the test webhook URL is provided by the server environment.
 * Does not expose the actual URL (server-only).
 */
export async function GET() {
  const fromEnv = Boolean(process.env.N8N_WEBHOOK_TEST?.trim());
  return NextResponse.json({ n8nWebhookTestFromEnv: fromEnv });
}
