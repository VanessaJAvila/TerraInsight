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
    let crisisMode = false;
    try {
      const body = await request.json().catch(() => ({}));
      const envModeRaw = (body.envMode as string)?.trim()?.toLowerCase();
      const envMode: EnvMode = envModeRaw === "prod" ? "prod" : "test";
      const allowTrigger = body.allowTrigger === true;
      const n8nWebhookTest = (body.n8nWebhookTest as string)?.trim() || undefined;
      crisisMode = body.crisis === true;
      const { url } = resolveN8nWebhookUrl(envMode, n8nWebhookTest);
      webhookConfig = { url, allowTrigger, envMode };
    } catch {
      /* use defaults */
    }

    const syntheticData = crisisMode
      ? generateSyntheticCrisisData()
      : generateSyntheticCriticalData();
    const csvContent = crisisMode
      ? convertCrisisToCSV(syntheticData)
      : convertToCSV(syntheticData);

    const syntheticFile = {
      name: crisisMode ? "crisis_critical_alert.csv" : "demo_critical_waste_analysis.csv",
      size: Buffer.byteLength(csvContent, "utf8"),
      type: "text/csv",
    };

    const { result: analysisResult, triggerStatus, triggerDetail } = await analyzeSyntheticData(
      csvContent,
      syntheticFile,
      webhookConfig,
      crisisMode
    );
    const webhookStatusObj = {
      triggered: analysisResult.webhookTriggered ?? false,
      envMode: webhookConfig.envMode,
      status: triggerStatus,
      detail: triggerDetail,
    };
    return NextResponse.json({
      success: true,
      message: "Demo report generated and analyzed",
      result: analysisResult,
      generatedData: {
        filename: syntheticFile.name,
        recordCount: syntheticData.length,
        criticalValues: syntheticData.filter((row: { consumption: number }) => row.consumption > (crisisMode ? 5000 : 800)).length,
        maxConsumption: Math.max(...syntheticData.map((row: { consumption: number }) => row.consumption)),
      },
      webhookStatus: webhookStatusObj,
    });
    
  } catch {
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
  alert?: string;
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

/** High-severity crisis data: consumption > 5000 kWh, CRITICAL FAILURE / EMERGENCY LEAK keywords for anomaly detection. */
function generateSyntheticCrisisData(): SyntheticDataRow[] {
  const locations = [
    'Data Center Alpha',
    'Industrial Cooling Unit',
    'Chemical Processing Plant',
    'High-Performance Computing Lab',
    'Manufacturing Floor B',
    'Steel Fabrication Unit'
  ];
  const alerts = [
    'CRITICAL FAILURE',
    'EMERGENCY LEAK',
    'CRITICAL FAILURE - OVERRIDE',
    'EMERGENCY LEAK DETECTED',
    'CRITICAL FAILURE',
    'EMERGENCY LEAK'
  ];
  const currentTime = new Date();
  const data: SyntheticDataRow[] = [];
  for (let i = 0; i < 10; i++) {
    const timestamp = new Date(currentTime.getTime() - (i * 45 * 60 * 1000));
    const location = locations[i % locations.length];
    const consumption = Math.floor(Math.random() * 3000) + 5000;
    const energy_kwh = consumption * 0.35 + Math.random() * 200;
    const waste_kg = consumption * 0.12 + Math.random() * 80;
    const efficiency_score = Math.max(0, Math.floor((8000 - consumption) / 20));
    data.push({
      timestamp: timestamp.toISOString(),
      location,
      consumption,
      energy_kwh: Math.round(energy_kwh * 100) / 100,
      waste_kg: Math.round(waste_kg * 100) / 100,
      efficiency_score: Math.round(efficiency_score),
      alert: alerts[i % alerts.length]
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

function convertCrisisToCSV(data: SyntheticDataRow[]): string {
  const headers = ['timestamp', 'location', 'consumption', 'energy_kwh', 'waste_kg', 'efficiency_score', 'alert'];
  const csvRows = [
    headers.join(','),
    ...data.map(row => [
      row.timestamp,
      `"${row.location}"`,
      row.consumption,
      row.energy_kwh,
      row.waste_kg,
      row.efficiency_score,
      row.alert ? `"${row.alert}"` : ''
    ].join(','))
  ];
  return csvRows.join('\n');
}

async function analyzeSyntheticData(
  csvContent: string,
  fileInfo: { name: string; size: number; type: string },
  webhookConfig: WebhookConfig,
  crisisMode = false
): Promise<{ result: AnalysisResult; triggerStatus: number; triggerDetail?: string }> {
  const lines = csvContent.split("\n");
  const dataRows = lines.slice(1).filter((line) => line.trim());
  const metadata = {
    fileSize: fileInfo.size,
    rowCount: dataRows.length,
    headers: (lines[0] || "").split(",").map((h) => h.replaceAll('"', "")),
  };

  let anomaly = detectTextAnomalies(csvContent, metadata);
  if (crisisMode) {
    anomaly = {
      detected: true,
      severity: "high",
      issues: [
        "CRITICAL FAILURE detected in multiple units",
        "EMERGENCY LEAK - consumption above 5000 kWh",
        ...anomaly.issues,
      ].slice(0, 5),
      recommendations: [
        "Immediate shutdown of affected systems",
        "Deploy emergency response team",
        ...anomaly.recommendations,
      ].slice(0, 4),
    };
  }
  const summary = generateAnalysisSummary("csv", metadata, anomaly);
  const energyEstimate = calculateFileEnergyEstimate(fileInfo.size, anomaly.detected);

  let webhookTriggered = false;
  let triggerStatus = 0;
  let triggerDetail: string | undefined;
  if (anomaly.detected && webhookConfig.allowTrigger && webhookConfig.url) {
    const triggerResult = crisisMode
      ? await triggerCrisisWebhook(fileInfo.name, anomaly, webhookConfig)
      : await triggerDemoWebhook(fileInfo.name, anomaly, webhookConfig);
    webhookTriggered = triggerResult.ok;
    triggerStatus = triggerResult.status;
    triggerDetail = triggerResult.detail;
  }
  return {
    result: {
      filename: fileInfo.name,
      status: "success",
      fileType: "csv",
      extractedText: csvContent,
      metadata,
      anomaly,
      webhookTriggered,
      summary,
      energyEstimate,
    } as AnalysisResult,
    triggerStatus,
    triggerDetail,
  };
}

async function triggerDemoWebhook(
  filename: string,
  anomaly: { issues: string[]; severity: string; recommendations: string[] },
  config: WebhookConfig
): Promise<{ ok: boolean; status: number; detail?: string }> {
  if (!config.url) return { ok: false, status: 0 };
  const payload = {
    action: "demo_critical_analysis",
    details: `Synthetic critical waste analysis: ${filename} - ${anomaly.issues.join("; ")}`,
    severity: anomaly.severity,
    timestamp: new Date().toISOString(),
    source: "agentic_demo_generation",
    issues: anomaly.issues,
    recommendations: anomaly.recommendations,
  };
  return triggerN8nWebhook(config.url, payload, config.envMode);
}

/** Crisis webhook: priority "critical" and CRITICAL flag for n8n routing. */
async function triggerCrisisWebhook(
  filename: string,
  anomaly: { issues: string[]; severity: string; recommendations: string[] },
  config: WebhookConfig
): Promise<{ ok: boolean; status: number; detail?: string }> {
  if (!config.url) return { ok: false, status: 0 };
  const payload = {
    action: "critical_alert",
    priority: "critical",
    critical: true,
    details: `CRITICAL: ${filename} - ${anomaly.issues.join("; ")}`,
    severity: "high",
    timestamp: new Date().toISOString(),
    source: "crisis_demo_generation",
    issues: anomaly.issues,
    recommendations: anomaly.recommendations,
  };
  return triggerN8nWebhook(config.url, payload, config.envMode);
}