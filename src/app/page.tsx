"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { saveReport } from "@/lib/stores/reports-store";

export default function DashboardPage() {
  const [isGeneratingCrisis, setIsGeneratingCrisis] = useState(false);

  const handleGenerateCrisisReport = async () => {
    setIsGeneratingCrisis(true);
    try {
      const response = await fetch("/api/demo/generate-and-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        saveReport(data.result, "synthetic", data.generatedData);
      }
    } catch (error) {
      console.error("Crisis report generation failed:", error);
    } finally {
      setIsGeneratingCrisis(false);
    }
  };

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
            <Button
              onClick={handleGenerateCrisisReport}
              disabled={isGeneratingCrisis}
              suppressHydrationWarning
              className="shrink-0 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white border-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
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
          </div>

          <DashboardClient />
        </div>
      </main>
    </div>
  );
}
