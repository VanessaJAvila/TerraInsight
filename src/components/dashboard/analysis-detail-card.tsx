"use client";

import { FileText, FileSpreadsheet, File, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult, ReportSource } from "@/lib/types/analysis";
import { getSeverityColor } from "@/lib/utils/analysis";

interface AnalysisDetailCardProps {
  readonly result: AnalysisResult;
  readonly source?: ReportSource;
  readonly createdAt?: string;
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnalysisDetailCard({
  result,
  source,
  createdAt,
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
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-charcoal-200">{result.filename}</p>
            {result.webhookTriggered === true && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                Eco-Action Sent to n8n
              </span>
            )}
            {result.anomaly.detected && result.webhookTriggered !== true && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400">
                n8n Connection Pending
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-400">
            {fileSize && <span>{fileSize}</span>}
            {createdAt && <span>{formatDate(createdAt)}</span>}
            {source && (() => {
              let badgeClass = "bg-slate-500/20 text-slate-400";
              let label = "Manual";
              if (source === "crisis") {
                badgeClass = "bg-rose-500/20 text-rose-400";
                label = "CRISIS";
              } else if (source === "synthetic") {
                badgeClass = "bg-amber-500/20 text-amber-400";
                label = "Synthetic";
              }
              return (
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", badgeClass)}>
                  {label}
                </span>
              );
            })()}
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
