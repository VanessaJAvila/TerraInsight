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
  file: File;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  progress: number;
  result?: AnalysisResult;
  error?: string;
}