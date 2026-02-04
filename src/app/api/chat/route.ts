import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const WEBHOOK_URL = 'http://localhost:5680/webhook-test/eco-action';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const SYSTEM_PROMPT = `You are EcoPulse AI. If a user reports an environmental issue or if you detect waste, you MUST call triggerSustainabilityWorkflow to alert the team.

CRITICAL: After calling ANY tool, you MUST provide a follow-up text response to the user. Never end with just a tool call. Always continue with:
- Acknowledge the environmental issue specifically
- Confirm what action was triggered
- Provide immediate recommendations
- Be professional, concise, and action-oriented.

Example: "I've detected elevated emissions in Block C and immediately triggered our sustainability workflow. The team has been alerted and will investigate the cause. I recommend checking HVAC systems and production schedules as immediate steps."`;

async function triggerWebhook(payload: any): Promise<string> {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok
      ? `✅ Sustainability workflow has been triggered successfully. The team has been alerted about this environmental issue and will take appropriate action.`
      : `⚠️ Alert attempted but workflow trigger returned status ${response.status}. Please check the sustainability team dashboard.`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `⚠️ Unable to trigger workflow (${errorMessage}). Please notify the sustainability team manually.`;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, aiContext } = await req.json();
    
    const systemMessage = `${SYSTEM_PROMPT}\n\nContext: ${aiContext?.trim() || 'No uploaded data available'}`;

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: systemMessage,
      messages,
      tools: {
        triggerSustainabilityWorkflow: {
          description: 'Trigger sustainability workflow when detecting environmental anomalies. ALWAYS continue conversation after using this tool.',
          parameters: z.object({
            action: z.string().describe('The specific action or workflow to trigger'),
            details: z.string().describe('Detailed description of the issue or opportunity'),
            severity: z.enum(['low', 'medium', 'high']).describe('Priority level of the sustainability issue'),
          }),
          execute: async ({ action, details, severity }) => {
            const payload = {
              action,
              details,
              severity,
              timestamp: new Date().toISOString(),
            };
            
            return await triggerWebhook(payload);
          }
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