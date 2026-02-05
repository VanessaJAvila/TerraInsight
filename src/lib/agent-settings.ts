const STORAGE_KEY = "terrainsight-agent-settings";

export type EnvMode = "test" | "prod";

export interface AgentSettings {
  n8nWebhookTest: string;
  isWorkflowEnabled: boolean;
  envMode: EnvMode;
}

export const AGENT_SETTINGS_DEFAULTS: AgentSettings = {
  n8nWebhookTest: "",
  isWorkflowEnabled: false,
  envMode: "test",
};

const DEFAULTS = AGENT_SETTINGS_DEFAULTS;

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
