# TerraInsight 🌿

**EcoPulse AI Dashboard** - Intelligent ecological impact analysis platform

## Overview

TerraInsight is a modern Next.js 15 dashboard that helps organizations analyze their ecological footprint through AI-powered insights. Upload energy reports, carbon footprint data, and get intelligent recommendations for sustainability improvements.

## ✨ Features

- 🤖 **AI-Powered Analysis** - Chat with EcoPulse AI for ecological insights
- 📊 **Smart File Processing** - Upload CSV, PDF, and Excel reports
- 🌱 **Sustainability Workflows** - Automated green action recommendations
- 🎨 **Modern UI** - Beautiful ecological theme with emerald accents
- ⚡ **Next.js 15** - Latest React features with App Router
- 🎯 **TypeScript** - Full type safety throughout

## 🚀 Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom ecological theme
- **AI:** Vercel AI SDK with OpenAI integration
- **UI Components:** shadcn/ui with Radix UI primitives
- **Icons:** Lucide React
- **Fonts:** DM Sans from Google Fonts

## 🛠️ Getting Started

### Prerequisites

- Node.js 20.20+ 
- npm or yarn

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/your-username/terrainsight.git
   cd terrainsight
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Add your OpenAI API key:
   \`\`\`
   OPENAI_API_KEY=your_openai_api_key_here
   \`\`\`

4. **Run the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # AI chat endpoint
│   │   └── analyze/       # File analysis endpoint
│   ├── agent-settings/    # AI agent configuration
│   ├── reports/           # Reports dashboard
│   └── globals.css        # Global styles
├── components/
│   ├── dashboard/         # Main dashboard components
│   │   ├── eco-agent.tsx     # AI chat interface
│   │   ├── eco-dropzone.tsx  # File upload component
│   │   └── sidebar.tsx       # Navigation sidebar
│   └── ui/                # Reusable UI components
└── lib/
    └── utils.ts           # Utility functions
\`\`\`

## 🎨 Design System

### Colors
- **Primary:** Emerald green (#10b981) - Representing growth and sustainability
- **Background:** Charcoal variants - Modern, professional look
- **Accents:** Forest green shades for ecological feel

### Typography
- **Font:** DM Sans - Clean, modern, and highly readable

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌍 Environmental Impact

TerraInsight is built with sustainability in mind - helping organizations reduce their ecological footprint through data-driven insights and AI-powered recommendations.

---

Built with 💚 for a sustainable future