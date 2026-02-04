# TerraInsight - EcoPulse AI

Professional ecological impact analysis platform with AI-powered sustainability consulting and automated workflow integration.

## Overview

TerraInsight is a Next.js 15 application that combines advanced AI analysis with sustainability expertise. The platform helps organizations track, analyze, and optimize their environmental impact through intelligent data processing and automated workflow triggers.

## Core Features

### 🤖 **AI Sustainability Consultant**
- **Expert Analysis**: GPT-4o-mini powered ecological impact assessment
- **Real-time Responses**: Streaming chat interface with professional insights
- **Energy Transparency**: Built-in energy consumption tracking for AI interactions
- **Action-Oriented**: Provides specific, measurable sustainability recommendations

### 📊 **Smart Data Processing**  
- **File Upload**: Drag-and-drop support for PDF and CSV sustainability reports
- **Automatic Parsing**: Extract and contextualize data from energy and carbon reports
- **AI Integration**: Feed uploaded data directly into AI analysis context

### 🔄 **Workflow Automation**
- **Function Calling**: Automatic trigger of sustainability workflows via n8n integration
- **Environmental Alerts**: Detection of anomalies and inefficiencies triggers team notifications
- **Professional Integration**: Seamless connection to existing sustainability management systems

### ⚡ **Energy Monitoring**
- **Session Tracking**: Real-time monitoring of AI interaction energy consumption
- **Per-Message Metrics**: Individual energy cost display for each AI response
- **Transparency**: Practice sustainability principles in the platform itself

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

Add your OpenAI API key to `.env.local`:
```env
OPENAI_API_KEY=sk-your-api-key-here
N8N_WEBHOOK_URL=http://localhost:5680/webhook-test/eco-action
```

### 3. Start Development Server
```bash
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000)

### 4. Optional: n8n Workflow Integration

To enable automated sustainability workflows:

1. **Install and start n8n**:
   ```bash
   npx n8n start
   ```

2. **Create webhook workflow**:
   - Access n8n at http://localhost:5680
   - Create new workflow with Webhook node
   - Configure path: `webhook-test/eco-action`
   - Set method: POST
   - Activate workflow

## Architecture

### Clean Code Principles Applied
- **Single Responsibility**: Each component handles one specific concern
- **Separation of Concerns**: UI, business logic, and API layers are clearly separated
- **DRY**: Reusable utilities for energy calculation and file processing
- **Clear Naming**: Functions and variables express intent clearly
- **Minimal Dependencies**: Only essential packages included

### Key Design Decisions
- **Energy Transparency**: Track and display AI interaction costs
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

### Energy Consumption Tracking
Real-time monitoring of AI interaction energy costs:
- **Formula**: `totalTokens × 0.0001 = kWh`
- **Display**: Session total + per-message consumption
- **Purpose**: Transparency and sustainability awareness

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom sustainability theme
- **UI Components**: Shadcn/UI with nature-inspired dark theme
- **AI Integration**: Vercel AI SDK with OpenAI GPT-4o-mini
- **File Processing**: PDF parsing and CSV analysis capabilities
- **Workflow Integration**: n8n webhook integration for automated responses

## File Support

- **PDF**: Energy reports, carbon assessments, sustainability audits
- **CSV**: Energy consumption data, emissions tracking, KPI sheets
- **Excel**: XLSX/XLS files (text extraction)

## Sustainability Mission

This platform practices sustainability through:
- **Transparent AI Usage**: Real-time energy consumption display
- **Efficient Processing**: Optimized algorithms and resource usage
- **Educational Interface**: Builds user awareness of digital environmental impact
- **Action-Oriented**: Focuses on measurable environmental improvements

Built with sustainability at its core - from code efficiency to user consciousness.

## Development Standards

### Code Quality
- TypeScript strict mode enabled
- ESLint with sustainability-focused rules
- Clean code principles throughout
- Comprehensive error handling

### Performance
- Optimized bundle size and loading times
- Efficient state management
- Minimal re-renders and computational overhead
- Resource-conscious AI interaction patterns

---

**Contributing**: Follow clean code principles and maintain the sustainability-first approach.
**License**: MIT - Build amazing green-tech solutions! 🌍