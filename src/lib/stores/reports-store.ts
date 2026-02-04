import type { AnalysisResult, StoredReport } from '@/lib/types/analysis';

const STORAGE_KEY = 'terra-reports';

function generateId(): string {
  return `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getStoredReports(): StoredReport[] {
  if (globalThis.window === undefined) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReport(
  result: AnalysisResult,
  source: 'manual' | 'synthetic',
  generatedData?: { filename: string; recordCount: number; criticalValues: number; maxConsumption: number }
): StoredReport {
  const report: StoredReport = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    source,
    result,
    ...(source === 'synthetic' && generatedData ? { generatedData } : {}),
  };
  const reports = getStoredReports();
  reports.unshift(report);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    if (globalThis.window !== undefined) {
      globalThis.dispatchEvent(new CustomEvent('terra-reports-updated'));
    }
  } catch {
    if (reports.length > 50) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports.slice(0, 50)));
    }
  }
  return report;
}

export function saveReports(results: AnalysisResult[], source: 'manual' | 'synthetic'): StoredReport[] {
  return results.map((r) => saveReport(r, source));
}
