"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { saveReport } from "@/lib/stores/reports-store";
import { getAgentSettingsForRequest } from "@/lib/agent-settings";
import type { AnalysisResult } from "@/lib/types/analysis";

export default function DashboardPage() {
  const [isGeneratingCrisis, setIsGeneratingCrisis] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [crisisFeedback, setCrisisFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const hasNoDocuments = analysisResults.length === 0;
  const crisisButtonDisabled = isGeneratingCrisis || hasNoDocuments;

  const crisisButtonTooltip = (() => {
    if (isGeneratingCrisis) return "Generating crisis report…";
    if (hasNoDocuments) return "Upload a document first to run analyses and enable this demo.";
    return "Generate a focused crisis report to demo critical alerting.";
  })();

  const handleGenerateCrisisReport = useCallback(async () => {
    setCrisisFeedback(null);
    setIsGeneratingCrisis(true);
    try {
      const { envMode, allowTrigger, n8nWebhookTest } = getAgentSettingsForRequest();
      const response = await fetch("/api/demo/generate-and-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envMode, allowTrigger, n8nWebhookTest, crisis: true }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        saveReport(data.result, "crisis", data.generatedData);
        setAnalysisResults((prev) => [data.result, ...prev]);
        setCrisisFeedback({
          type: "success",
          message: "Crisis report generated, analyzed, and alert workflow triggered.",
        });
        setTimeout(() => setCrisisFeedback(null), 5000);
      } else {
        setCrisisFeedback({
          type: "error",
          message: data?.error ?? "Failed to generate or analyze the crisis report.",
        });
      }
    } catch {
      setCrisisFeedback({
        type: "error",
        message: "Failed to generate crisis report. Please try again.",
      });
    } finally {
      setIsGeneratingCrisis(false);
    }
  }, []);

  const handleCrisisClick = useCallback(() => {
    if (crisisButtonDisabled && hasNoDocuments) {
      setCrisisFeedback({
        type: "info",
        message: "Upload a sustainability report in the area below first. Once analysis is ready, you can generate the crisis report demo.",
      });
      setTimeout(() => setCrisisFeedback(null), 6000);
      return;
    }
    if (!crisisButtonDisabled) void handleGenerateCrisisReport();
  }, [crisisButtonDisabled, hasNoDocuments, handleGenerateCrisisReport]);

  return (
    <div className="eco-grid-bg min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-100">
                Impact Overview
              </h1>
              <p className="mt-1 text-charcoal-500">
                Upload reports and analyze your ecological footprint
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`inline-block ${crisisButtonDisabled ? "cursor-not-allowed" : ""}`}
                title={crisisButtonTooltip}
              >
                <Button
                  onClick={handleCrisisClick}
                  disabled={crisisButtonDisabled}
                  suppressHydrationWarning
                  aria-label={crisisButtonTooltip}
                  className="shrink-0 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white border-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {isGeneratingCrisis ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Crisis Report...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Synthetic Crisis Report
                    </>
                  )}
                </Button>
              </span>
              <p className="text-xs text-charcoal-500 text-right max-w-sm">
                Simulates a high-priority environmental emergency to test automated workflows.
              </p>
              {crisisFeedback && (() => {
                let feedbackClass = "text-red-400";
                if (crisisFeedback.type === "success") feedbackClass = "text-emerald-400";
                else if (crisisFeedback.type === "info") feedbackClass = "text-charcoal-400";
                return (
                  <output
                    className={`block max-w-sm text-right text-sm ${feedbackClass}`}
                    aria-live="polite"
                  >
                    {crisisFeedback.message}
                  </output>
                );
              })()}
            </div>
          </div>

          <DashboardClient
            analysisResults={analysisResults}
            setAnalysisResults={setAnalysisResults}
          />
        </div>
      </main>
    </div>
  );
}
