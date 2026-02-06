"use client";

import { useChat } from "ai/react";
import { useRef, useEffect, useMemo, useState } from "react";
import { Send, Bot, Sparkles, Loader2, Zap, Leaf, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  calculateChatEnergyConsumption,
  extractTokenUsage,
} from "@/lib/utils/analysis";
import { ENERGY_PER_TOKEN } from "@/lib/constants/analysis";
import { getAgentSettingsForRequest } from "@/lib/agent-settings";
import { saveReport } from "@/lib/stores/reports-store";

const DEMO_RESPONSE_DELAY_MS = 1500;

function buildDemoSummaryContent(result: {
  result: { anomaly: { detected: boolean; issues: string[] }; webhookTriggered?: boolean };
  generatedData: { filename: string; recordCount: number; criticalValues: number; maxConsumption: number };
}): string {
  const { result: analysis, generatedData } = result;
  const anomalyLine = analysis.anomaly.detected
    ? `🔍 **Issues**: ${analysis.anomaly.issues.join('; ')}`
    : '';
  const workflowLine = analysis.webhookTriggered
    ? '✅ **Eco-Action sent to n8n**: Alert sent'
    : '';
  return `🎯 **Agentic Analysis Complete!**

📋 **Generated Report**: ${generatedData.filename}
📊 **Records Analyzed**: ${generatedData.recordCount} data points
🚨 **Critical Values Found**: ${generatedData.criticalValues} entries
📈 **Peak Consumption**: ${generatedData.maxConsumption} kWh

⚠️ **Anomalies Detected**: ${analysis.anomaly.detected ? 'YES' : 'NO'}
${anomalyLine}
${workflowLine}

💡 You can now ask: "What did you find in the synthetic report?"`;
}

interface EcoAgentProps {
  readonly aiContext?: string;
  readonly hasDocuments?: boolean;
}

export function EcoAgent({ aiContext, hasDocuments = false }: EcoAgentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  const chatBody = useMemo(() => {
    const getSettings = () => getAgentSettingsForRequest();
    return {
      get aiContext() {
        return aiContext ?? "";
      },
      get envMode() {
        return getSettings().envMode;
      },
      get allowTrigger() {
        return getSettings().allowTrigger;
      },
      get n8nWebhookTest() {
        return getSettings().n8nWebhookTest;
      },
    };
  }, [aiContext]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: "/api/chat",
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: `🌿 **I am EcoPulse AI, the intelligence engine of TerraInsight.**\n\nI can help you:\n\n• Analyze carbon footprint from energy reports\n• Identify waste reduction opportunities\n• Suggest sustainability actions (triggers green workflows)\n• Compare emissions across periods\n\nUpload a report or ask me anything about your ecological impact.`,
        },
      ],
      body: chatBody,
    });

  const { displayMessages, isExecutingTool } = useMemo(() => {
    const filtered = messages.filter(message => 
      message.role === 'user' || 
      (message.role === 'assistant' && message.content?.trim())
    );

    const hasRecentToolCall = messages.slice(-3).some(message => 
      message.role === 'assistant' && 
      message.toolInvocations && 
      message.toolInvocations.length > 0
    );
    
    return {
      displayMessages: filtered,
      isExecutingTool: hasRecentToolCall && isLoading
    };
  }, [messages, isLoading]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const demoButtonDisabled = isGeneratingDemo || isLoading || !hasDocuments;
  const demoButtonTooltip = (() => {
    if (isGeneratingDemo) return "Generating demo report…";
    if (isLoading) return "Please wait…";
    if (!hasDocuments) return "Upload a document first to run analyses and enable this demo.";
    return "Generates a full dataset to explore platform capabilities.";
  })();
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollAtRef = useRef(0);
  const SCROLL_THROTTLE_MS = 120;

  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;
    const now = Date.now();
    const elapsed = now - lastScrollAtRef.current;
    const runScroll = () => {
      lastScrollAtRef.current = Date.now();
      el.scrollIntoView({ behavior: "auto", block: "end" });
    };
    if (elapsed >= SCROLL_THROTTLE_MS || lastScrollAtRef.current === 0) {
      runScroll();
    } else {
      scrollThrottleRef.current ??= setTimeout(runScroll, SCROLL_THROTTLE_MS - elapsed);
    }
    return () => {
      if (scrollThrottleRef.current !== null) {
        clearTimeout(scrollThrottleRef.current);
        scrollThrottleRef.current = null;
      }
    };
  }, [displayMessages]);

  const energyValue = useMemo(() => {
    return displayMessages
      .filter((m) => m.role === 'assistant' && m.id !== 'welcome')
      .reduce((total, m) => {
        const usage = extractTokenUsage(m);
        return total + usage.totalTokens * ENERGY_PER_TOKEN;
      }, 0);
  }, [displayMessages]);

  const [sessionEnergy, setSessionEnergy] = useState(0);
  useEffect(() => {
    if (!isLoading) {
      setSessionEnergy(energyValue);
      return;
    }
    const t = setTimeout(() => setSessionEnergy(energyValue), 400);
    return () => clearTimeout(t);
  }, [energyValue, isLoading]);

  let statusBadge: React.ReactNode = null;
  if (isExecutingTool) {
    statusBadge = (
      <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-xs text-green-400 whitespace-nowrap">
        <Zap className="h-3 w-3 shrink-0 animate-pulse" />
        Processing Action...
      </span>
    );
  } else if (isLoading) {
    statusBadge = (
      <span className="flex items-center gap-1.5 rounded-full bg-emerald-accent/10 px-2.5 py-1 text-xs text-emerald-accent whitespace-nowrap">
        <Sparkles className="h-3 w-3 shrink-0" />
        Analyzing...
      </span>
    );
  }

  const handleDemoClick = () => {
    if (demoButtonDisabled && !hasDocuments) {
      append({
        role: "assistant",
        content: "📄 **Upload a document first.**\n\nUpload a sustainability report in the area to the left. Once analysis is ready, you can use this button to generate the demo report.",
      });
      return;
    }
    if (!demoButtonDisabled) void handleDemoGeneration();
  };

  const handleDemoGeneration = async () => {
    setIsGeneratingDemo(true);

    try {
      const { envMode, allowTrigger, n8nWebhookTest } = getAgentSettingsForRequest();
      const response = await fetch("/api/demo/generate-and-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envMode, allowTrigger, n8nWebhookTest }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        saveReport(result.result, "synthetic", result.generatedData);
        const summaryContent = buildDemoSummaryContent(result);
        append({
          role: 'user',
          content: 'Generate and analyze a demo critical waste report',
        });
        setTimeout(() => {
          append({ role: 'assistant', content: summaryContent });
        }, DEMO_RESPONSE_DELAY_MS);
        
      } else {
        append({
          role: 'assistant',
          content: '❌ **Demo Generation Failed**\n\nThere was an issue generating the synthetic report. Please try again or contact support.'
        });
      }
      
    } catch (error) {
      append({
        role: 'assistant',
        content: '❌ **Demo Generation Error**\n\nFailed to connect to demo generation service. Please check your connection and try again.'
      });
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="mb-4 flex shrink-0 items-center justify-between min-h-[52px] gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-accent/20">
            <Bot className="h-4 w-4 text-emerald-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-charcoal-100">
              AI Eco-Agent
            </h3>
            <p className="text-xs text-charcoal-500">
              Carbon footprint & waste analysis
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 min-w-[140px] justify-end">
          {sessionEnergy > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-accent/10 px-2 py-0.5 text-xs text-emerald-accent/80 tabular-nums">
              <Leaf className="h-3 w-3 shrink-0" />
              <span>{sessionEnergy.toFixed(4)} kWh</span>
            </div>
          )}
          {statusBadge}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="chat-messages-scroll flex-1 min-h-0 space-y-4 rounded-lg border border-charcoal-800 bg-charcoal-950/50 p-4 overflow-y-scroll"
      >
        {displayMessages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-3",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {m.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-accent/20">
                <Bot className="h-4 w-4 text-emerald-accent" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-lg text-sm",
                m.role === "user"
                  ? "bg-emerald-accent/20 text-charcoal-100 border border-emerald-accent/30"
                  : "bg-charcoal-800/80 text-charcoal-200 border border-charcoal-700"
              )}
            >
              <div className="px-4 py-2.5">
                <div className="whitespace-pre-wrap prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0">
                  {m.content}
                </div>
              </div>
              
              {m.role === "assistant" && m.id !== "welcome" && (() => {
                const usage = extractTokenUsage(m);
                if (usage.totalTokens > 0) {
                  return (
                    <div className="border-t border-charcoal-700/50 px-4 py-1.5 bg-charcoal-900/30">
                      <div className="flex items-center text-xs text-charcoal-500">
                        <span className="flex items-center gap-1">
                          ⚡ {calculateChatEnergyConsumption(usage.totalTokens)} kWh
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
            </div>
            {m.role === "user" && <div className="w-8 shrink-0" />}
          </div>
        ))}
        
        {isExecutingTool && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <Zap className="h-4 w-4 animate-pulse text-green-400" />
            </div>
            <div className="rounded-lg bg-green-900/30 border border-green-500/30 px-4 py-2.5 text-sm text-green-300">
              🌿 Triggering sustainability workflow...
            </div>
          </div>
        )}

        {isGeneratingDemo && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 animate-pulse">
              <Wand2 className="h-4 w-4 text-emerald-300 animate-spin" />
            </div>
            <div className="rounded-lg bg-gradient-to-r from-emerald-900/40 via-emerald-800/30 to-emerald-700/40 border border-emerald-500/40 px-4 py-2.5 text-sm text-emerald-200 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="font-medium">🔮 Agentic Analysis in Progress...</span>
              </div>
            </div>
          </div>
        )}

        
        {isLoading && !isExecutingTool && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-accent/20">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-accent" />
            </div>
            <div className="rounded-lg bg-charcoal-800/80 px-4 py-2.5 text-sm text-charcoal-400">
              Analyzing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 mb-3 space-y-1">
        <span
          className={`inline-block w-full ${demoButtonDisabled ? "cursor-not-allowed" : ""}`}
          title={demoButtonTooltip}
        >
          <Button
            onClick={handleDemoClick}
            disabled={demoButtonDisabled}
            aria-label={demoButtonTooltip}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-emerald-500 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 disabled:cursor-not-allowed"
            suppressHydrationWarning={true}
          >
            {isGeneratingDemo ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating & Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate & Analyze Demo Report
              </>
            )}
          </Button>
        </span>
        <p className="text-xs text-charcoal-500 text-center">
          Generates a full dataset to explore platform capabilities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about carbon footprint, waste, or sustainability..."
          className="flex-1 rounded-lg border border-charcoal-700 bg-charcoal-900 px-4 py-2.5 text-sm text-charcoal-100 placeholder:text-charcoal-500 focus:border-emerald-accent focus:outline-none focus:ring-1 focus:ring-emerald-accent"
          disabled={isLoading}
          suppressHydrationWarning={true}
        />
        <Button type="submit" disabled={isLoading} size="icon" suppressHydrationWarning={true}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
