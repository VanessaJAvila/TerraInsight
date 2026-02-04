"use client";

import { useState, useCallback } from "react";
import { ProfessionalDropzone } from "./professional-dropzone";
import { EcoAgent } from "./eco-agent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResult } from '@/lib/types/analysis';
import { convertAnalysisResultsToContext } from '@/lib/utils/analysis';

interface DashboardClientProps {
  readonly aiContext?: string;
}

export function DashboardClient({ aiContext }: DashboardClientProps) {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [contextFromFiles, setContextFromFiles] = useState<string>("");

  const handleAnalysisComplete = useCallback((results: AnalysisResult[]) => {
    setAnalysisResults(results);
    
    const newContext = convertAnalysisResultsToContext(results);
    
    setContextFromFiles(newContext);
    console.log("Professional analysis complete:", results.length, "files processed");
  }, []);

  const combinedContext = [aiContext, contextFromFiles]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const successfulFiles = analysisResults.filter(r => r.status === 'success');
  const anomaliesDetected = analysisResults.filter(r => r.anomaly.detected);
  const totalEnergyEstimate = successfulFiles.reduce((sum, r) => sum + r.energyEstimate, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="border-charcoal-800 bg-charcoal-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Professional File Analysis
              {successfulFiles.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-emerald-accent/20 px-2 py-1 text-xs text-emerald-accent">
                    {successfulFiles.length} file{successfulFiles.length > 1 ? 's' : ''} analyzed
                  </span>
                  {anomaliesDetected.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
                      {anomaliesDetected.length} anomal{anomaliesDetected.length > 1 ? 'ies' : 'y'}
                    </span>
                  )}
                  {totalEnergyEstimate > 0 && (
                    <span className="inline-flex items-center rounded-full bg-emerald-accent/10 px-2 py-1 text-xs text-emerald-accent">
                      ⚡ {totalEnergyEstimate.toFixed(4)} kWh
                    </span>
                  )}
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Upload sustainability reports for AI-powered analysis and anomaly detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfessionalDropzone 
              onAnalysisComplete={handleAnalysisComplete}
            />
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="h-full border-charcoal-800 bg-charcoal-900/50">
          <CardContent className="pt-6">
            <EcoAgent aiContext={combinedContext} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}