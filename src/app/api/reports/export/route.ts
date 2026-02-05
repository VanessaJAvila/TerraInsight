import { NextRequest, NextResponse } from "next/server";
import { generateAnalysisReportPDF } from "@/lib/utils/pdf-report";
import type { AnalysisResult } from "@/lib/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 30;

function normalizeForPdf(r: AnalysisResult): AnalysisResult {
  const anomaly = r.anomaly ?? { detected: false, severity: "medium" as const, issues: [], recommendations: [] };
  return {
    ...r,
    filename: String(r?.filename ?? "Report"),
    summary: String(r?.summary ?? "No summary."),
    energyEstimate: Number(r?.energyEstimate) || 0,
    metadata: r?.metadata && typeof r.metadata === "object" ? r.metadata : { fileSize: 0 },
    anomaly: {
      detected: Boolean(anomaly.detected),
      severity: anomaly.severity === "high" || anomaly.severity === "low" ? anomaly.severity : "medium",
      issues: Array.isArray(anomaly.issues) ? anomaly.issues.map(String) : [],
      recommendations: Array.isArray(anomaly.recommendations) ? anomaly.recommendations.map(String) : [],
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const results = body?.results as AnalysisResult[] | undefined;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "No analysis results provided" },
        { status: 400 }
      );
    }

    const successfulResults = results.filter((r) => r?.status === "success");
    if (successfulResults.length === 0) {
      return NextResponse.json(
        { error: "No successful analysis results to export" },
        { status: 400 }
      );
    }

    const normalized = successfulResults.map(normalizeForPdf);
    const pdfBuffer = await generateAnalysisReportPDF(normalized);
    const filename = `terrainsight-report-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (process.env.NODE_ENV === "development") {
      console.error("[reports/export] PDF generation failed:", err.message, err.stack);
    }
    const detail = process.env.NODE_ENV === "development" ? err.message : undefined;
    return NextResponse.json(
      { error: "Failed to generate PDF report", ...(detail && { detail }) },
      { status: 500 }
    );
  }
}
