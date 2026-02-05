/**
 * Analysis utilities for TerraInsight file processing.
 *
 * MVP focuses on CSV and PDF to balance structured data analysis (CSV) with
 * contextual report parsing (PDF), covering the majority of industry-standard
 * sustainability exports. Excel (.xlsx) support is planned for a future release.
 */
import type { AnalysisResult, AnomalyDetection } from '@/lib/types/analysis';
import {
  MAX_CONTEXT_LENGTH,
  ANOMALY_KEYWORDS,
  LARGE_NUMBER_THRESHOLD,
  MIN_LARGE_NUMBERS_COUNT,
  ENERGY_PER_FILE_KB,
  ENERGY_BASE_PROCESSING,
  ENERGY_ANOMALY_BONUS,
  ENERGY_PER_TOKEN,
  CHARS_PER_TOKEN_ESTIMATE,
} from "@/lib/constants/analysis";

export function convertAnalysisResultsToContext(results: AnalysisResult[]): string {
  return results
    .filter(result => result.status === 'success')
    .map(result => {
      let context = `File: ${result.filename} (${result.fileType.toUpperCase()})\n`;
      context += `Summary: ${result.summary}\n`;
      
      if (result.metadata.pageCount) {
        context += `Pages: ${result.metadata.pageCount}\n`;
      }
      
      if (result.metadata.rowCount) {
        context += `Rows: ${result.metadata.rowCount}\n`;
        if (result.metadata.headers) {
          context += `Headers: ${result.metadata.headers.join(', ')}\n`;
        }
      }
      
      if (result.anomaly.detected) {
        context += `⚠️ ANOMALIES DETECTED (${result.anomaly.severity} severity):\n`;
        context += `Issues: ${result.anomaly.issues.join('; ')}\n`;
        context += `Recommendations: ${result.anomaly.recommendations.join('; ')}\n`;
        if (result.webhookTriggered) {
          context += `✅ Sustainability workflow has been triggered\n`;
        }
      }
      
      const truncatedText = result.extractedText.length > MAX_CONTEXT_LENGTH 
        ? result.extractedText.substring(0, MAX_CONTEXT_LENGTH) + '...'
        : result.extractedText;
      
      context += `\nExtracted Data:\n${truncatedText}\n`;
      
      return context;
    })
    .join('\n\n---\n\n');
}

export function detectTextAnomalies(text: string, metadata?: any): AnomalyDetection {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  const lowerText = text.toLowerCase();

  if (ANOMALY_KEYWORDS.waste.some(keyword => lowerText.includes(keyword))) {
    issues.push('Waste management concerns detected');
    recommendations.push('Review waste reduction strategies');
    severity = 'medium';
  }

  if (ANOMALY_KEYWORDS.highConsumption.some(keyword => lowerText.includes(keyword))) {
    issues.push('High energy/resource consumption identified');
    recommendations.push('Investigate consumption patterns and optimize systems');
    severity = 'high';
  }

  if (ANOMALY_KEYWORDS.emergency.some(keyword => lowerText.includes(keyword))) {
    issues.push('Critical environmental issue requiring immediate attention');
    recommendations.push('Immediate investigation and corrective action required');
    severity = 'high';
  }

  if (metadata?.headers) {
    const energyHeaders = metadata.headers.filter((header: string) => 
      ANOMALY_KEYWORDS.energy.some(keyword => header.toLowerCase().includes(keyword))
    );
    
    if (energyHeaders.length > 0) {
      issues.push('Energy consumption data detected for analysis');
      recommendations.push('Monitor for consumption patterns and optimization opportunities');
    }
  }

  const numbers = text.match(/\d+\.?\d*/g) || [];
  const largeNumbers = numbers.filter(num => Number.parseFloat(num) > LARGE_NUMBER_THRESHOLD);
  
  if (largeNumbers.length > MIN_LARGE_NUMBERS_COUNT) {
    issues.push('High numerical values detected - potential consumption spikes');
    recommendations.push('Review high-value entries for efficiency opportunities');
    severity = severity === 'low' ? 'medium' : severity;
  }

  return {
    detected: issues.length > 0,
    severity,
    issues,
    recommendations,
  };
}

export function generateAnalysisSummary(
  fileType: string, 
  metadata: any, 
  anomaly: AnomalyDetection
): string {
  let summary = `${fileType.toUpperCase()} file processed successfully. `;
  
  if (fileType === 'pdf' && metadata.pageCount) {
    summary += `${metadata.pageCount} pages analyzed. `;
  } else if (fileType === 'csv' && metadata.rowCount) {
    summary += `${metadata.rowCount} rows with ${metadata.headers?.length || 0} columns analyzed. `;
  }

  if (anomaly.detected) {
    summary += `⚠️ ${anomaly.issues.length} sustainability issue(s) detected (${anomaly.severity} priority).`;
  } else {
    summary += `✅ No critical environmental issues detected.`;
  }

  return summary;
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high': return 'text-red-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-green-400';
    default: return 'text-charcoal-400';
  }
}

export function isValidFileType(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.type === 'text/csv' ||
    file.name.endsWith('.pdf') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.xlsx')
  );
}

export function getFileType(filename: string): 'pdf' | 'csv' | 'xlsx' {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf': return 'pdf';
    case 'csv': return 'csv';
    case 'xlsx':
    case 'xls': return 'xlsx';
    default: return 'csv';
  }
}

export function calculateFileEnergyEstimate(fileSize: number, hasAnomalies: boolean): number {
  const fileSizeKB = fileSize / 1024;
  const processingEnergy = fileSizeKB * ENERGY_PER_FILE_KB;
  const baseEnergy = ENERGY_BASE_PROCESSING;
  const anomalyBonus = hasAnomalies ? ENERGY_ANOMALY_BONUS : 0;
  
  return Number((processingEnergy + baseEnergy + anomalyBonus).toFixed(4));
}

export function calculateChatEnergyConsumption(totalTokens: number): string {
  if (!totalTokens || totalTokens <= 0) return "0.0000";
  const kWh = totalTokens * ENERGY_PER_TOKEN;
  return kWh.toFixed(4);
}

interface ChatMessage {
  usage?: { totalTokens?: number };
  content?: string;
  role?: string;
}

export function extractTokenUsage(message: ChatMessage): { totalTokens: number; estimated: boolean } {
  if (message.usage?.totalTokens) {
    return { totalTokens: message.usage.totalTokens, estimated: false };
  }
  
  if (message.content && message.role === 'assistant') {
    const estimatedTokens = Math.ceil(message.content.length / CHARS_PER_TOKEN_ESTIMATE);
    return { totalTokens: estimatedTokens, estimated: true };
  }
  
  return { totalTokens: 0, estimated: false };
}