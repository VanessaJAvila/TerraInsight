import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResult, AnomalyDetection } from '@/lib/types/analysis';
import { 
  detectTextAnomalies, 
  generateAnalysisSummary, 
  getFileType,
  calculateFileEnergyEstimate
} from '@/lib/utils/analysis';
import { DEFAULT_WEBHOOK_URL, MAX_SAMPLE_ROWS } from '@/lib/constants/analysis';

export const runtime = "nodejs";
export const maxDuration = 60;

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

    const results: AnalysisResult[] = [];

    for (const file of files) {
      try {
        const result = await processFile(file);
        results.push(result);
      } catch (error) {
        results.push({
          filename: file.name,
          status: 'error',
          fileType: getFileType(file.name),
          extractedText: '',
          metadata: { fileSize: file.size },
          anomaly: { detected: false, severity: 'low', issues: [], recommendations: [] },
          summary: 'Processing failed',
          energyEstimate: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis complete',
      results,
      totalFiles: files.length,
      anomaliesDetected: results.filter(r => r.anomaly.detected).length,
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze files' },
      { status: 500 }
    );
  }
}

async function processFile(file: File): Promise<AnalysisResult> {
  const filename = file.name;
  const fileType = getFileType(filename);
  const fileSize = file.size;

  let extractedText = '';
  let metadata: any = { fileSize };

  if (fileType === 'pdf') {
    const pdfData = await parsePDF(file);
    extractedText = pdfData.text;
    metadata.pageCount = pdfData.pageCount;
  } else if (fileType === 'csv') {
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
  if (anomaly.detected) {
    webhookTriggered = await triggerWebhook(filename, anomaly);
  }

  return {
    filename,
    status: 'success',
    fileType,
    extractedText,
    metadata,
    anomaly,
    webhookTriggered,
    summary,
    energyEstimate,
  };
}

async function parsePDF(file: File): Promise<{ text: string; pageCount: number }> {
  const pdfParse = (await import('pdf-parse')).default;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdfParse(buffer);
  
  return {
    text: data.text,
    pageCount: data.numpages,
  };
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


async function triggerWebhook(filename: string, anomaly: AnomalyDetection): Promise<boolean> {
  try {
    const payload = {
      action: 'investigate_file_anomaly',
      details: `File "${filename}" analysis detected: ${anomaly.issues.join(', ')}`,
      severity: anomaly.severity,
      timestamp: new Date().toISOString(),
      source: 'TerraInsight File Analysis',
      recommendations: anomaly.recommendations,
    };

    const response = await fetch(DEFAULT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook trigger failed:', error);
    return false;
  }
}

