# EcoPulse AI — Agent Definition

Agentic workflow for TerraInsight: model-agnostic, function-calling ready, and production-oriented.

## Agent Role & Tone

- **Role**: Senior Sustainability Consultant & Data Analyst
- **Tone**: Professional, concise, action-oriented, safety-first

## Model Agnostic Design

This system is intentionally model-agnostic. The agent logic, tools, and function-calling contracts are implementation-agnostic so the model backend can be swapped without code changes.

## Truth: Why OpenAI for the MVP, and how to swap models

We use OpenAI for the MVP to leverage its high-quality Function Calling and stability. The architecture uses the Vercel AI SDK and isolates model configuration in environment variables so swapping providers is a single-line change.

### Provider Configuration Examples

**OpenAI (MVP - Function Calling, highest fidelity):**
```env
# OpenAI (MVP - Function Calling, highest fidelity)
OPENAI_API_KEY=sk-...
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

**OpenRouter (drop-in alternative):**
```env
# OpenRouter (compatible alternative)
OPENROUTER_API_KEY=or-...
OPENAI_API_BASE_URL=https://openrouter.ai/api/v1
```

**Generic LLM (self-hosted / vendor):**
```env
# Example: self-hosted or vendor LLM (replace URL/KEY with provider values)
LLM_API_KEY=llm-...
LLM_API_BASE_URL=https://api.vendor-llm.example/v1
```

**Migration**: To change providers, update the appropriate API key and API_BASE_URL environment variables in `.env.local` and restart the app — no code changes required.

## Tools / Function Calling

- `triggerSustainabilityWorkflow(action, details, priority)` — POSTs to orchestration webhook (n8n/Pipedream) and returns confirmation
- `parseFile(fileData)` — extracts and analyzes text from uploaded PDF/CSV energy reports
- `formatForAIContext(parsedFiles)` — structures file data for contextual analysis

### Webhook Payload Example

```json
{
  "action": "reduce_energy_consumption",
  "details": "HVAC consumption 20% above baseline during off-hours",
  "priority": "high",
  "timestamp": "2026-02-03T14:00:00Z",
  "source": "EcoPulse AI",
  "workflowId": "eco-1738669437032"
}
```

## Safety, Logging & Audit

- **Confirmation Messages**: All tool calls return user-facing confirmations with workflow IDs
- **Audit Logging**: Webhook triggers logged with timestamps and payload details
- **API Security**: API keys never exposed to agent context or client-side code
- **Error Handling**: Graceful degradation when external services (n8n) are unavailable

## Example Prompts / Expected Behavior

**Prompt 1**: *"I uploaded an energy report showing 150kWh usage last month. What should I focus on?"*
- **Expected**: Agent analyzes file context, identifies patterns, provides specific recommendations

**Prompt 2**: *"My electricity bill increased 25% this quarter."*  
- **Expected**: Agent calls `triggerSustainabilityWorkflow` with action "investigate_energy_spike" and priority "medium"

## Where to Find More

See `README.md` for deployment and development notes.

---

**Recommended commit**: `docs: add AGENTS.md — model-agnostic design and function-calling tools`