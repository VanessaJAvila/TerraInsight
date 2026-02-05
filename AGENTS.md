# EcoPulse AI — Agent Definition

Agentic workflow for TerraInsight: model-agnostic, function-calling ready, production-oriented.

## Role & Tone
- Role: Senior Sustainability Consultant & Data Analyst
- Tone: Professional, concise, action-oriented, safety-first

## Design Principles
- Model-agnostic: provider configuration isolated to env vars; swapping models requires no code changes.
- Minimal surface area: Agent issues explicit function calls for side effects (webhooks), keeps reasoning in LLM.
- Safe-by-default: No production secrets are exposed client-side; all triggers go via server-side utilities.

## Provider Config (high level)
- OpenAI used for MVP (function calling). To swap provider, update API key & base URL in `.env.local`.

## Tools / Function Signatures (contracts)
1. triggerSustainabilityWorkflow(action: string, details: Record<string, any>, priority: "low"|"medium"|"high") => Promise<{ ok: boolean; workflowId?: string; status: number; detail?: string }>
   - Side effect: server posts to configured n8n webhook.
   - Guarantees: idempotent if same `workflowId` provided; returns status & detail.
   - Retry: server performs one retry on network/5xx failure (800ms backoff).
2. parseFile(fileBuffer: Buffer, filename: string) => Promise<{ text: string; pages?: number; extractedTables?: any[]; errors?: string[] }>
3. formatForAIContext(parsedFiles: Array<ReturnType<typeof parseFile>>) => { context: string; metadata: any }

## Webhook (n8n) payload & response
Example request (POST JSON sent server-side):
```json
{
  "action": "reduce_energy_consumption",
  "details": "HVAC consumption 20% above baseline during off-hours",
  "priority": "high",
  "timestamp": "2026-02-03T14:00:00Z",
  "source": "EcoPulse AI",
  "workflowId": "eco-1738669437032"
}
Expected server response object returned to UI (no prod URL leaked):

json
Copy
{
  "webhook": {
    "triggered": true,
    "envMode": "test",
    "status": 200,
    "detail": "OK",
    "workflowId": "eco-1738669437032"
  }
}
Idempotency: If a workflowId is reused, server must avoid duplicate side-effects or mark as duplicate in audit logs.
Validation: Server validates webhook URL, masks prod URL in logs.
Safety, Logging & Audit
All tool calls return user-facing confirmations and a workflowId (UUID/timestamp).
Audit log entry shape:
json
Copy
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "tool": "triggerSustainabilityWorkflow",
  "envMode": "test|prod",
  "workflowId": "string",
  "status": "ok|failed",
  "statusCode": 200,
  "detail": "string (redacted if contains secrets)"
}
Sensitive data rules: No API keys / production webhook URLs in agent context or client logs.
Retries: single retry for transient failures; failures stored in audit with human‑readable detail.
Prompt examples & expected function-calls
Prompt:

"I uploaded an energy report showing 150 kWh usage last month. What should I focus on?"

Expected agent decision:

No automatic webhook if priority not met; returns recommendations.
Prompt:

"My electricity bill increased 25% this quarter."

Expected behavior:

Agent should call:
triggerSustainabilityWorkflow("investigate_energy_spike", { summary: "...", evidence: [...] }, "medium")

Tests & Validation
Unit tests:
resolveN8nWebhookUrl: prod missing -> error; test fallback works
triggerN8nWebhook: success, non-2xx, timeout

Integration tests:
Upload demo critical CSV -> analyze -> webhook triggered (envMode=test)
UI receives webhook response and shows badge
Manual validation steps in README Quick Start (linked).
Observability & Production Notes
Metrics to track: webhook attempts, webhook latency, webhook failures per minute.
Recommend hooking audit logs to Sentry / Datadog for reviewers.
In production, webhook url must come from process.env.N8N_WEBHOOK_PROD (server-only).

## Testing & Audit

**Testing**
- Unit tests cover critical webhook utilities: `resolveN8nWebhookUrl` (env/fallback, prod error) and `triggerN8nWebhook` (success, non-2xx, timeout, retry). Run with `npm test`.
- Integration flows cover end-to-end analysis and webhook triggering (e.g. upload → analyze → n8n trigger; UI badge).
- Tests run with coverage reporting (`npm test` / `jest --coverage`) to support quality and maintainability.

**Audit & logging**
- Audit logs capture webhook calls with status and detail (e.g. envMode, status code, outcome). URLs are masked in logs (protocol + host only; path redacted).
- No production secrets are exposed client-side; production webhook URL is server-only and never sent or logged to the client.

## Where to find related docs
- README.md — setup & quick start
- AI_REPORT.md — runbook and evaluation logs (detailed per-run artifacts)
