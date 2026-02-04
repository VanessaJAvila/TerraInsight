"use client";

import { FileText, FileSpreadsheet, File, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/types/analysis";
import { getSeverityColor } from "@/lib/utils/analysis";

interface AnalysisDetailCardProps {
  readonly result: AnalysisResult;
  readonly source?: "manual" | "synthetic";
  readonly generatedData?: {
    filename: string;
    recordCount: number;
    criticalValues: number;
    maxConsumption: number;
  };
  readonly className?: string;
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "pdf":
      return <FileText className="h-8 w-8 text-red-400" />;
    case "csv":
    case "xlsx":
      return <FileSpreadsheet className="h-8 w-8 text-emerald-400" />;
    default:
      return <File className="h-8 w-8 text-charcoal-400" />;
  }
}

export function AnalysisDetailCard({
  result,
  source,
  generatedData,
  className,
}: AnalysisDetailCardProps) {
  const fileSize = result.metadata.fileSize
    ? `${(result.metadata.fileSize / 1024).toFixed(1)} KB`
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-charcoal-700 bg-charcoal-800/50 p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {getFileIcon(result.fileType)}
        <div>
          <p className="text-sm font-medium text-charcoal-200">{result.filename}</p>
          <div className="flex items-center gap-3 text-xs text-charcoal-400">
            {fileSize && <span>{fileSize}</span>}
            {source && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  source === "synthetic"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-charcoal-600 text-charcoal-300"
                )}
              >
                {source === "synthetic" ? "Synthetic" : "Manual"}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-charcoal-300">{result.summary}</p>

      <div className="flex flex-wrap gap-4 text-xs text-charcoal-400">
        {result.metadata.pageCount != null && (
          <span>📄 {result.metadata.pageCount} pages</span>
        )}
        {result.metadata.rowCount != null && (
          <span>📊 {result.metadata.rowCount} rows</span>
        )}
        {generatedData && (
          <>
            <span>📈 {generatedData.recordCount} records</span>
            <span>🚨 {generatedData.criticalValues} critical</span>
            <span>⚡ Peak: {generatedData.maxConsumption} kWh</span>
          </>
        )}
      </div>

      {result.anomaly.detected && (
        <div className="rounded-lg border-l-4 border-yellow-400 bg-charcoal-900/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle
              className={cn("h-4 w-4", getSeverityColor(result.anomaly.severity))}
            />
            <span className="text-sm font-medium text-charcoal-200">
              Environmental Issues Detected ({result.anomaly.severity} priority)
            </span>
            {result.webhookTriggered && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                ✅ Workflow Triggered
              </span>
            )}
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <p className="text-charcoal-400 mb-1">Issues:</p>
              <ul className="list-disc list-inside text-charcoal-300 space-y-1">
                {result.anomaly.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
            {result.anomaly.recommendations.length > 0 && (
              <div>
                <p className="text-charcoal-400 mb-1">Recommendations:</p>
                <ul className="list-disc list-inside text-emerald-accent space-y-1">
                  {result.anomaly.recommendations.map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-charcoal-700 text-xs">
        <span className="text-charcoal-400">Energy Estimate</span>
        <span className="flex items-center gap-1 text-emerald-accent font-medium">
          ⚡ {result.energyEstimate} kWh
        </span>
      </div>
    </div>
  );
}
