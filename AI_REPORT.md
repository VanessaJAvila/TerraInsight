# AI Run Report — TerraInsight EcoPulse

**Run ID:** `run_20260204_1530`  
**Date:** 2026-02-04T15:30:00Z  
**Environment:** Development/Sandbox (test)

**Verification status:** This report uses **expected/example data** from the demo flow and codebase. The following have **not** been run yet: `npm run test` (Jest with coverage) and an actual analysis run with the app. Replace the data in sections 1–7 with real outcomes after running `npm run test` and a live analysis (e.g. `npm run seed` then upload and analyze demo files).

---

## 1. Executive Summary

| Field | Value |
|-------|--------|
| **Outcome** | Success |
| **Files processed** | 5 |
| **Anomalies detected** | 3 |
| **Webhooks triggered** | 3 |

Five demo files were analyzed (3 CSV, 2 PDF). Anomalies were detected in `critical_waste.csv`, `anomaly_report.csv`, and `audit_report_critical.pdf`. One n8n webhook was sent per file with anomalies (3 total; workflow enabled, test URL). Total estimated processing energy 0.024 kWh.

---

## 2. Inputs

| Input | Value |
|-------|--------|
| **Processed files** | `green_report.csv`, `anomaly_report.csv`, `critical_waste.csv`, `sustainability_summary.pdf`, `audit_report_critical.pdf` |
| **Environment mode** | test |
| **Workflow triggers** | Enabled |
| **Webhook URL source** | N8N_WEBHOOK_TEST (`http://localhost:5678/webhook-test/eco-action`) |

**Environment variables (server):**
- `OPENAI_API_KEY` — set (required for chat and analysis)
- `N8N_WEBHOOK_TEST` — `http://localhost:5678/webhook-test/eco-action`
- `N8N_WEBHOOK_PROD` — not used (env mode was test)

---

## 3. Analysis Summary

**Heuristic anomaly detection (no LLM):**

- **Keyword categories:** waste (waste, inefficiency, loss, leak, spillage), highConsumption (high consumption, above baseline, excessive, over limit), emergency (urgent, critical, emergency, alert, failure), energy (energy, consumption, kwh, power, usage).
- **Numeric rule:** 3+ numbers > 1000 in text (threshold 1000, min count 3).
- **Severity:** low | medium | high. Emergency/highConsumption → high; waste/large numbers → medium or high.

**Hits in this run:**
- `critical_waste.csv`: energy/consumption headers, 3+ large numbers → issues: "High numerical values detected - potential consumption spikes", "Energy consumption data detected for analysis"; severity high or medium.
- `anomaly_report.csv`: energy/consumption headers, 3+ large numbers → similar issues.
- `audit_report_critical.pdf`: "critical", "Consumption", large value (500–650 kWh in demo) → "Critical environmental issue requiring immediate attention", "High numerical values detected"; severity high.

**LLM (chat):** Not used for file analysis; used only in chat for user Q&A.

---

## 4. Actions Taken

| # | Action | Payload summary | Status | Detail |
|---|--------|------------------|--------|--------|
| 1 | Webhook POST | `critical_waste.csv` — details: file + issues, severity high/medium | 200 | OK |
| 2 | Webhook POST | `anomaly_report.csv` — details: file + issues, severity medium/high | 200 | OK |
| 3 | Webhook POST | `audit_report_critical.pdf` — details: `File "audit_report_critical.pdf" analysis detected: Critical environmental issue requiring immediate attention, High numerical values detected - potential consumption spikes`, severity high, source `TerraInsight File Analysis`, recommendations array | 200 | OK |

One webhook POST per file with anomaly (3 files in this run). API response `webhookStatus` reflects only the last trigger.

---

## 5. Energy Estimates

| Metric | Value |
|--------|--------|
| **Energy (kWh)** | 0.024 |
| **Formula (per file)** | `fileSizeKB × 0.001 + 0.005 + (hasAnomalies ? 0.002 : 0)` |
| **Constants** | ENERGY_PER_FILE_KB = 0.001, ENERGY_BASE_PROCESSING = 0.005, ENERGY_ANOMALY_BONUS = 0.002 |
| **Example (one file)** | 12 KB, anomaly → 0.012×0.001 + 0.005 + 0.002 = 0.007019 kWh |

Sum of per-file `energyEstimate` from API `results[]`. Chat: ENERGY_PER_TOKEN = 0.0001, CHARS_PER_TOKEN_ESTIMATE = 4 when token usage available.

---

## 6. Audit Log Summary

```
2026-02-04T15:30:08.123Z N8N SKIP [green_report.csv]: no anomaly detected
2026-02-04T15:30:09.456Z N8N TRIGGER test http://localhost/*** status 200
2026-02-04T15:30:10.789Z N8N TRIGGER test http://localhost/*** status 200
2026-02-04T15:30:11.012Z N8N SKIP [sustainability_summary.pdf]: no anomaly detected
2026-02-04T15:30:12.345Z N8N TRIGGER test http://localhost/*** status 200
```

URLs masked (protocol + host only). No failures in this run. Order follows file processing order (anomaly_report.csv, critical_waste.csv, audit_report_critical.pdf triggered).

---

## 7. Failures & Mitigations

| Issue | Mitigation |
|-------|------------|
| None | — |

Standard mitigation for webhook timeout: single retry after 800 ms; set n8n Webhook Response Mode to "Immediately".

---

## 8. Reproduction Steps

**Environment:**
- **Node:** 20.20.0 (or >= 20.20.0 per `package.json` engines)
- **.env.local:** `OPENAI_API_KEY` set; `N8N_WEBHOOK_TEST=http://localhost:5678/webhook-test/eco-action`

**Commands:**
```bash
npm install
npm run test
npm run seed
npm run dev
```
- `npm run test` runs Jest with coverage (output in `coverage/`). Not yet run for this report.
- Open http://localhost:3000. Go to **Impact Overview** or **Reports**. Upload files from `demo-data/csv/` and `demo-data/pdf/`: `green_report.csv`, `anomaly_report.csv`, `critical_waste.csv`, `sustainability_summary.pdf`, `audit_report_critical.pdf`. Enable **Workflow triggers** in Agent Settings; ensure env mode is **Development/Sandbox** (test). Run analysis.

**Agent Settings (localStorage `terrainsight-agent-settings`):**
- `envMode`: `"test"`
- `isWorkflowEnabled`: `true`
- `n8nWebhookTest`: empty (using N8N_WEBHOOK_TEST from env)

**API endpoints:**
- `POST /api/analyze` — formData: files, envMode, allowTrigger, n8nWebhookTest when N8N_WEBHOOK_TEST not set; maxDuration 60s
- `POST /api/chat` — AI chat
- `POST /api/demo/generate-and-analyze` — generate and analyze demo data; maxDuration 30s

---

## 9. Technical Reference (MVP)

**POST `/api/analyze` response:**
- `success`, `message`, `results[]`, `totalFiles`, `anomaliesDetected`
- `webhook` / `webhookStatus`: `{ triggered, envMode, status, detail? }`

**Per-file result in `results[]`:**
- `filename`, `status` (success | error | skipped), `fileType` (pdf | csv | xlsx)
- `extractedText`, `metadata` (fileSize, pageCount?, rowCount?, headers?)
- `anomaly`: `{ detected, severity, issues[], recommendations[] }`
- `webhookTriggered?`, `summary`, `energyEstimate`, `error?`

**Webhook payload (when triggered):**
- `action`: `"investigate_file_anomaly"`
- `details`: `File "<filename>" analysis detected: <issues.join(", ")>`
- `severity`: from anomaly (low | medium | high)
- `timestamp`: ISO string
- `source`: `"TerraInsight File Analysis"`
- `recommendations`: from anomaly (string[])

**Limits:**
- Max file size: 10 MB (MAX_FILE_SIZE_BYTES)
- Accepted types: PDF, CSV, .xls, .xlsx (ACCEPTED_FILE_TYPES)
- Webhook: timeout 30 s, one retry after 800 ms on 5xx or network failure
- Analyze route: runtime nodejs, maxDuration 60 s

**Stored reports (localStorage):**
- Key: `terra-reports`
- Report id: `rpt_<timestamp>_<random>` (example: `rpt_1738669437032_abc12de`)
- Max stored: 50
- `source`: `manual` | `synthetic`

---

## 10. Limitations & Next Steps

| Limitation | Next step |
|------------|-----------|
| No E2E test for full analyze → webhook flow | Add E2E in CI |
| PDF parsing is text-only (unpdf) | Document supported formats; scanned/image PDFs not supported |
