import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});


export async function POST(req: Request) {
  const { messages, aiContext } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "OPENAI_API_KEY is not configured. Add it to .env.local",
      }),
      { status: 500 }
    );
  }

  // Build system prompt with context if available
  let systemPrompt = `You are EcoPulse AI, an expert ecological impact analyst for TerraInsight. If you detect environmental anomalies or waste in the user's data, you MUST call the triggerSustainabilityWorkflow tool to alert the orchestration system.

You help users understand:
- Carbon footprint from energy usage
- Waste reduction opportunities  
- Sustainability best practices
- Green workflow recommendations

When analyzing data, actively look for:
- High energy consumption patterns
- Waste spikes or inefficiencies
- Carbon emission anomalies
- Opportunities for sustainability improvements

Be conversational, data-driven, and professional. Use markdown for formatting.`;

  if (aiContext?.trim()) {
    systemPrompt += `\n\n**UPLOADED FILE CONTEXT:**
The user has uploaded the following files for analysis. Use this data to provide specific insights and recommendations:

${aiContext}

---

When analyzing this data, focus on:
1. Identifying specific carbon footprint patterns
2. Quantifying energy usage and efficiency opportunities  
3. Highlighting waste reduction potential
4. Suggesting concrete sustainability actions based on the actual data`;
  }

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages,
    tools: {
      triggerSustainabilityWorkflow: {
        description: "Triggers the n8n sustainability workflow when environmental anomalies, waste, or efficiency issues are detected. Use this whenever you identify problems in the uploaded data that require action.",
        parameters: z.object({
          action: z.string().describe("The specific sustainability action required (e.g., 'reduce_energy_consumption', 'investigate_waste_spike', 'optimize_carbon_emissions')"),
          details: z.string().describe("Detailed description of the issue detected and recommended action"),
          priority: z.enum(["high", "medium", "low"]).describe("Urgency level based on severity of the environmental impact"),
        }),
        execute: async ({ action, details, priority }) => {
          const webhookUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook-test/eco-action";
          const timestamp = new Date().toISOString();
          
          const payload = {
            action,
            details,
            priority,
            timestamp,
            source: "EcoPulse AI",
            workflowId: `eco-${Date.now()}`,
          };

          try {
            console.log(`[EcoPulse] Triggering n8n workflow:`, payload);
            
            const response = await fetch(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            if (response.ok) {
              const responseData = await response.json().catch(() => ({}));
              return {
                success: true,
                message: `🚨 **Sustainability Alert Triggered!**\n\n**Action:** ${action}\n**Priority:** ${priority.toUpperCase()}\n**Details:** ${details}\n\n✅ n8n workflow has been notified and will begin orchestrating the sustainability response.`,
                workflowId: payload.workflowId,
                timestamp,
                webhookResponse: responseData,
              };
            } else {
              throw new Error(`Webhook responded with status: ${response.status}`);
            }
          } catch (error) {
            console.error("[EcoPulse] Failed to trigger n8n webhook:", error);
            return {
              success: false,
              message: `⚠️ **Alert:** Environmental issue detected but failed to trigger workflow.\n\n**Action:** ${action}\n**Details:** ${details}\n\nPlease check n8n connection at ${webhookUrl}`,
              error: error instanceof Error ? error.message : "Unknown error",
              workflowId: payload.workflowId,
              timestamp,
            };
          }
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
