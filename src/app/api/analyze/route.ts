import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/analyze
 * Ecological data parsing endpoint - prepared for PDF/CSV analysis
 * In production, integrate with document parsers (e.g., pdf-parse, csv-parse)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const results: Array<{
      filename: string;
      type: string;
      status: string;
      summary?: string;
      parsedData?: Record<string, unknown>;
    }> = [];

    for (const file of files) {
      const type = file.type;
      const filename = file.name;
      const isPdf = type === "application/pdf" || filename.endsWith(".pdf");
      const isCsv =
        type === "text/csv" ||
        filename.endsWith(".csv") ||
        type.includes("spreadsheet");

      if (!isPdf && !isCsv) {
        results.push({
          filename,
          type,
          status: "skipped",
          summary: "Unsupported format. Use PDF or CSV.",
        });
        continue;
      }

      // Simulate parsing - in production, use actual parsers
      const content = await file.text().catch(() => "");
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      if (isPdf) {
        // PDF binary - text() may not work well; simulate
        results.push({
          filename,
          type: "energy/carbon_report",
          status: "parsed",
          summary: `Energy/Carbon report detected. Ready for AI analysis.`,
          parsedData: {
            detectedFormat: "PDF",
            estimatedPages: Math.ceil((file.size || 1024) / 4096),
            contentType: "ecological_report",
          },
        });
      } else if (isCsv) {
        const lines = content.split("\n").filter((l) => l.trim());
        const headers = lines[0]?.split(",").map((h) => h.trim()) || [];

        results.push({
          filename,
          type: "energy/carbon_report",
          status: "parsed",
          summary: `CSV with ${lines.length} rows parsed. Columns: ${headers.join(", ")}`,
          parsedData: {
            detectedFormat: "CSV",
            rowCount: lines.length - 1,
            headers,
            sampleRow: lines[1]?.split(",") || [],
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Analysis complete",
      results,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze files" },
      { status: 500 }
    );
  }
}
