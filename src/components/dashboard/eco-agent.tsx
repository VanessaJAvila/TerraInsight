"use client";

import { useChat } from "ai/react";
import { useRef, useEffect, useMemo, useState } from "react";
import { Send, Bot, Sparkles, Loader2, Zap, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ENERGY_PER_TOKEN = 0.0001;
const CHARS_PER_TOKEN_ESTIMATE = 4;

function calculateEnergyConsumption(totalTokens: number): string {
  if (!totalTokens || totalTokens <= 0) return "0.0000";
  return (totalTokens * ENERGY_PER_TOKEN).toFixed(4);
}

function extractTokenUsage(message: any): { totalTokens: number; estimated: boolean } {
  if (message.usage?.totalTokens) {
    return { totalTokens: message.usage.totalTokens, estimated: false };
  }
  
  if (message.content && message.role === 'assistant') {
    const estimatedTokens = Math.ceil(message.content.length / CHARS_PER_TOKEN_ESTIMATE);
    return { totalTokens: estimatedTokens, estimated: true };
  }
  
  return { totalTokens: 0, estimated: false };
}

function EnergyIndicator({ message }: { message: any }) {
  const usage = extractTokenUsage(message);
  
  if (usage.totalTokens === 0) return null;
  
  return (
    <div className="px-4 py-1 bg-charcoal-900/10">
      <div className="flex justify-end">
        <span className="text-[10px] text-charcoal-600 flex items-center gap-1">
          <span className="opacity-50">⚡</span>
          <span className="font-mono">{calculateEnergyConsumption(usage.totalTokens)} kWh</span>
          {usage.estimated && <span className="text-charcoal-700">*</span>}
        </span>
      </div>
    </div>
  );
}

interface EcoAgentProps {
  readonly aiContext?: string;
}

export function EcoAgent({ aiContext }: EcoAgentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionEnergy, setSessionEnergy] = useState(0);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: `🌿 **Welcome to EcoPulse AI**\n\nI'm your ecological impact analyst. I can help you:\n\n• Analyze carbon footprint from energy reports\n• Identify waste reduction opportunities\n• Suggest sustainability actions (triggers green workflows)\n• Compare emissions across periods\n\nUpload a report or ask me anything about your ecological impact.`,
        },
      ],
      body: aiContext ? { aiContext } : {},
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  useEffect(() => {
    const totalTokens = displayMessages
      .filter(message => message.role === 'assistant' && message.id !== 'welcome')
      .reduce((sum, message) => {
        const usage = extractTokenUsage(message);
        return sum + usage.totalTokens;
      }, 0);
    
    setSessionEnergy(totalTokens * ENERGY_PER_TOKEN);
  }, [displayMessages]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-accent/20">
            <Bot className="h-4 w-4 text-emerald-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-charcoal-100">
              AI Eco-Agent
            </h3>
            <p className="text-xs text-charcoal-500">
              Carbon footprint & waste analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Session Energy Summary - Clean & Simple */}
          {sessionEnergy > 0 && (
            <div 
              className="flex items-center gap-1.5 rounded-full bg-emerald-accent/10 px-2.5 py-1 text-xs text-emerald-accent/80"
              title={`Session consumption: ${sessionEnergy.toFixed(4)} kWh`}
            >
              <Leaf className="h-3 w-3" />
              <span className="font-medium">{sessionEnergy.toFixed(4)} kWh</span>
            </div>
          )}

          {/* Loading indicators */}
          {isExecutingTool ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-xs text-green-400">
              <Zap className="h-3 w-3 animate-pulse" />
              Processing Action...
            </span>
          ) : isLoading && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-accent/10 px-2.5 py-1 text-xs text-emerald-accent">
              <Sparkles className="h-3 w-3" />
              Analyzing...
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-charcoal-800 bg-charcoal-950/50 p-4 min-h-[280px] max-h-[400px]">
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
              
              {/* Energy consumption indicator */}
              {m.role === "assistant" && m.content && m.id !== "welcome" && (
                <EnergyIndicator message={m} />
              )}
            </div>
            {m.role === "user" && <div className="w-8 shrink-0" />}
          </div>
        ))}
        
        {/* Tool execution indicator */}
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

        
        {/* Regular loading indicator (when not executing tools) */}
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

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
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
