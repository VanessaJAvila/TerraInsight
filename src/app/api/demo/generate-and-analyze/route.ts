import { NextResponse } from "next/server";
import type { AnalysisResult } from "@/lib/types/analysis";
import {
  detectTextAnomalies,
  generateAnalysisSummary,
  calculateFileEnergyEstimate,
} from "@/lib/utils/analysis";
import { resolveN8nWebhookUrl, triggerN8nWebhook, type EnvMode } from "@/lib/webhook";

export const runtime = "nodejs";
export const maxDuration = 30;

type WebhookConfig = { url: string | null; allowTrigger: boolean; envMode: EnvMode };

export async function POST(request: Request) {
  try {
    let webhookConfig: WebhookConfig = {
      url: null,
      allowTrigger: false,
      envMode: "test",
    };
    try {
      const body = await request.json().catch(() => ({}));
      const envModeRaw = (body.envMode as string)?.trim()?.toLowerCase();
      const envMode: EnvMode = envModeRaw === "prod" ? "prod" : "test";
      const allowTrigger = body.allowTrigger === true;
      const n8nWebhookTest = (body.n8nWebhookTest as string)?.trim() || undefined;
      const { url } = resolveN8nWebhookUrl(envMode, n8nWebhookTest);
      webhookConfig = { url, allowTrigger, envMode };
    } catch (err) {
      console.warn("Demo generate-and-analyze: webhook config from body failed, using defaults", err);
    }

    const syntheticData = generateSyntheticCriticalData();
    const csvContent = convertToCSV(syntheticData);

    const syntheticFile = {
      name: "demo_critical_waste_analysis.csv",
      size: Buffer.byteLength(csvContent, "utf8"),
      type: "text/csv",
    };

    const analysisResult = await analyzeSyntheticData(csvContent, syntheticFile, webhookConfig);
    
    return NextResponse.json({
      success: true,
      message: 'Demo report generated and analyzed',
      result: analysisResult,
      generatedData: {
        filename: syntheticFile.name,
        recordCount: syntheticData.length,
        criticalValues: syntheticData.filter(row => row.consumption > 800).length,
        maxConsumption: Math.max(...syntheticData.map(row => row.consumption))
      }
    });
    
  } catch (error) {
    console.error('Demo generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo report' },
      { status: 500 }
    );
  }
}

interface SyntheticDataRow {
  timestamp: string;
  location: string;
  consumption: number;
  energy_kwh: number;
  waste_kg: number;
  efficiency_score: number;
}

function generateSyntheticCriticalData(): SyntheticDataRow[] {
  const locations = [
    'Data Center Alpha',
    'Manufacturing Floor B',
    'Industrial Cooling Unit',
    'High-Performance Computing Lab',
    'Chemical Processing Plant',
    'Steel Fabrication Unit'
  ];
  
  const currentTime = new Date();
  const data: SyntheticDataRow[] = [];
  
  for (let i = 0; i < 12; i++) {
    const timestamp = new Date(currentTime.getTime() - (i * 60 * 60 * 1000));
    const location = locations[i % locations.length];
    const consumption = Math.floor(Math.random() * 700) + 800;
    const energy_kwh = consumption * 0.28 + Math.random() * 50;
    const waste_kg = consumption * 0.08 + Math.random() * 20;
    const efficiency_score = Math.max(5, Math.floor((1000 - consumption) / 15) + Math.random() * 10);
    
    data.push({
      timestamp: timestamp.toISOString(),
      location,
      consumption,
      energy_kwh: Math.round(energy_kwh * 100) / 100,
      waste_kg: Math.round(waste_kg * 100) / 100,
      efficiency_score: Math.round(efficiency_score)
    });
  }
  
  return data;
}

function convertToCSV(data: SyntheticDataRow[]): string {
  const headers = ['timestamp', 'location', 'consumption', 'energy_kwh', 'waste_kg', 'efficiency_score'];
  const csvRows = [
    headers.join(','),
    ...data.map(row => [
      row.timestamp,
      `"${row.location}"`,
      row.consumption,
      row.energy_kwh,
      row.waste_kg,
      row.efficiency_score
    ].join(','))
  ];
  
  return csvRows.join('\n');
}

async function analyzeSyntheticData(
  csvContent: string,
  fileInfo: { name: string; size: number; type: string },
  webhookConfig: WebhookConfig
): Promise<AnalysisResult> {
  const lines = csvContent.split("\n");
  const dataRows = lines.slice(1).filter((line) => line.trim());
  const metadata = {
    fileSize: fileInfo.size,
    rowCount: dataRows.length,
    headers: (lines[0] || "").split(",").map((h) => h.replaceAll('"', "")),
  };

  const anomaly = detectTextAnomalies(csvContent, metadata);
  const summary = generateAnalysisSummary("csv", metadata, anomaly);
  const energyEstimate = calculateFileEnergyEstimate(fileInfo.size, anomaly.detected);

  let webhookTriggered = false;
  if (anomaly.detected && webhookConfig.allowTrigger && webhookConfig.url) {
    webhookTriggered = await triggerDemoWebhook(fileInfo.name, anomaly, webhookConfig);
  }
  
  return {
    filename: fileInfo.name,
    status: 'success',
    fileType: 'csv',
    extractedText: csvContent,
    metadata,
    anomaly,
    webhookTriggered,
    summary,
    energyEstimate
  };
}

async function triggerDemoWebhook(
  filename: string,
  anomaly: { issues: string[]; severity: string; recommendations: string[] },
  config: WebhookConfig
): Promise<boolean> {
  if (!config.url) return false;
  const payload = {
    action: "demo_critical_analysis",
    details: `Synthetic critical waste analysis: ${filename} - ${anomaly.issues.join("; ")}`,
    severity: anomaly.severity,
    timestamp: new Date().toISOString(),
    source: "agentic_demo_generation",
    issues: anomaly.issues,
    recommendations: anomaly.recommendations,
  };
  const result = await triggerN8nWebhook(config.url, payload, config.envMode);
  return result.ok;
}