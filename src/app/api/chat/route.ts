import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages, aiContext } = await req.json();

    // Temporary mock mode while resolving OpenAI account setup
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("quota") || process.env.OPENAI_API_KEY.includes("MOCK")) {
      const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
      let response = "🌿 **EcoPulse AI** (Mock Mode)\n\n";
      
      if (userMessage.includes("energy") || userMessage.includes("consumption")) {
        response += "**Energy Analysis Complete:**\n• Consumption: 25% above baseline\n• Peak usage: Weekends\n• Recommendation: Optimize HVAC scheduling\n\n⚡ **Workflow triggered:** Energy optimization";
      } else if (userMessage.includes("carbon")) {
        response += "**Carbon Footprint Analysis:**\n• Total emissions: 2.1 tons CO2/month\n• Primary source: Electricity (60%)\n• Recommendation: Switch to renewable energy\n\n🌱 **Workflow triggered:** Carbon reduction plan";
      } else {
        response += "**Sustainability Dashboard Ready**\n\nI can analyze:\n• Energy consumption patterns\n• Carbon footprint metrics\n• Waste reduction opportunities\n\nTry: *'analyze our energy consumption'* or *'carbon emissions review'*";
      }
      
      // Mock streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`0:${JSON.stringify(response)}\n`));
          controller.enqueue(encoder.encode(`d:${JSON.stringify({finishReason:'stop',usage:{promptTokens:10,completionTokens:50}})}\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1',
          'Cache-Control': 'no-cache',
        }
      });
    }

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: `You are EcoPulse AI, a Senior Sustainability Consultant & Data Analyst specializing in environmental impact analysis.

Your expertise includes:
- Carbon footprint analysis and reduction strategies  
- Energy efficiency optimization
- Waste management and circular economy principles
- Environmental compliance and reporting
- Sustainability metrics and KPI tracking

IMPORTANT: When you detect environmental anomalies, inefficiencies, or areas for improvement in the user's data, you MUST call the triggerSustainabilityWorkflow tool to alert the orchestration system.

Context: ${aiContext?.trim() ? aiContext.trim() : 'No uploaded data available'}

Be professional, concise, and action-oriented. Always provide specific, measurable recommendations.`,

      messages,
      tools: {
        triggerSustainabilityWorkflow: {
          description: 'Trigger sustainability workflow when detecting environmental anomalies or optimization opportunities',
          parameters: z.object({
            action: z.string().describe('The specific action or workflow to trigger'),
            details: z.string().describe('Detailed description of the issue or opportunity'),
            severity: z.enum(['low', 'medium', 'high']).describe('Priority level of the sustainability issue'),
          }),
          execute: async ({ action, details, severity }) => {
            try {
              const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/eco-action';
              const payload = {
                action,
                details,
                severity,
                timestamp: new Date().toISOString(),
              };

              console.log('[EcoPulse] Triggering sustainability workflow:', webhookUrl);
              
              const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              });

              if (response.ok) {
                return `✅ Sustainability workflow triggered successfully! Action: ${action} (${severity} priority)`;
              } else {
                return `⚠️ Workflow trigger attempted but got response: ${response.status}`;
              }
            } catch (error) {
              console.error('[EcoPulse] Webhook error:', error);
              return `⚠️ Workflow trigger failed - please check n8n connectivity`;
            }
          }
        },
      },
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Chat API Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}