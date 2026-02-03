import { streamText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createStreamableValue } from "ai/rsc";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * suggestSustainabilityAction - Simulates triggering an external green-workflow (e.g., n8n)
 */
const suggestSustainabilityAction = tool({
  description:
    "Triggers an external sustainability workflow when the AI identifies a green action opportunity. Use when recommending carbon reduction, waste minimization, energy efficiency, or similar actions. Simulates n8n/webhook integration.",
  parameters: {
    actionType: {
      type: "string",
      description:
        "Type of sustainability action: carbon_reduction | waste_minimization | energy_efficiency | renewable_energy | supply_chain | other",
    },
    title: {
      type: "string",
      description: "Short title for the action",
    },
    description: {
      type: "string",
      description: "Detailed description of the suggested action",
    },
    priority: {
      type: "string",
      description: "Priority level: high | medium | low",
      enum: ["high", "medium", "low"],
    },
  },
  execute: async ({ actionType, title, description, priority }) => {
    // Simulate triggering external workflow (n8n, Zapier, etc.)
    const workflowId = `eco-workflow-${Date.now()}`;
    console.log(
      `[EcoPulse] Simulated workflow trigger: ${workflowId}`,
      { actionType, title, priority }
    );

    return {
      success: true,
      workflowId,
      message: `Sustainability workflow triggered: "${title}" (${actionType})`,
      simulated: true,
      note: "In production, this would call your n8n webhook or similar automation.",
    };
  },
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "OPENAI_API_KEY is not configured. Add it to .env.local",
      }),
      { status: 500 }
    );
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are EcoPulse AI, an expert ecological impact analyst for TerraInsight. You help users understand:
- Carbon footprint from energy usage
- Waste reduction opportunities
- Sustainability best practices
- Green workflow recommendations

When you identify a clear sustainability action (e.g., "switch to LED lighting", "reduce paper waste", "optimize HVAC schedule"), use the suggestSustainabilityAction tool to simulate triggering an external green-workflow (like n8n). Be conversational, data-driven, and professional. Use markdown for formatting.`,
    messages,
    tools: {
      suggestSustainabilityAction,
    },
    maxSteps: 5,
    onFinish: ({ text, toolCalls }) => {
      if (toolCalls?.length) {
        console.log(
          "[EcoPulse] Tool calls:",
          toolCalls.map((t) => t.toolName)
        );
      }
    },
  });

  return result.toDataStreamResponse();
}
