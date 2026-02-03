"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
};

export function EcoDropzone({
  onFilesSelected,
  disabled = false,
}: {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

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

      const files = Array.from(e.dataTransfer.files).filter((f) => {
        const valid =
          f.type === "application/pdf" ||
          f.type === "text/csv" ||
          f.name.endsWith(".csv") ||
          f.name.endsWith(".pdf");
        return valid;
      });

      if (files.length > 0) {
        setSelectedFiles((prev) => [...prev, ...files]);
        onFilesSelected([...selectedFiles, ...files]);
      }
    },
    [disabled, onFilesSelected, selectedFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        setSelectedFiles((prev) => [...prev, ...files]);
        onFilesSelected([...selectedFiles, ...files]);
      }
      e.target.value = "";
    },
    [onFilesSelected, selectedFiles]
  );

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      return <FileText className="h-4 w-4 text-red-400" />;
    }
    return <FileSpreadsheet className="h-4 w-4 text-emerald-accent" />;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200",
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
        <p className="text-xs text-charcoal-500">
          PDF, CSV supported • Energy usage, carbon footprint, waste reports
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-charcoal-400">
            Selected files ({selectedFiles.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-lg bg-charcoal-800/80 px-3 py-2 text-sm"
              >
                {getFileIcon(file)}
                <span className="max-w-[160px] truncate text-charcoal-300">
                  {file.name}
                </span>
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
