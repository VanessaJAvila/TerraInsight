/** Distinct report sources for badges and filtering. Gray=Manual, Amber=Synthetic, Red=Crisis, Emerald=Success. */
export type ReportSource = "manual" | "synthetic" | "crisis";

export interface AnomalyDetection {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  issues: string[];
  recommendations: string[];
}

export interface AnalysisResult {
  filename: string;
  status: 'success' | 'error' | 'skipped';
  fileType: 'pdf' | 'csv' | 'xlsx';
  extractedText: string;
  metadata: {
    fileSize: number;
    pageCount?: number;
    rowCount?: number;
    headers?: string[];
  };
  anomaly: AnomalyDetection;
  webhookTriggered?: boolean;
  summary: string;
  energyEstimate: number;
  error?: string;
}

export interface FileProgress {
  id: string;
  file: File;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  progress: number;
  result?: AnalysisResult;
  error?: string;
}

export interface StoredReport {
  id: string;
  createdAt: string;
  source: ReportSource;
  result: AnalysisResult;
  generatedData?: {
    filename: string;
    recordCount: number;
    criticalValues: number;
    maxConsumption: number;
  };
}