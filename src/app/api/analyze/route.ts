import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResult } from "@/lib/types/analysis";
import {
  detectTextAnomalies,
  generateAnalysisSummary,
  getFileType,
  calculateFileEnergyEstimate,
} from "@/lib/utils/analysis";
import { MAX_FILE_SIZE_BYTES, MAX_SAMPLE_ROWS } from "@/lib/constants/analysis";
import {
  triggerN8nWebhook,
  resolveN8nWebhookUrl,
  type EnvMode,
} from "@/lib/webhook";

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

type WebhookResultSummary = {
  triggered: boolean;
  envMode: string;
  status: number;
  detail?: string;
};

type WebhookConfig = {
  url: string | null;
  allowTrigger: boolean;
  envMode: EnvMode;
};

function parseN8nWebhookErrorHint(detail: string | undefined): string | null {
  if (!detail || typeof detail !== "string") return null;
  try {
    const parsed = JSON.parse(detail) as { hint?: string; message?: string };
    if (parsed.hint && typeof parsed.hint === "string") return parsed.hint;
    if (parsed.message && typeof parsed.message === "string") return parsed.message;
  } catch {
    /* not JSON */
  }
  return null;
}

function parseAnalyzeFormData(formData: FormData): {
  files: File[];
  envMode: EnvMode;
  allowTrigger: boolean;
  n8nWebhookTest?: string;
} {
  const files = formData.getAll("files") as File[];
  const envModeRaw = (formData.get("envMode") as string)?.trim()?.toLowerCase();
  const envMode: EnvMode = envModeRaw === "prod" ? "prod" : "test";
  const allowTrigger = formData.get("allowTrigger") === "true";
  const n8nWebhookTest = (formData.get("n8nWebhookTest") as string)?.trim() || undefined;
  return { files, envMode, allowTrigger, n8nWebhookTest };
}

function buildFileErrorResult(file: File, error: unknown): AnalysisResult {
  const errMsg = error instanceof Error ? error.message : "Unknown error";
  const errDetail = error instanceof PdfParseError ? error.detail : undefined;
  return {
    filename: file.name,
    status: "error",
    fileType: getFileType(file.name),
    extractedText: "",
    metadata: { fileSize: file.size },
    anomaly: { detected: false, severity: "low", issues: [], recommendations: [] },
    summary: "Processing failed",
    energyEstimate: 0,
    error: errDetail ? `${errMsg}: ${errDetail}` : errMsg,
  };
}

function determineSkipReason(
  lastWebhookResult: WebhookResultSummary,
  anomaliesCount: number,
  allowTrigger: boolean,
  webhookUrl: string | null
): string | undefined {
  if (lastWebhookResult.triggered || anomaliesCount === 0) {
    return undefined;
  }
  if (!allowTrigger) {
    return "Workflow triggers disabled — enable in Integration Hub";
  }
  if (!webhookUrl) {
    return "No webhook URL — set N8N_WEBHOOK_TEST in .env or Test URL in Integration Hub";
  }
  if (lastWebhookResult.status && lastWebhookResult.status >= 400) {
    const hint = parseN8nWebhookErrorHint(lastWebhookResult.detail);
    const base = hint ?? lastWebhookResult.detail ?? `Webhook returned ${lastWebhookResult.status}`;
    return lastWebhookResult.status === 404 && hint
      ? `${base} To have the webhook always listening (no need to click in n8n), activate the workflow in n8n.`
      : base;
  }
  return undefined;
}

function buildSuccessResponse(
  results: AnalysisResult[],
  files: File[],
  lastWebhookResult: WebhookResultSummary,
  skipReason: string | undefined
) {
  const webhookStatus = {
    triggered: lastWebhookResult.triggered,
    envMode: lastWebhookResult.envMode,
    status: lastWebhookResult.status,
    detail: lastWebhookResult.detail,
    ...(skipReason && { skipReason }),
  };
  return NextResponse.json({
    success: true,
    message: "Analysis complete",
    results,
    totalFiles: files.length,
    anomaliesDetected: results.filter((r) => r.anomaly.detected).length,
    webhook: webhookStatus,
    webhookStatus,
  });
}

async function processAllFiles(
  files: File[],
  webhookConfig: WebhookConfig
): Promise<{ results: AnalysisResult[]; lastWebhookResult: WebhookResultSummary }> {
  const results: AnalysisResult[] = [];
  let lastWebhookResult: WebhookResultSummary = {
    triggered: false,
    envMode: webhookConfig.envMode,
    status: 0,
  };
  for (const file of files) {
    try {
      const { result, webhookResult } = await processFile(file, webhookConfig);
      results.push(result);
      if (webhookResult) lastWebhookResult = webhookResult;
    } catch (error) {
      results.push(buildFileErrorResult(file, error));
    }
  }
  return { results, lastWebhookResult };
}

function validateRequest(files: File[], envMode: EnvMode, urlError: string | undefined) {
  if (envMode === "prod" && urlError) {
    return NextResponse.json({ error: urlError }, { status: 422 });
  }
  if (!files?.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  return null;
}

function handleError(error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  if (process.env.NODE_ENV === "development") {
    console.error("[TerraInsight/analyze] Analysis failed:", err.message, err.stack);
  }
  return NextResponse.json(
    { error: "Failed to analyze files", ...(process.env.NODE_ENV === "development" && { detail: err.message }) },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const { files, envMode, allowTrigger, n8nWebhookTest } = parseAnalyzeFormData(formData);

    const { url: webhookUrl, error: urlError } = resolveN8nWebhookUrl(envMode, n8nWebhookTest);
    const validationError = validateRequest(files, envMode, urlError);
    if (validationError) return validationError;

    const webhookConfig: WebhookConfig = { url: webhookUrl, allowTrigger, envMode };
    const { results, lastWebhookResult } = await processAllFiles(files, webhookConfig);

    const anomaliesCount = results.filter((r) => r.anomaly.detected).length;
    const skipReason = determineSkipReason(lastWebhookResult, anomaliesCount, allowTrigger, webhookUrl);

    return buildSuccessResponse(results, files, lastWebhookResult, skipReason);
  } catch (error) {
    return handleError(error);
  }
}

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
  let metadata: { fileSize: number; pageCount?: number; rowCount?: number; headers?: string[] } = { fileSize };

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
    throw new PdfParseError('Failed to read PDF file', msg, filename);
  }

  const { extractText, getDocumentProxy } = await import('unpdf');

  try {
    const pdf = await getDocumentProxy(new Uint8Array(data));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    return {
      text: text ?? '',
      pageCount: totalPages ?? 0,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown parse error';
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
