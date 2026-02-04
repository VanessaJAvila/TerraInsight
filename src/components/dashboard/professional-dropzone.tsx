"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult, FileProgress } from '@/lib/types/analysis';
import { getSeverityColor, isValidFileType } from '@/lib/utils/analysis';
import { PROGRESS_UPDATE_INTERVAL, PROGRESS_INCREMENT, PROGRESS_NEAR_COMPLETION } from '@/lib/constants/analysis';

interface ProfessionalDropzoneProps {
  readonly onAnalysisComplete: (results: AnalysisResult[]) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

const updateFileProgress = (fp: FileProgress, newFiles: File[]): FileProgress => {
  const shouldUpdate = newFiles.some(nf => nf.name === fp.file.name) && fp.status === 'analyzing';
  return shouldUpdate 
    ? { ...fp, progress: Math.min(fp.progress + PROGRESS_INCREMENT, PROGRESS_NEAR_COMPLETION) }
    : fp;
};

const updateFileWithResult = (fp: FileProgress, results: AnalysisResult[], newFiles: File[]): FileProgress => {
  const result = results.find(r => r.filename === fp.file.name);
  const shouldUpdate = result && newFiles.some(nf => nf.name === fp.file.name);
  
  if (shouldUpdate) {
    return {
      ...fp,
      status: result.status === 'success' ? 'success' : 'error',
      progress: 100,
      result,
      error: result.error,
    };
  }
  return fp;
};

const updateFileWithError = (fp: FileProgress, newFiles: File[], errorMessage: string): FileProgress => {
  const shouldUpdate = newFiles.some(nf => nf.name === fp.file.name);
  return shouldUpdate 
    ? {
        ...fp,
        status: 'error',
        progress: 0,
        error: errorMessage,
      }
    : fp;
};

export function ProfessionalDropzone({
  onAnalysisComplete,
  disabled = false,
  className,
}: ProfessionalDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileProgress[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const updateProgress = useCallback((newFiles: File[]) => {
    setFiles(prev => prev.map(fp => updateFileProgress(fp, newFiles)));
  }, []);

  const updateWithResults = useCallback((results: AnalysisResult[], newFiles: File[]) => {
    setFiles(prev => prev.map(fp => updateFileWithResult(fp, results, newFiles)));
  }, []);

  const updateWithError = useCallback((newFiles: File[], errorMessage: string) => {
    setFiles(prev => prev.map(fp => updateFileWithError(fp, newFiles, errorMessage)));
  }, []);

  const processFiles = useCallback(async (newFiles: File[]) => {
    if (!newFiles.length || disabled) return;

    setIsAnalyzing(true);

    const fileProgresses: FileProgress[] = newFiles.map(file => ({
      file,
      status: 'analyzing',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...fileProgresses]);

    try {
      const formData = new FormData();
      newFiles.forEach(file => formData.append('files', file));

      const progressInterval = setInterval(() => updateProgress(newFiles), PROGRESS_UPDATE_INTERVAL);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      const results: AnalysisResult[] = data.results;

      updateWithResults(results, newFiles);
      const successfulResults = results.filter(r => r.status === 'success');
      if (successfulResults.length > 0) {
        onAnalysisComplete(successfulResults);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      updateWithError(newFiles, errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [disabled, onAnalysisComplete, updateProgress, updateWithResults, updateWithError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter(isValidFileType);

    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [disabled, processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    e.target.value = '';
  }, [processFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return <FileText className="h-4 w-4 text-red-400" />;
    }
    return <FileSpreadsheet className="h-4 w-4 text-emerald-accent" />;
  };

  const getStatusIcon = (status: FileProgress['status']) => {
    switch (status) {
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin text-emerald-accent" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-accent" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };


  return (
    <div className={cn("space-y-4", className)}>
      <section
        aria-label="File drop zone - drag and drop files here or click to browse"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragging
            ? "border-emerald-accent bg-emerald-accent/5 scale-[1.02]"
            : "border-charcoal-600 hover:border-emerald-accent/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.csv,.xlsx"
          onChange={handleFileInput}
          disabled={disabled}
          aria-label="Upload sustainability reports for analysis"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "p-3 rounded-full transition-colors",
            isDragging ? "bg-emerald-accent/20" : "bg-charcoal-800"
          )}>
            <Upload className={cn(
              "h-6 w-6 transition-colors",
              isDragging ? "text-emerald-accent" : "text-charcoal-400"
            )} />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium text-charcoal-200">
              {isDragging ? "Drop files here" : "Professional File Analysis"}
            </p>
            <p className="text-sm text-charcoal-400">
              Drag & drop sustainability reports or click to browse
            </p>
            <p className="text-xs text-charcoal-500">
              Supports PDF, CSV, and Excel files
            </p>
          </div>

          {isAnalyzing && (
            <div className="flex items-center gap-2 text-emerald-accent">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Analyzing...</span>
            </div>
          )}
        </div>
      </section>

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-charcoal-300">Analysis Results</h3>
          
          {files.map((fileProgress) => (
            <div key={fileProgress.file.name} className="bg-charcoal-800/50 rounded-lg border border-charcoal-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(fileProgress.file)}
                  <div>
                    <p className="text-sm font-medium text-charcoal-200">
                      {fileProgress.file.name}
                    </p>
                    <p className="text-xs text-charcoal-400">
                      {(fileProgress.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(fileProgress.status)}
                  <button
                    onClick={() => removeFile(files.findIndex(fp => fp.file.name === fileProgress.file.name))}
                    className="p-1 hover:bg-charcoal-700 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-charcoal-400" />
                  </button>
                </div>
              </div>

              {fileProgress.status === 'analyzing' && (
                <div className="mb-3">
                  <div className="bg-charcoal-700 rounded-full h-2">
                    <div 
                      className="bg-emerald-accent rounded-full h-2 transition-all duration-300"
                      style={{ width: `${fileProgress.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-charcoal-400 mt-1">
                    Processing... {fileProgress.progress}%
                  </p>
                </div>
              )}

              {fileProgress.result && (
                <div className="space-y-3 pt-2 border-t border-charcoal-700">
                  <p className="text-sm text-charcoal-300">
                    {fileProgress.result.summary}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-charcoal-400">
                    {fileProgress.result.metadata.pageCount && (
                      <span>📄 {fileProgress.result.metadata.pageCount} pages</span>
                    )}
                    {fileProgress.result.metadata.rowCount && (
                      <span>📊 {fileProgress.result.metadata.rowCount} rows</span>
                    )}
                  </div>

                  {fileProgress.result.anomaly.detected && (
                    <div className="bg-charcoal-900/50 rounded-lg p-3 border-l-4 border-yellow-400">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={cn("h-4 w-4", getSeverityColor(fileProgress.result.anomaly.severity))} />
                        <span className="text-sm font-medium text-charcoal-200">
                          Environmental Issues Detected ({fileProgress.result.anomaly.severity} priority)
                        </span>
                        {fileProgress.result.webhookTriggered && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            ✅ Workflow Triggered
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="text-charcoal-400 mb-1">Issues:</p>
                          <ul className="list-disc list-inside text-charcoal-300 space-y-1">
                            {fileProgress.result.anomaly.issues.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                        
                        {fileProgress.result.anomaly.recommendations.length > 0 && (
                          <div>
                            <p className="text-charcoal-400 mb-1">Recommendations:</p>
                            <ul className="list-disc list-inside text-emerald-accent space-y-1">
                              {fileProgress.result.anomaly.recommendations.map((rec) => (
                                <li key={rec}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {fileProgress.result && (
                <div className="pt-3 border-t border-charcoal-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-charcoal-400">Energy Estimate:</span>
                    <span className="flex items-center gap-1 text-emerald-accent font-medium">
                      ⚡ {fileProgress.result.energyEstimate} kWh
                    </span>
                  </div>
                </div>
              )}

              {fileProgress.error && (
                <div className="pt-2 border-t border-charcoal-700">
                  <p className="text-sm text-red-400">
                    ❌ {fileProgress.error}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}