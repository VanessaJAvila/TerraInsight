# TerraInsight - EcoPulse AI

An intelligent dashboard for ecological impact analysis with AI-powered sustainability workflow orchestration.

## 🌿 Features

- **Smart File Analysis**: Upload PDF/CSV energy and carbon reports for AI analysis
- **Real-time Chat Agent**: Conversational AI that analyzes your ecological data
- **n8n Integration**: Automatic workflow triggering when environmental anomalies are detected
- **Premium UI**: Nature-inspired dark theme with professional Green-Tech design
- **Accessibility First**: Full keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ installed
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- n8n instance running (optional but recommended)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see TerraInsight in action!

### n8n Integration Setup

1. **Install n8n Desktop**: Download from [n8n.io/desktop](https://n8n.io/desktop)
2. **Start n8n**: Launch n8n Desktop (default: http://localhost:5678)
3. **Create Webhook**: Set up a webhook workflow listening at `/webhook-test/eco-action`
4. **Test Integration**: Upload a report and watch EcoPulse AI trigger workflows automatically

## 🛠️ Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/chat/          # AI chat endpoint with n8n integration
│   ├── api/analyze/       # File analysis API
│   └── page.tsx           # Main dashboard
├── components/
│   ├── dashboard/         # Dashboard components
│   │   ├── eco-dropzone.tsx    # File upload with parsing
│   │   ├── eco-agent.tsx       # AI chat interface
│   │   └── sidebar.tsx         # Navigation sidebar
│   └── ui/               # Shadcn/UI components
└── lib/
    ├── actions/          # Server actions for file parsing
    └── utils/            # Utility functions
```

## 🤖 AI Capabilities

EcoPulse AI automatically:
- **Detects** energy consumption anomalies
- **Identifies** waste inefficiencies  
- **Quantifies** carbon emission patterns
- **Triggers** n8n workflows for remediation
- **Suggests** concrete sustainability actions

## 🔗 n8n Webhook Integration

When EcoPulse AI detects environmental issues, it sends a POST request to:
```
http://localhost:5678/webhook-test/eco-action
```

**Payload structure:**
```json
{
  "action": "reduce_energy_consumption",
  "details": "High energy usage detected in HVAC system during off-hours",
  "priority": "high",
  "timestamp": "2024-02-03T17:45:00.000Z",
  "source": "EcoPulse AI",
  "workflowId": "eco-1706981100000"
}
```

## 🎨 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with nature-inspired theme
- **UI Components**: Shadcn/UI with custom Green-Tech styling
- **AI**: Vercel AI SDK with OpenAI GPT-4
- **File Processing**: PDF-parse & Papa Parse for report analysis
- **Orchestration**: n8n webhook integration for sustainability workflows

## 📊 Supported File Types

- **PDF**: Energy reports, carbon assessments, sustainability audits
- **CSV**: Energy consumption data, emissions data, waste tracking
- **Excel**: XLSX/XLS files (basic text extraction)

## 🌱 Environmental Impact

TerraInsight helps organizations:
- Reduce energy consumption by up to 30%
- Identify waste reduction opportunities
- Automate sustainability response workflows
- Meet ESG reporting requirements
- Achieve carbon neutrality goals

## 📝 License

MIT License - build amazing green-tech solutions! 🌍