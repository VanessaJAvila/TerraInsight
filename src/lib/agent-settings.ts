/**
 * Agent Settings persisted in localStorage (client-only).
 * Production webhook URL is never stored or exposed; server uses N8N_WEBHOOK_PROD from env.
 */

const STORAGE_KEY = "terrainsight-agent-settings";

export type EnvMode = "test" | "prod";

export interface AgentSettings {
  /** Optional dev convenience: test webhook URL (e.g. localhost). Only used when server N8N_WEBHOOK_TEST is not set. */
  n8nWebhookTest: string;
  isWorkflowEnabled: boolean;
  envMode: EnvMode;
}

const DEFAULTS: AgentSettings = {
  n8nWebhookTest: "",
  isWorkflowEnabled: false,
  envMode: "test",
};

export function getAgentSettings(): AgentSettings {
  if (globalThis.window === undefined) {
    return DEFAULTS;
  }
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AgentSettings>;
    return {
      n8nWebhookTest: typeof parsed.n8nWebhookTest === "string" ? parsed.n8nWebhookTest : DEFAULTS.n8nWebhookTest,
      isWorkflowEnabled: parsed.isWorkflowEnabled === true,
      envMode: parsed.envMode === "prod" ? "prod" : "test",
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setAgentSettings(settings: Partial<AgentSettings>): void {
  const current = getAgentSettings();
  const next: AgentSettings = {
    ...current,
    ...settings,
  };
  if (globalThis.window !== undefined) {
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("Agent settings save failed:", e);
    }
  }
}

/** Values to send with analyze API (envMode + allowTrigger + optional test URL fallback). Call from client only. */
export function getAgentSettingsForRequest(): {
  envMode: EnvMode;
  allowTrigger: boolean;
  n8nWebhookTest?: string;
} {
  const s = getAgentSettings();
  return {
    envMode: s.envMode,
    allowTrigger: s.isWorkflowEnabled,
    n8nWebhookTest: s.n8nWebhookTest?.trim() || undefined,
  };
}
