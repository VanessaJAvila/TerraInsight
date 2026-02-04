"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseFiles, type ParsedFileData } from "@/lib/actions/parse-file";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
};

interface FileWithStatus {
  file: File;
  status: "pending" | "parsing" | "success" | "error";
  parsedData?: ParsedFileData;
  error?: string;
}

export function EcoDropzone({
  onFilesSelected,
  onFilesParsed,
  disabled = false,
}: {
  readonly onFilesSelected: (files: File[]) => void;
  readonly onFilesParsed?: (parsedFiles: ParsedFileData[]) => void;
  readonly disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [filesWithStatus, setFilesWithStatus] = useState<FileWithStatus[]>([]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  // Helper function to check if file is in pending list
  const isFilePending = useCallback((file: File, pendingFiles: FileWithStatus[]) => {
    return pendingFiles.some(pf => pf.file === file);
  }, []);

  // Helper function to validate file types
  const isValidFileType = useCallback((file: File) => {
    return (
      file.type === "application/pdf" ||
      file.type === "text/csv" ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".pdf")
    );
  }, []);

  // Helper function to update file with parsing results
  const updateFileWithResult = useCallback((file: FileWithStatus, parsedResults: ParsedFileData[]) => {
    const parsedResult = parsedResults.find(pr => pr.filename === file.file.name);
    
    if (parsedResult) {
      return {
        ...file,
        status: parsedResult.parseSuccess ? "success" as const : "error" as const,
        parsedData: parsedResult,
        error: parsedResult.error,
      };
    }
    return file;
  }, []);

  const handleParseFiles = useCallback(async (filesToParse: FileWithStatus[]) => {
    const pendingFiles = filesToParse.filter(f => f.status === "pending");
    if (pendingFiles.length === 0) return;

    // Set parsing status
    setFilesWithStatus(prev => 
      prev.map(f => 
        isFilePending(f.file, pendingFiles)
          ? { ...f, status: "parsing" as const }
          : f
      )
    );

    try {
      const parsedResults = await parseFiles(pendingFiles.map(f => f.file));
      
      // Update status with results
      setFilesWithStatus(prev => 
        prev.map(f => updateFileWithResult(f, parsedResults))
      );

      // Notify parent component
      const successfulParsedFiles = parsedResults.filter(r => r.parseSuccess);
      if (onFilesParsed && successfulParsedFiles.length > 0) {
        onFilesParsed(successfulParsedFiles);
      }
    } catch (error) {
      console.error("File parsing error:", error);
      // Set error status for all pending files
      setFilesWithStatus(prev =>
        prev.map(f =>
          isFilePending(f.file, pendingFiles)
            ? { ...f, status: "error" as const, error: "Parsing failed" }
            : f
        )
      );
    }
  }, [onFilesParsed, isFilePending, updateFileWithResult]);

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter(isValidFileType);

      if (files.length > 0) {
        const newFilesWithStatus = files.map(file => ({
          file,
          status: "pending" as const,
        }));
        
        setFilesWithStatus((prev) => [...prev, ...newFilesWithStatus]);
        onFilesSelected([...filesWithStatus.map(f => f.file), ...files]);
        
        // Parse files automatically
        handleParseFiles([...filesWithStatus, ...newFilesWithStatus]);
      }
    },
    [disabled, onFilesSelected, filesWithStatus, handleParseFiles, isValidFileType]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        const newFilesWithStatus = files.map(file => ({
          file,
          status: "pending" as const,
        }));
        
        setFilesWithStatus((prev) => [...prev, ...newFilesWithStatus]);
        onFilesSelected([...filesWithStatus.map(f => f.file), ...files]);
        
        // Parse files automatically
        handleParseFiles([...filesWithStatus, ...newFilesWithStatus]);
      }
      e.target.value = "";
    },
    [onFilesSelected, filesWithStatus, handleParseFiles]
  );

  // Handle keyboard interaction for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
      fileInput?.click();
    }
  }, [disabled]);

  // Handle button click to trigger file input
  const handleButtonClick = useCallback(() => {
    if (disabled) return;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }, [disabled]);

  const removeFile = (index: number) => {
    const newFiles = filesWithStatus.filter((_, i) => i !== index);
    setFilesWithStatus(newFiles);
    onFilesSelected(newFiles.map(f => f.file));
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      return <FileText className="h-4 w-4 text-red-400" />;
    }
    return <FileSpreadsheet className="h-4 w-4 text-emerald-accent" />;
  };

  const getStatusIcon = (status: FileWithStatus["status"]) => {
    switch (status) {
      case "parsing":
        return <Loader2 className="h-4 w-4 animate-spin text-emerald-accent" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-accent" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={disabled}
        aria-label="Upload energy or carbon reports. Drag and drop files here or click to select files."
        aria-describedby="dropzone-description"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        onClick={handleButtonClick}
        className={cn(
          "relative w-full rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-accent focus:ring-offset-2 focus:ring-offset-charcoal-950",
          isDragging
            ? "border-emerald-accent bg-emerald-accent/5 shadow-eco-glow"
            : "border-charcoal-700 bg-charcoal-900/30 hover:border-charcoal-600 hover:bg-charcoal-900/50",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          type="file"
          accept=".pdf,.csv,.xlsx,.xls"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Upload className="mx-auto mb-4 h-12 w-12 text-charcoal-500" />
        <p className="mb-1 text-sm font-medium text-charcoal-200">
          Drop Energy or Carbon reports here
        </p>
        <p id="dropzone-description" className="text-xs text-charcoal-500">
          PDF, CSV supported • Energy usage, carbon footprint, waste reports • Click or press Enter to select files
        </p>
      </button>

      {filesWithStatus.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-charcoal-400">
            Files ({filesWithStatus.length})
          </p>
          <div className="space-y-2">
            {filesWithStatus.map((fileWithStatus, index) => (
              <div
                key={`${fileWithStatus.file.name}-${index}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg bg-charcoal-800/80 px-3 py-2.5 text-sm",
                  fileWithStatus.status === "error" && "border border-red-400/20 bg-red-400/5"
                )}
              >
                {getFileIcon(fileWithStatus.file)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="max-w-[160px] truncate text-charcoal-300">
                      {fileWithStatus.file.name}
                    </span>
                    {getStatusIcon(fileWithStatus.status)}
                  </div>
                  {fileWithStatus.status === "success" && fileWithStatus.parsedData && (
                    <p className="text-xs text-charcoal-500 mt-1">
                      {fileWithStatus.parsedData.fileType.toUpperCase()} • 
                      {fileWithStatus.parsedData.metadata.pageCount && 
                        ` ${fileWithStatus.parsedData.metadata.pageCount} pages`}
                      {fileWithStatus.parsedData.metadata.rowCount && 
                        ` ${fileWithStatus.parsedData.metadata.rowCount} rows`}
                    </p>
                  )}
                  {fileWithStatus.status === "error" && fileWithStatus.error && (
                    <p className="text-xs text-red-400 mt-1">
                      {fileWithStatus.error}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="rounded p-0.5 hover:bg-charcoal-700 text-charcoal-500 hover:text-charcoal-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
