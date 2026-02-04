import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { DEFAULT_WEBHOOK_URL } from "@/lib/constants/analysis";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

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

async function triggerWebhook(payload: any): Promise<string> {
  try {
    const response = await fetch(DEFAULT_WEBHOOK_URL, {
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