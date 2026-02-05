"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight, FileDown } from "lucide-react";
import { getStoredReports } from "@/lib/stores/reports-store";
import { downloadPdfReport } from "@/lib/utils/pdf-download";
import { AnalysisDetailCard } from "@/components/dashboard/analysis-detail-card";
import type { StoredReport } from "@/lib/types/analysis";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportsPage() {
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<StoredReport | null>(null);

  useEffect(() => {
    setReports(getStoredReports());
  }, []);

  useEffect(() => {
    const refresh = () => setReports(getStoredReports());
    globalThis.addEventListener("storage", refresh);
    globalThis.addEventListener("terra-reports-updated", refresh);
    return () => {
      globalThis.removeEventListener("storage", refresh);
      globalThis.removeEventListener("terra-reports-updated", refresh);
    };
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!selectedReport) return;
    try {
      const baseName = selectedReport.result.filename.replace(/\.[^.]+$/, '');
      const filename = `terrainsight-${baseName}-report.pdf`;
      await downloadPdfReport([selectedReport.result], filename);
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  }, [selectedReport]);

  return (
    <div className="eco-grid-bg min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal-100">Reports</h1>
            <p className="mt-1 text-charcoal-500">
              View and manage your ecological impact reports
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card className="border-charcoal-800 bg-charcoal-900/50">
                <CardHeader>
                  <CardTitle>Report History</CardTitle>
                  <CardDescription>
                    Click a report to view its analysis details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <FileText className="mb-4 h-16 w-16 text-charcoal-600" />
                      <p className="text-charcoal-400">No reports yet</p>
                      <p className="mt-1 text-sm text-charcoal-500">
                        Upload files or generate a synthetic crisis report from
                        Impact Overview
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {reports.map((report) => (
                        <li key={report.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                              selectedReport?.id === report.id
                                ? "border-emerald-500/50 bg-emerald-500/10 text-charcoal-100"
                                : "border-charcoal-700 bg-charcoal-800/30 text-charcoal-300 hover:bg-charcoal-800 hover:border-charcoal-600"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {report.result.filename}
                              </p>
                              <p className="text-xs text-charcoal-500">
                                {formatDate(report.createdAt)}
                                {report.source === "synthetic" && (
                                  <span className="ml-1 text-amber-400">
                                    · Synthetic
                                  </span>
                                )}
                              </p>
                            </div>
                            <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-charcoal-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="border-charcoal-800 bg-charcoal-900/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Analysis Details</CardTitle>
                      <CardDescription>
                        {selectedReport
                          ? "Full analysis summary and anomaly detection results"
                          : "Select a report from the history to view details"}
                      </CardDescription>
                    </div>
                    {selectedReport && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={selectedReport.result.status !== "success"}
                        title={
                          selectedReport.result.status === "success"
                            ? "Download PDF report"
                            : "Export is only available for successful analyses"
                        }
                        className="shrink-0"
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedReport ? (
                    <AnalysisDetailCard
                      result={selectedReport.result}
                      source={selectedReport.source}
                      createdAt={selectedReport.createdAt}
                      generatedData={selectedReport.generatedData}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <FileText className="mb-4 h-12 w-12 text-charcoal-600" />
                      <p className="text-charcoal-400">
                        No report selected
                      </p>
                      <p className="mt-1 text-sm text-charcoal-500">
                        Click a report in the history to view its details
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
