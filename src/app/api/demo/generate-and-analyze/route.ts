import { NextResponse } from "next/server";
import type { AnalysisResult } from '@/lib/types/analysis';
import { 
  detectTextAnomalies, 
  generateAnalysisSummary, 
  calculateFileEnergyEstimate
} from '@/lib/utils/analysis';
import { DEFAULT_WEBHOOK_URL } from '@/lib/constants/analysis';

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  try {
    // Generate synthetic critical waste CSV data in memory
    const syntheticData = generateSyntheticCriticalData();
    
    // Convert to CSV format
    const csvContent = convertToCSV(syntheticData);
    
    // Create synthetic file metadata
    const syntheticFile = {
      name: 'demo_critical_waste_analysis.csv',
      size: Buffer.byteLength(csvContent, 'utf8'),
      type: 'text/csv'
    };
    
    // Process with the same analysis logic used for uploads
    const analysisResult = await analyzeSyntheticData(csvContent, syntheticFile);
    
    // Return the analysis result for the chat UI
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
  
  // Generate 12 hours of critical consumption data
  for (let i = 0; i < 12; i++) {
    const timestamp = new Date(currentTime.getTime() - (i * 60 * 60 * 1000));
    const location = locations[i % locations.length];
    
    // Generate critical consumption values (800-1500 range)
    const consumption = Math.floor(Math.random() * 700) + 800; // 800-1500
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

async function analyzeSyntheticData(csvContent: string, fileInfo: any): Promise<AnalysisResult> {
  // Parse CSV content to extract metadata
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const dataRows = lines.slice(1).filter(line => line.trim());
  
  const metadata = {
    fileSize: fileInfo.size,
    rowCount: dataRows.length,
    headers: headers.map(h => h.replaceAll(/"/g, ''))
  };
  
  // Run anomaly detection on the synthetic data
  const anomaly = detectTextAnomalies(csvContent, metadata);
  
  // Generate summary
  const summary = generateAnalysisSummary('csv', metadata, anomaly);
  
  // Calculate energy estimate
  const energyEstimate = calculateFileEnergyEstimate(fileInfo.size, anomaly.detected);
  
  // Trigger webhook if anomalies detected
  let webhookTriggered = false;
  if (anomaly.detected) {
    webhookTriggered = await triggerDemoWebhook(fileInfo.name, anomaly);
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

async function triggerDemoWebhook(filename: string, anomaly: any): Promise<boolean> {
  try {
    const payload = {
      action: 'demo_critical_analysis',
      details: `Synthetic critical waste analysis: ${filename} - ${anomaly.issues.join('; ')}`,
      severity: anomaly.severity,
      timestamp: new Date().toISOString(),
      source: 'agentic_demo_generation',
      issues: anomaly.issues,
      recommendations: anomaly.recommendations,
    };

    const response = await fetch(DEFAULT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Demo webhook trigger failed:', error);
    return false;
  }
}