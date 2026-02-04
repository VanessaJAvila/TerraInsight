import { DEFAULT_WEBHOOK_URL } from "@/lib/constants/analysis";

const STORAGE_KEY = "terrainsight-agent-settings";

export type EnvironmentMode = "test" | "production";

export interface AgentSettings {
  webhookUrlTest: string;
  webhookUrlProduction: string;
  workflowEnabled: boolean;
  environmentMode: EnvironmentMode;
}

const DEFAULTS: AgentSettings = {
  webhookUrlTest: DEFAULT_WEBHOOK_URL,
  webhookUrlProduction: "",
  workflowEnabled: false,
  environmentMode: "test",
};

/** Expected URL patterns: test = localhost or /webhook-test/ or 'test' in path; production = https, not localhost */
const TEST_PATTERNS = [
  /localhost/i,
  /webhook-test/i,
  /\/test\//i,
  /\.test\./i,
];
const PRODUCTION_PATTERNS = [/^https:\/\//i]; // production should use HTTPS
const LOCALHOST = /localhost/i;

export function getAgentSettings(): AgentSettings {
  if (globalThis.window === undefined) {
    return DEFAULTS;
  }
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AgentSettings>;
    return {
      webhookUrlTest: parsed.webhookUrlTest ?? DEFAULTS.webhookUrlTest,
      webhookUrlProduction: parsed.webhookUrlProduction ?? DEFAULTS.webhookUrlProduction,
      workflowEnabled: parsed.workflowEnabled ?? DEFAULTS.workflowEnabled,
      environmentMode:
        parsed.environmentMode === "production" ? "production" : "test",
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

export function getEffectiveWebhookUrl(): string {
  const s = getAgentSettings();
  return s.environmentMode === "production"
    ? (s.webhookUrlProduction || s.webhookUrlTest)
    : s.webhookUrlTest;
}

/** Validate webhook URL and optionally check it matches expected test or production pattern. */
export function validateWebhookUrl(
  url: string,
  mode?: EnvironmentMode
): { valid: boolean; message?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, message: "URL is required" };
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, message: "URL is required" };
  }
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { valid: false, message: "URL must use http or https" };
    }
  } catch {
    return { valid: false, message: "Invalid URL format" };
  }
  if (mode === "test") {
    const looksTest =
      TEST_PATTERNS.some((p) => p.test(trimmed)) || LOCALHOST.test(trimmed);
    if (!looksTest) {
      return {
        valid: true,
        message:
          "Test mode usually uses localhost or a URL containing 'webhook-test' or 'test'.",
      };
    }
  }
  if (mode === "production") {
    const looksProd = PRODUCTION_PATTERNS.some((p) => p.test(trimmed));
    const isLocal = LOCALHOST.test(trimmed);
    if (isLocal) {
      return {
        valid: true,
        message: "Production typically uses a non-localhost HTTPS URL.",
      };
    }
    if (!looksProd) {
      return {
        valid: true,
        message: "Production mode should use HTTPS for security.",
      };
    }
  }
  return { valid: true };
}

/** Values to send with API requests (effective URL + enabled). Call from client only. */
export function getAgentSettingsForRequest(): {
  webhookUrl: string;
  workflowEnabled: boolean;
  environmentMode: EnvironmentMode;
} {
  const s = getAgentSettings();
  const webhookUrl =
    s.environmentMode === "production"
      ? (s.webhookUrlProduction || s.webhookUrlTest)
      : s.webhookUrlTest;
  return {
    webhookUrl: webhookUrl || DEFAULT_WEBHOOK_URL,
    workflowEnabled: s.workflowEnabled,
    environmentMode: s.environmentMode,
  };
}
