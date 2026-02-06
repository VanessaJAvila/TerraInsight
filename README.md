# TerraInsight - EcoPulse AI

Professional ecological impact analysis platform with AI-powered sustainability consulting and automated workflow integration.

## Overview

TerraInsight is a Next.js 15 application that combines advanced AI analysis with sustainability expertise. The platform helps organizations track, analyze, and optimize their environmental impact through intelligent data processing and automated workflow triggers.

## Important Links

- **GitHub Repository:** https://github.com/VanessaJAvila/TerraInsight.git
- **Live Demo:** https://terrainsight.vercel.app

## Core Features

### 🤖 **AI Sustainability Consultant**
- **Expert Analysis**: GPT-4o-mini powered ecological impact assessment
- **Real-time Responses**: Streaming chat interface with professional insights
- **Action-Oriented**: Provides specific, measurable sustainability recommendations

### 📊 **Smart Data Processing**  
- **File Upload**: Drag-and-drop support for PDF and CSV sustainability reports *(Excel support coming soon)*
- **Automatic Parsing**: Extract and contextualize data from energy and carbon reports
- **Anomaly Detection**: Heuristic analysis to identify environmental issues automatically

### 🔄 **Workflow Automation**
- **Function Calling**: Automatic trigger of sustainability workflows via n8n integration
- **Environmental Alerts**: Detection of anomalies and inefficiencies triggers team notifications
- **Professional Integration**: Seamless connection to existing sustainability management systems

## 🔄 Agentic Workflow & Governance

TerraInsight implements a **Human-in-the-Loop (HITL)** architecture to ensure AI-driven decisions are supervised by experts before execution.

### 🛡️ Human-in-the-Loop Flow
1. **Detection:** The AI Agent identifies a high-severity environmental anomaly (e.g., critical waste or energy spikes).
2. **Orchestration:** Via **n8n**, a specialized workflow is triggered, decoupling business logic from the frontend.
3. **Authorization:** Instead of autonomous execution, the system sends a professional alert to the **Mailtrap SMTP Sandbox** (development) or the configured SMTP provider (production).
4. **Human Review:** A manager reviews the technical details in the email and performs the approval/rejection directly within the n8n workflow interface.
5. **Execution:** Only after explicit human authorization does the workflow proceed with mitigation protocols.

### 🧪 Professional Sandboxing
For the MVP, we utilize **Mailtrap** as an SMTP Sandbox. This demonstrates a production-ready mindset:
- **Safety:** Prevents accidental email blasts during development.
- **Observability:** Provides a centralized dashboard to audit all automated communications.
- **Staging Excellence:** Simulates real-world enterprise mail servers (like SendGrid or AWS SES) without infrastructure overhead.

## Quick Start

### 1. Installation
```bash
git clone <repository-url>
cd TerraInsight
npm install
```

### 2. Environment Configuration

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add the following:

```env
# AI & Core
OPENAI_API_KEY=sk-your-key

# Agentic Workflow (n8n + ngrok)
N8N_WEBHOOK_PROD=https://your-ngrok-id.ngrok-free.app/webhook/eco-action

# SMTP Sandbox (Configure these inside n8n Credentials)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
```

**Environment Variables:**
- **OPENAI_API_KEY**: Required for the AI chat and analysis.
- **N8N_WEBHOOK_TEST**: Used when Integration Hub environment mode is **Development/Sandbox** (e.g. local n8n). Server reads this from the server env; optional Test URL in Integration Hub is a fallback when `N8N_WEBHOOK_TEST` is not set.
- **N8N_WEBHOOK_PROD**: Used when environment mode is **Live/Production**; never exposed in the UI (server-only).

### 3. Start Development Server
```bash
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000)

## Testing & Demo Data

### Testing & Coverage

To verify system reliability, run `npm run test`. This executes the Jest suite covering webhooks and parsing logic.

```bash
npm run test
```

To view the detailed coverage report, open `coverage/lcov-report/index.html` after running tests (in a browser). Coverage helps ensure code quality and maintainability for evaluators and contributors. For a detailed audit of a real system execution, including energy metrics, anomaly logs, and specific coverage scope, please refer to the [AI_REPORT.md](./AI_REPORT.md).

### Demo Data Generation

TerraInsight includes a comprehensive demo data generator for testing the complete analysis pipeline:

```bash
npm run seed
```

This creates `demo-data/` folder with production-ready test files designed to validate all system capabilities.

#### Generated Test Files

| File | Type | Purpose | Expected Behavior |
|------|------|---------|------------------|
| `green_report.csv` | CSV | Normal operations (consumption < 80) | ✅ No anomalies detected |
| `anomaly_report.csv` | CSV | Elevated consumption (150-220 range) | ⚠️ Medium priority alerts |
| `critical_waste.csv` | CSV | Critical levels (500-1200 range) | 🚨 High priority + n8n trigger |
| `sustainability_summary.pdf` | PDF | Block C energy waste report | 📄 Text extraction + context |

#### Test Scenarios

**Scenario 1: Normal Operations Validation**
```bash
# Upload: green_report.csv
# Expected: Clean analysis, no workflow triggers
# AI Response: "No significant issues detected"
```

**Scenario 2: Anomaly Detection**
```bash
# Upload: anomaly_report.csv  
# Expected: Medium severity flags, consumption warnings
# AI Response: Identifies HVAC system inefficiencies (220 kWh peak)
```

**Scenario 3: Critical Alert System**
```bash
# Upload: critical_waste.csv
# Expected: High severity + automatic n8n webhook trigger
# AI Response: Critical alerts for Industrial Unit A (720 kWh) and Cooling System (1200 kWh)
```

**Scenario 4: Multi-Modal Analysis**
```bash
# Upload: sustainability_summary.pdf + critical_waste.csv
# Expected: PDF text extraction + CSV anomaly detection
# AI Query: "What did you find in that report?"
# AI Response: Correlates PDF Block C findings with CSV critical data
```

#### Validation Checklist

**Core Functionality**
- [ ] File upload accepts PDF and CSV formats
- [ ] Progress indicators show during processing
- [ ] Energy consumption estimates display per file
- [ ] Session energy tracking accumulates correctly
- [ ] AI_REPORT.md generated and validated with real execution metrics.

**Anomaly Detection**
- [ ] Normal data (< 80): No alerts triggered
- [ ] Medium anomalies (150-220): Warning badges appear
- [ ] Critical values (500+): High priority alerts + workflow triggers
- [ ] PDF text extraction: Identifies "Block C" and "energy waste" keywords

**AI Integration**
- [ ] Analysis results populate AI context automatically
- [ ] Agent can answer questions about uploaded reports
- [ ] Workflow confirmations appear when n8n triggers activate
- [ ] Energy tracking displays in both chat footer and session total

**Professional Integration**
- [ ] n8n webhook receives payload when critical anomalies detected
- [ ] Payload structure matches expected format (action, details, severity)
- [ ] System gracefully handles n8n service unavailability

### 4. Optional: n8n Workflow Integration

To enable automated sustainability workflows:

1. **Install and start n8n**:
   ```bash
   npx n8n start
   ```

## Architecture

### Clean Code Principles Applied
- **Single Responsibility**: Each component handles one specific concern
- **Separation of Concerns**: UI, business logic, and API layers are clearly separated
- **DRY**: Reusable utilities for anomaly detection and file processing
- **Clear Naming**: Functions and variables express intent clearly
- **Minimal Dependencies**: Only essential packages included

### Key Design Decisions
- **Clean Architecture**: Separated types, constants, and utilities for maintainability
- **Progressive Enhancement**: Works without n8n, enhanced with it
- **Error Resilience**: Graceful degradation when services are unavailable
- **Professional UX**: Clean interface focused on core functionality

## Integration Details

### AI Function Calling
The platform uses OpenAI's function calling to trigger sustainability workflows when environmental issues are detected:

```json
{
  "action": "investigate_elevated_emissions",
  "details": "Block C emissions 50% above normal levels",
  "severity": "high",
  "timestamp": "2026-02-04T13:00:00.000Z"
}
```

### Anomaly Detection System
Intelligent analysis of uploaded sustainability data:
- **Keyword Detection**: Identifies waste, high consumption, and critical issues
- **Threshold Analysis**: Detects numerical anomalies and consumption spikes
- **Automated Alerts**: Triggers workflows when environmental issues are found

## Technology Stack

### Core Platform
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom sustainability theme (Emerald/Charcoal)
- **UI Components**: Shadcn/UI with nature-inspired dark theme
- **AI Integration**: Vercel AI SDK with OpenAI GPT-4o-mini
- **State Management**: React hooks with optimized context passing

### Data Processing
- **PDF Processing**: `pdf-parse` with dynamic imports
- **CSV Analysis**: `papaparse` with header detection and validation
- **File Validation**: Multi-format support with type safety
- **Energy estimation**: kWh consumption estimates (file processing and chat usage)

### Professional Integration
- **Workflow Automation**: n8n webhook integration for critical alerts
- **Error Handling**: Comprehensive try/catch with graceful degradation
- **Performance**: Optimized bundle splitting and lazy loading
- **Security**: Input validation and sanitization for uploaded content

## Professional Data Processing

### MVP Scope

Prioritized CSV and PDF to cover the most common industry standards for sustainability reporting.

### Supported File Formats

| Format | Use Cases | Processing Capabilities |
|--------|-----------|------------------------|
| **PDF** | Energy reports, carbon assessments, sustainability audits | Text extraction, keyword analysis, Block identification |
| **CSV** | Energy consumption data, emissions tracking, KPI sheets | Numerical analysis, threshold detection, header mapping |
| **Excel** | XLSX/XLS *(coming soon)* | Data extraction, structured analysis |

### Analysis Pipeline

1. **File Ingestion**: Dynamic import strategy for optimal bundle size
2. **Content Extraction**: Format-specific parsing (pdf-parse, papaparse)
3. **Heuristic Analysis**: Multi-layered anomaly detection
4. **Context Integration**: Results automatically feed AI agent knowledge base
5. **Workflow Triggers**: Automated n8n integration for critical findings

### Anomaly Detection Algorithm

**Keyword-Based Detection**
- Waste indicators: `waste`, `inefficiency`, `loss`, `leak`, `spillage`
- High consumption patterns: `high consumption`, `above baseline`, `excessive`
- Emergency flags: `urgent`, `critical`, `emergency`, `alert`, `failure`

**Numerical Threshold Analysis**
- Values > 1000: Flagged for review
- 3+ large numbers: Triggers medium priority alert
- CSV energy headers: Automatic consumption analysis

**Severity Classification**
- **Low**: Single keyword match or minor threshold breach
- **Medium**: Multiple indicators or significant consumption spike
- **High**: Critical keywords + high numerical values

## Known Limitations

- Excel file support is planned but not yet implemented.
- PDF parsing is text-based; scanned/image PDFs are not supported.
- ngrok tunnel URL changes on restart; requires terminal open during demo.

## Sustainability Mission

This platform promotes environmental responsibility through:
- **Efficient Processing**: Optimized algorithms and minimal resource usage
- **Action-Oriented Analysis**: Focuses on measurable environmental improvements
- **Automated Response**: Instant workflow triggers for environmental issues
- **Professional Insights**: Data-driven sustainability recommendations

Built with sustainability at its core - from code efficiency to environmental impact.

## Development & Deployment

### Agentic Workflow — ngrok Tunnel & Evaluation Notes

**Summary**

- The automation feature (Agentic Workflow) sends payloads to n8n via a server-side webhook.
- For the cloud demo, we use a secure tunnel (ngrok) that connects Vercel to a locally running n8n inside Docker. This allows demonstrating the full flow without hosting n8n in the cloud.

**Critical Dependency (Important)**

For automated webhooks to fire during evaluation, the following setup must be active:

- The author's computer is powered on;
- The Docker container running n8n is active locally;
- The ngrok tunnel is running (ngrok terminal open);
- The Vercel environment variable `N8N_WEBHOOK_PROD` points to the public ngrok URL (e.g. `https://xxxx.ngrok-free.dev/webhook/eco-action`).

**How to Test the Full Flow (Step-by-step)**

1. **Start n8n (Docker)**  
   - If using docker-compose:
     ```bash
     docker-compose up -d n8n
     ```
   - Or with docker run (example):
     ```bash
     docker run -it --name n8n -p 5678:5678 n8nio/n8n
     ```

2. **Start the ngrok tunnel (on your PC)**  
   - Sign up at https://dashboard.ngrok.com and get your authtoken.
   - Configure the authtoken (once):
     ```bash
     ngrok authtoken <YOUR_AUTHTOKEN>
     ```
   - Create the tunnel (keep this terminal open during the demo):
     ```bash
     ngrok http 5678
     ```
   - Copy the HTTPS URL provided by ngrok (e.g. `https://abc123.ngrok-free.dev`).

3. **Set local and production environment variables**  
   - In local environment (`.env.local`):
     ```env
     OPENAI_API_KEY=sk-...
     N8N_WEBHOOK_TEST=http://localhost:5678/webhook-test/eco-action
     N8N_WEBHOOK_PROD=https://abc123.ngrok-free.dev/webhook/eco-action
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     ```
   - In Vercel: set `N8N_WEBHOOK_PROD` to the ngrok URL + `/webhook/eco-action` before deploying.

4. **Verify the workflow**  
   - Ensure the n8n Workflow is **Active** and the Webhook node uses the path `webhook/eco-action`.
   - Open the app in production (Vercel) and upload `demo-data/csv/critical_waste.csv`.
   - Watch the ngrok terminal — you should see a forwarded request; confirm in n8n that the workflow triggered.
   - The app will show a trigger confirmation badge (when present).

**For Evaluators — if the tunnel is offline**

If the tunnel URL is not active (e.g. PC off), webhooks will not fire. The app gracefully degrades:

- Local file analysis and AI chat continue to work (OpenAI API).
- Automated triggers to n8n do not occur — you can test locally following the steps above or manually trigger via cURL:
  ```bash
  curl -X POST https://abc123.ngrok-free.dev/webhook/eco-action -H "Content-Type: application/json" -d '{"action":"test"}'
  ```
- Note to evaluator: full local setup instructions are provided to replicate the integration if desired.

**Security and Production Behavior**

- In production (Vercel), `N8N_WEBHOOK_PROD` is stored as a server-side environment variable and the app UI only shows a masked state (URL not exposed).
- The integration page (Integration Hub) is locked for editing in production and displays a status indicator: "Tunnel Active" / "Tunnel Offline".

**Demo Transparency**

This solution demonstrates an end-to-end flow with a secure tunnel to enable real-time validation. For offline evaluation, the repository includes instructions to run the full stack locally.

### Code Quality Standards
- **TypeScript**: Strict mode with comprehensive type coverage
- **Clean Architecture**: Modular separation (types, constants, utilities)
- **ESLint**: Sustainability-focused rules with zero-warning policy
- **Error Handling**: Comprehensive try/catch with user-friendly messages
- **Testing**: Demo data pipeline validates all critical paths

### Performance Optimization
- **Bundle Splitting**: Dynamic imports for pdf-parse and papaparse
- **Memory Management**: Efficient file processing with cleanup
- **State Optimization**: Minimal re-renders with useCallback/useMemo
- **Network Efficiency**: Optimized API calls with proper error boundaries

### Production Readiness
- **Environment Configuration**: Secure API key management
- **Error Boundaries**: React error boundaries for graceful failures
- **Logging**: Structured logging for debugging and monitoring
- **Hydration**: SSR compatibility with suppressHydrationWarning

### Tech Lead Quick Start
```bash
# Complete setup and validation
git clone <repository-url>
cd TerraInsight
npm install
npm run seed              # Generate test data
npm run dev              # Start development

# Validate complete pipeline
# 1. Upload demo-data/critical_waste.csv
# 2. Verify n8n webhook trigger (if configured)
# 3. Ask AI: "What critical issues did you find?"
# 4. Confirm energy tracking in chat interface
```

## Project Structure

```
TerraInsight/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts       # File processing API
│   │   │   └── chat/route.ts          # AI agent API
│   │   ├── agent-settings/page.tsx    # n8n configuration
│   │   └── page.tsx                   # Main dashboard
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── professional-dropzone.tsx  # File upload UI
│   │   │   ├── eco-agent.tsx              # AI chat interface
│   │   │   └── dashboard-client.tsx       # Main client component
│   │   └── ui/                        # Reusable UI components
│   └── lib/
│       ├── types/analysis.ts          # TypeScript interfaces
│       ├── constants/analysis.ts      # Configuration constants
│       └── utils/analysis.ts          # Core analysis logic
├── demo-data/                         # Generated test files
├── scripts/
│   └── generate-demo-data.js          # Test data generator
└── package.json
```

## Troubleshooting

### Common Issues

**File Upload Not Working**
```bash
# Check file size limits and supported formats
# Verify API route is responding
curl -X POST http://localhost:3000/api/analyze
```

**Test analyze API with n8n trigger (test mode)**
```bash
# After: npm run seed && npm run dev
curl -X POST http://localhost:3000/api/analyze \
  -F "files=@demo-data/csv/critical_waste.csv" \
  -F "envMode=test" \
  -F "allowTrigger=true"
# Optional: -F "n8nWebhookTest=http://localhost:5678/webhook-test/eco-action" if N8N_WEBHOOK_TEST is not set
```

**n8n Webhook Not Triggering**
```bash
# Verify n8n is running on port 5678
curl http://localhost:5678/webhook-test/eco-action
# Set N8N_WEBHOOK_TEST and N8N_WEBHOOK_PROD in .env.local; toggle env in Integration Hub
```

**AI Agent Not Responding**
```bash
# Verify OpenAI API key is set
echo $OPENAI_API_KEY
# Check API quota and billing status
```

**Hydration Errors**
```bash
# Clear browser extensions that modify forms
# Restart development server
npm run dev
```

### Performance Monitoring

**File Processing Times**
- PDF < 1MB: ~2-3 seconds
- CSV < 100KB: ~1-2 seconds  
- Large files (>5MB): May timeout, consider chunking

**Memory Usage**
- Monitor Node.js heap with large PDF files
- Dynamic imports prevent memory leaks
- File processing cleans up automatically

### Integration Validation

**n8n Webhook Payload**
```json
{
  "action": "create_ticket",
  "details": "Critical consumption detected: 1200 kWh in Cooling System",
  "severity": "high",
  "timestamp": "2026-02-04T21:00:00.000Z",
  "issues": ["High numerical values detected"],
  "recommendations": ["Review high-value entries for efficiency opportunities"]
}
```

**Expected Response Flow**
1. File upload → API processing → Anomaly detection
2. If critical: n8n webhook trigger → External workflow
3. Results → AI context → User can query findings
4. Energy tracking → Session accumulation → Display

---

## For Tech Leads

### Quick Validation Protocol

1. **System Health Check**
   ```bash
   npm run seed && npm run dev
   # Upload critical_waste.csv
   # Verify: Anomaly detection + n8n trigger + AI context
   ```

2. **Integration Testing**
   - File processing pipeline: ✅
   - AI context integration: ✅  
   - Workflow automation: ✅
   - Energy consumption tracking: ✅

3. **Performance Baseline**
   - File analysis: <5s for standard reports
   - AI responses: <3s for typical queries
   - Memory usage: <200MB steady state

### Architecture Benefits

- **Modular**: Easy to extend with new file formats or AI models
- **Testable**: Comprehensive demo data covers all scenarios  
- **Scalable**: Dynamic imports and efficient processing
- **Professional**: Production-ready error handling and monitoring

**Contributing**: Follow clean code principles and maintain the sustainability-first approach.
**License**: MIT - Build amazing green-tech solutions! 🌍