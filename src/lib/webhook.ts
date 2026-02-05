/**
 * n8n webhook integration.
 * SECURITY: Production webhook URL is read only from process.env on the server;
 * it is never exposed to the client or logged in full.
 */

export type EnvMode = "test" | "prod";

export interface N8nTriggerResult {
  ok: boolean;
  status: number;
  detail?: string;
}

export interface ResolveWebhookResult {
  url: string | null;
  error?: string;
}

const WEBHOOK_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 800;
const RETRY_ON_STATUS_MIN = 500;

/**
 * Masks a URL for safe logging: keeps protocol and host, redacts path.
 * Use this for all logs to avoid leaking webhook paths or query params.
 */
export function maskUrlForLog(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/***`;
  } catch {
    return "[invalid-url]";
  }
}

/**
 * Validates that a string is a usable HTTP/HTTPS URL for webhook calls.
 * Exported for unit testing.
 */
export function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  const trimmed = (url ?? "").trim();
  if (!trimmed) {
    return { valid: false, error: "Webhook URL is empty" };
  }
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { valid: false, error: "Webhook URL must use http or https" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Webhook URL is invalid" };
  }
}

/**
 * Resolves the n8n webhook URL for the given environment mode.
 *
 * SECURITY:
 * - Production URL is read only from process.env.N8N_WEBHOOK_PROD on the server.
 * - Production URL is never exposed to the client; client sends only envMode and optional test URL.
 * - Client-provided test URL is used only when N8N_WEBHOOK_TEST is not set (dev fallback).
 */
export function resolveN8nWebhookUrl(
  envMode: EnvMode,
  n8nWebhookTestFromClient?: string
): ResolveWebhookResult {
  if (envMode === "prod") {
    const url = process.env.N8N_WEBHOOK_PROD?.trim();
    if (!url) {
      return {
        url: null,
        error: "Production webhook not configured. Set N8N_WEBHOOK_PROD on the server.",
      };
    }
    return { url };
  }

  const envTest = process.env.N8N_WEBHOOK_TEST?.trim();
  if (envTest) {
    return { url: envTest };
  }

  const fallback = (n8nWebhookTestFromClient ?? "").trim();
  if (fallback) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[n8n] N8N_WEBHOOK_TEST not set; using client-provided test URL.");
    }
    return { url: fallback };
  }

  return { url: null };
}

/**
 * Parses response body safely: tries JSON first, then text.
 * Exported for unit testing.
 */
export async function parseResponseBody(response: Response): Promise<string> {
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("application/json")) {
    try {
      const json = await response.json();
      return typeof json === "string" ? json : JSON.stringify(json);
    } catch {
      return await response.text();
    }
  }
  return response.text();
}

/**
 * Performs a single webhook POST with timeout and abort controller.
 * Clears timeout in all paths (success, non-ok response, throw).
 * Exported for testing / retry orchestration.
 */
export async function executeWebhookFetch(
  url: string,
  payload: Record<string, unknown>,
  signal: AbortSignal
): Promise<{ status: number; body: string; ok: boolean }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  const status = response.status;
  const body = await parseResponseBody(response);
  return { status, body, ok: response.ok };
}

/** True if we should retry (network failure or 5xx). Exported for testing. */
export function isRetriableTriggerResult(result: N8nTriggerResult): boolean {
  if (result.status === 0) return true;
  return result.status >= RETRY_ON_STATUS_MIN && result.status < 600;
}

function resultFromError(error: unknown): N8nTriggerResult {
  const message = error instanceof Error ? error.message : String(error);
  const isTimeout = error instanceof Error && error.name === "AbortError";
  return {
    ok: false,
    status: 0,
    detail: isTimeout
      ? "n8n did not respond in time. Set Webhook Response Mode to 'Immediately' in n8n."
      : message,
  };
}

/**
 * Performs one webhook attempt with timeout. Timeout is always cleared in finally.
 * Logs using masked URL only. Exported for unit testing.
 */
export async function runOneWebhookAttempt(
  url: string,
  payload: Record<string, unknown>,
  envMode: EnvMode,
  maskedUrl: string
): Promise<N8nTriggerResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const { status, body, ok } = await executeWebhookFetch(url, payload, controller.signal);
    clearTimeout(timeoutId);

    if (!ok) return { ok: false, status, detail: body || `HTTP ${status}` };
    return { ok: true, status, detail: undefined };
  } catch (error) {
    clearTimeout(timeoutId);
    return resultFromError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Triggers the n8n webhook with the given payload.
 *
 * - Validates URL before use.
 * - Uses a 30s timeout and abort controller; timeout is always cleared in finally.
 * - Logs only masked URLs (protocol + host, path redacted).
 * - Returns a detailed result; parses response body safely (JSON preferred, then text).
 * - Retry: one retry on network failure or 5xx status, after 800ms delay.
 * - Errors are logged with clear messages; timeouts are distinguished.
 */
export async function triggerN8nWebhook(
  url: string,
  payload: Record<string, unknown>,
  envMode: EnvMode
): Promise<N8nTriggerResult> {
  const validation = validateWebhookUrl(url);
  if (!validation.valid) return { ok: false, status: 0, detail: validation.error };

  const masked = maskUrlForLog(url);
  const first = await runOneWebhookAttempt(url, payload, envMode, masked);

  if (!isRetriableTriggerResult(first)) {
    return first;
  }

  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  return runOneWebhookAttempt(url, payload, envMode, masked);
}
