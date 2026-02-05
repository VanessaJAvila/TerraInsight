import { streamText, type CoreMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { resolveN8nWebhookUrl } from "@/lib/webhook";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

type WebhookConfig = {
  url: string | null;
  allowTrigger: boolean;
  envMode: string;
};

/** Parses n8n error body and returns the hint or message for user-facing text. */
function parseN8nErrorHint(body: string): string | null {
  if (!body || typeof body !== "string") return null;
  try {
    const parsed = JSON.parse(body) as { hint?: string; message?: string };
    if (parsed.hint && typeof parsed.hint === "string") return parsed.hint;
    if (parsed.message && typeof parsed.message === "string") return parsed.message;
  } catch {
    /* not JSON */
  }
  return null;
}

const SYSTEM_PROMPT = `You are EcoPulse AI, a professional sustainability consultant with expertise in environmental impact analysis.

CAPABILITIES:
- Analyze uploaded sustainability reports (PDF/CSV files)
- Detect environmental anomalies and inefficiencies
- Provide actionable sustainability recommendations
- Trigger automated workflows for urgent issues

FILE ANALYSIS INTEGRATION:
When a file is processed through our Professional File Analysis system, you receive:
- File metadata (pages, rows, headers)
- Extracted data content
- Anomaly detection results (if any)
- Whether workflows have been triggered

Your role with uploaded data:
1. Summarize key findings from the analysis
2. Interpret anomalies and their implications
3. Provide specific, measurable recommendations
4. Confirm workflow triggers when anomalies are detected

WORKFLOW TRIGGERS:
If you detect environmental issues (from conversation OR uploaded data), you MUST call triggerSustainabilityWorkflow to alert the team.

CRITICAL: After calling ANY tool, you MUST provide a follow-up text response:
- Acknowledge the specific environmental issue
- Confirm what workflow action was triggered
- Provide immediate, actionable recommendations
- Be professional, concise, and results-oriented

COMMUNICATION STYLE:
- Professional sustainability consultant tone
- Data-driven insights
- Clear, actionable recommendations
- Focus on measurable environmental improvements

Example response: "I've analyzed your energy consumption report and detected a 35% spike in Building C during off-hours. This anomaly has been flagged and our sustainability team has been automatically alerted. Immediate actions: 1) Check HVAC timer settings, 2) Audit after-hours equipment usage, 3) Review security lighting efficiency."`;

async function triggerWebhook(
  payload: Record<string, unknown>,
  config: WebhookConfig
): Promise<string> {
  if (!config.allowTrigger) {
    return `ℹ️ Workflow triggers are disabled in Integration Hub. No webhook was called. Enable "Workflow triggers" in Integration Hub to alert the team automatically.`;
  }
  if (!config.url) {
    return `ℹ️ No webhook configured for ${config.envMode}. Set N8N_WEBHOOK_TEST (or prod) on the server or use Integration Hub test URL in dev.`;
  }
  const url = config.url;
  const mode = config.envMode;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return `✅ Sustainability workflow has been triggered successfully (${mode}). The team has been alerted about this environmental issue and will take appropriate action.`;
    }
    const body = await response.text();
    const hint = parseN8nErrorHint(body);
    const detail = hint ?? `Webhook returned ${response.status}. Please check the sustainability team dashboard.`;
    const alwaysListen = response.status === 404 && hint
      ? " To have the webhook always listening (no need to click in n8n), activate the workflow in n8n."
      : "";
    return `⚠️ Workflow trigger failed (${response.status}). ${detail}${alwaysListen}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return `⚠️ Unable to trigger workflow (${errorMessage}). Please notify the sustainability team manually.`;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      aiContext,
      envMode: envModeRaw,
      allowTrigger,
      n8nWebhookTest,
    } = body as {
      messages?: unknown[];
      aiContext?: string;
      envMode?: string;
      allowTrigger?: boolean;
      n8nWebhookTest?: string;
    };
    const envMode = envModeRaw === "prod" ? "prod" : "test";
    const { url } = resolveN8nWebhookUrl(envMode, n8nWebhookTest?.trim());
    const webhookConfig: WebhookConfig = {
      url,
      allowTrigger: allowTrigger === true,
      envMode,
    };

    const systemMessage = `${SYSTEM_PROMPT}\n\nContext: ${aiContext?.trim() || "No uploaded data available"}`;

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: systemMessage,
      messages: (messages ?? []) as CoreMessage[],
      tools: {
        triggerSustainabilityWorkflow: {
          description:
            "Trigger sustainability workflow when detecting environmental anomalies. ALWAYS continue conversation after using this tool.",
          parameters: z.object({
            action: z.string().describe("The specific action or workflow to trigger"),
            details: z.string().describe("Detailed description of the issue or opportunity"),
            severity: z
              .enum(["low", "medium", "high"])
              .describe("Priority level of the sustainability issue"),
          }),
          execute: async ({ action, details, severity }) => {
            const payload = {
              action,
              details,
              severity,
              timestamp: new Date().toISOString(),
            };
            return await triggerWebhook(payload, webhookConfig);
          },
        },
      },
      maxToolRoundtrips: 1,
    });

    return result.toDataStreamResponse();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Response.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}