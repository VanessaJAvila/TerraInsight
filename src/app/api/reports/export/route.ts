import { NextRequest, NextResponse } from "next/server";
import { generateAnalysisReportPDF } from "@/lib/utils/pdf-report";
import type { AnalysisResult } from "@/lib/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const results = body.results as AnalysisResult[];

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "No analysis results provided" },
        { status: 400 }
      );
    }

    const successfulResults = results.filter((r) => r.status === "success");
    if (successfulResults.length === 0) {
      return NextResponse.json(
        { error: "No successful analysis results to export" },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateAnalysisReportPDF(successfulResults);
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
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("PDF export error:", msg, stack);
    const detail = process.env.NODE_ENV === "development" ? msg : undefined;
    return NextResponse.json(
      { error: "Failed to generate PDF report", ...(detail && { detail }) },
      { status: 500 }
    );
  }
}
