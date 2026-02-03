# TerraInsight 🌿

**EcoPulse AI Dashboard** - Intelligent ecological impact analysis platform.

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-Latest-black?style=flat-square)](https://sdk.vercel.ai/)

## 🌍 Overview

TerraInsight is a high-performance Next.js 15 dashboard designed to bridge the gap between complex ecological data and actionable sustainability. By leveraging **Agentic Workflows**, the platform allows organizations to upload energy reports and carbon footprint data to receive real-time, AI-driven strategic recommendations.

## ✨ Features

- 🤖 **AI-Powered Analysis** - Real-time streaming chat with EcoPulse AI for deep ecological insights.
- 📊 **Smart File Processing** - Seamless upload and parsing of CSV and PDF environmental reports.
- 🌱 **Agentic Workflows** - Autonomous identification of anomalies with automated "Green Action" suggestions.
- 🎨 **Modern UI/UX** - Premium dark-themed interface with emerald accents, built for professional sustainability officers.
- ⚡ **Edge-Ready Performance** - Optimized with Next.js 15 App Router for maximum efficiency.

## 🤖 AI Development Report (The "Accelerator" Factor)

This project was built using an **AI-First Development Workflow**, demonstrating how Generative AI can accelerate senior-level delivery:

- **IDE & Pair Programming:** Developed using **Cursor** with **Claude 3.5 Sonnet**.
- **Architectural Decisions:** AI was utilized to architect the separation between Server and Client components, ensuring strict compliance with Next.js 15 patterns.
- **Rapid Scaffolding:** Used Cursor's Composer to initialize the complex dashboard structure and Shadcn/UI integration in record time.
- **Efficiency Gain:** Estimated **70% reduction** in boilerplate coding, allowing 100% focus on the Agentic logic and Sustainability UX.

## 🧠 Agentic Workflow & Intelligence

TerraInsight is not just a chat; it's an active agent.
- **Custom Agent:** Defined in [AGENTS.md](./AGENTS.md).
- **Function Calling:** The agent is equipped with tools to trigger external workflows (simulated via n8n) when ecological risks are detected.
- **Streaming UI:** Uses Vercel AI SDK to provide a fluid, interactive experience.

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **AI Orchestration:** Vercel AI SDK
- **Styling:** Tailwind CSS (Custom Ecological Theme)
- **Components:** shadcn/ui (Radix UI)
- **Icons:** Lucide React

## 🛠️ Getting Started

### Prerequisites
- Node.js 20.20+
- npm / pnpm / yarn

### Installation

1. **Clone & Enter:**
   ```bash
   git clone https://github.com/your-username/terrainsight.git
   cd terrainsight

   
Install Dependencies:
bash
Copy
npm install
Environment Setup:
Create a .env.local file:
env
Copy
OPENAI_API_KEY=your_openai_api_key_here
Launch:
bash
Copy
npm run dev
📁 Project Structure
text
Copy
src/
├── app/                # Next.js App Router & API Routes
│   ├── api/analyze     # File parsing & AI logic
│   └── api/chat        # Vercel AI SDK streaming endpoint
├── components/
│   ├── dashboard/      # Agentic UI & Dropzone components
│   └── ui/             # Atomic Shadcn components
├── lib/                # AI Tools & Sustainability logic
└── hooks/              # Custom React hooks for UI state


🎨 Design System
Primary: Emerald Green (#10b981) - Growth & Sustainability.
Background: Deep Charcoal - Professionalism & Focus.
Typography: DM Sans - Modern readability.

Built with 💚 for a sustainable future.

TerraInsight - Turning data into ecological action.