import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResult } from "@/lib/types/analysis";
import {
  detectTextAnomalies,
  generateAnalysisSummary,
  getFileType,
  calculateFileEnergyEstimate,
} from "@/lib/utils/analysis";
import { MAX_FILE_SIZE_BYTES, MAX_SAMPLE_ROWS } from "@/lib/constants/analysis";
import { triggerN8nWebhook, resolveN8nWebhookUrl } from "@/lib/webhook";

class PdfParseError extends Error {
  constructor(
    message: string,
    public readonly detail: string,
    public readonly filename: string
  ) {
    super(message);
    this.name = 'PdfParseError';
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;

type EnvMode = "test" | "prod";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const envModeRaw = (formData.get("envMode") as string)?.trim()?.toLowerCase();
    const envMode: EnvMode = envModeRaw === "prod" ? "prod" : "test";
    const allowTrigger = formData.get("allowTrigger") === "true";
    const n8nWebhookTest = (formData.get("n8nWebhookTest") as string)?.trim() || undefined;

    const { url: webhookUrl, error: urlError } = resolveN8nWebhookUrl(
      envMode as "test" | "prod",
      n8nWebhookTest
    );
    if (envMode === "prod" && urlError) {
      return NextResponse.json(
        { error: urlError },
        { status: 422 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const webhookConfig = {
      url: webhookUrl,
      allowTrigger,
      envMode,
    };

    const results: AnalysisResult[] = [];
    let lastWebhookResult: { triggered: boolean; envMode: string; status: number; detail?: string } = {
      triggered: false,
      envMode,
      status: 0,
    };

    for (const file of files) {
      try {
        const { result, webhookResult } = await processFile(file, webhookConfig);
        results.push(result);
        if (webhookResult) lastWebhookResult = webhookResult;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        const errDetail = error instanceof PdfParseError ? error.detail : undefined;
        results.push({
          filename: file.name,
          status: "error",
          fileType: getFileType(file.name),
          extractedText: "",
          metadata: { fileSize: file.size },
          anomaly: { detected: false, severity: "low", issues: [], recommendations: [] },
          summary: "Processing failed",
          energyEstimate: 0,
          error: errDetail ? `${errMsg}: ${errDetail}` : errMsg,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Analysis complete",
      results,
      totalFiles: files.length,
      anomaliesDetected: results.filter((r) => r.anomaly.detected).length,
      webhook: {
        triggered: lastWebhookResult.triggered,
        envMode: lastWebhookResult.envMode,
        status: lastWebhookResult.status,
        detail: lastWebhookResult.detail,
      },
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze files" },
      { status: 500 }
    );
  }
}

type WebhookConfig = {
  url: string | null;
  allowTrigger: boolean;
  envMode: EnvMode;
};

async function processFile(
  file: File,
  webhookConfig: WebhookConfig
): Promise<{
  result: AnalysisResult;
  webhookResult?: { triggered: boolean; envMode: string; status: number; detail?: string };
}> {
  const filename = file.name;
  const fileType = getFileType(filename);
  const fileSize = file.size;

  let extractedText = "";
  let metadata: any = { fileSize };

  if (fileType === "pdf") {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File too large: max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
    }
    const isPdf = file.type === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      throw new Error("Invalid PDF: type or extension mismatch");
    }
    const pdfData = await parsePDF(file, filename);
    extractedText = pdfData.text;
    metadata.pageCount = pdfData.pageCount;
  } else if (fileType === "csv") {
    const csvData = await parseCSV(file);
    extractedText = csvData.text;
    metadata.rowCount = csvData.rowCount;
    metadata.headers = csvData.headers;
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  const anomaly = detectTextAnomalies(extractedText, metadata);
  const summary = generateAnalysisSummary(fileType, metadata, anomaly);
  const energyEstimate = calculateFileEnergyEstimate(fileSize, anomaly.detected);

  let webhookTriggered = false;
  let webhookResult: { triggered: boolean; envMode: string; status: number; detail?: string } | undefined;

  if (anomaly.detected && webhookConfig.allowTrigger && webhookConfig.url) {
    const payload = {
      action: "investigate_file_anomaly",
      details: `File "${filename}" analysis detected: ${anomaly.issues.join(", ")}`,
      severity: anomaly.severity,
      timestamp: new Date().toISOString(),
      source: "TerraInsight File Analysis",
      recommendations: anomaly.recommendations,
    };
    const triggerResult = await triggerN8nWebhook(
      webhookConfig.url,
      payload,
      webhookConfig.envMode
    );
    webhookTriggered = triggerResult.ok;
    webhookResult = {
      triggered: triggerResult.ok,
      envMode: webhookConfig.envMode,
      status: triggerResult.status,
      detail: triggerResult.detail,
    };
  } else if (anomaly.detected && webhookConfig.allowTrigger && !webhookConfig.url) {
    console.log("N8N SKIPPED: no webhook configured");
  }

  return {
    result: {
      filename,
      status: "success",
      fileType,
      extractedText,
      metadata,
      anomaly,
      webhookTriggered,
      summary,
      energyEstimate,
    },
    webhookResult,
  };
}

async function parsePDF(file: File, filename: string): Promise<{ text: string; pageCount: number }> {
  let data: ArrayBuffer;
  try {
    data = await file.arrayBuffer();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to read file';
    console.error(`PDF parse failed: ${filename} - ${msg}`);
    throw new PdfParseError('Failed to read PDF file', msg, filename);
  }

  const { extractText, getDocumentProxy } = await import('unpdf');

  try {
    const pdf = await getDocumentProxy(new Uint8Array(data));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    console.log(`PDF parsed OK: ${filename} (${text?.length ?? 0} chars)`);
    return {
      text: text ?? '',
      pageCount: totalPages ?? 0,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown parse error';
    console.error(`PDF parse failed: ${filename} - ${msg}`, err);
    throw new PdfParseError('PDF parsing failed', msg, filename);
  }
}

async function parseCSV(file: File): Promise<{ text: string; rowCount: number; headers: string[] }> {
  const Papa = (await import('papaparse')).default;
  
  const content = await file.text();
  const parsed = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const headers = parsed.meta.fields || [];
  const rows = parsed.data as Record<string, any>[];

  let text = `CSV Analysis Summary:\n`;
  text += `File: ${file.name}\n`;
  text += `Headers: ${headers.join(', ')}\n`;
  text += `Total Rows: ${rows.length}\n\n`;

  if (rows.length > 0) {
    text += `Sample Data (first ${Math.min(MAX_SAMPLE_ROWS, rows.length)} rows):\n`;
    rows.slice(0, MAX_SAMPLE_ROWS).forEach((row, index) => {
      text += `Row ${index + 1}:\n`;
      headers.forEach(header => {
        text += `  ${header}: ${row[header] || 'N/A'}\n`;
      });
      text += '\n';
    });
  }

  return {
    text,
    rowCount: rows.length,
    headers,
  };
}



