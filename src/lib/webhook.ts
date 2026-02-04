export type EnvMode = "test" | "prod";

export function resolveN8nWebhookUrl(
  envMode: EnvMode,
  n8nWebhookTestFromClient?: string
): { url: string | null; error?: string } {
  if (envMode === "prod") {
    const url = process.env.N8N_WEBHOOK_PROD?.trim();
    if (!url) {
      return { url: null, error: "Production webhook not configured on server" };
    }
    return { url };
  }
  const envTest = process.env.N8N_WEBHOOK_TEST?.trim();
  if (envTest) return { url: envTest };
  const fallback = (n8nWebhookTestFromClient ?? "").trim();
  if (fallback) {
    console.warn("N8N: N8N_WEBHOOK_TEST not set; using client-provided test URL fallback");
    return { url: fallback };
  }
  return { url: null };
}

export interface N8nTriggerResult {
  ok: boolean;
  status: number;
  detail?: string;
}

export async function triggerN8nWebhook(
  url: string,
  payload: Record<string, unknown>,
  envMode: string
): Promise<N8nTriggerResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const status = response.status;
    console.log("N8N TRIGGER", envMode, url, "status", status);

    if (!response.ok) {
      let body = "";
      try {
        body = await response.text();
        if (body) console.log("N8N TRIGGER non-2xx body:", body);
      } catch {}
      return {
        ok: false,
        status,
        detail: body || response.statusText,
      };
    }

    return { ok: true, status, detail: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("N8N TRIGGER failed", envMode, url, message);
    return {
      ok: false,
      status: 0,
      detail: message,
    };
  }
}
