"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { type ParsedFileData } from "@/lib/actions/parse-file";
import { formatForAIContext } from "@/lib/utils/file-formatting";

export default function DashboardPage() {
  const [parsedFiles, setParsedFiles] = useState<ParsedFileData[]>([]);
  const [aiContext, setAIContext] = useState<string>("");

  const handleFilesParsed = (newParsedFiles: ParsedFileData[]) => {
    setParsedFiles(prev => [...prev, ...newParsedFiles]);
    
    // Format for AI context
    const allFiles = [...parsedFiles, ...newParsedFiles];
    const context = formatForAIContext(allFiles);
    setAIContext(context);
    
    console.log("Files parsed and context updated:", {
      fileCount: allFiles.length,
      contextLength: context.length
    });
  };
  return (
    <div className="eco-grid-bg min-h-screen">
      <Sidebar />
      <main className="pl-64">
        <div className="mx-auto max-w-7xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal-100">
              Impact Overview
            </h1>
            <p className="mt-1 text-charcoal-500">
              Upload reports and analyze your ecological footprint
            </p>
          </div>

          <DashboardClient 
            onFilesParsed={handleFilesParsed}
            parsedFiles={parsedFiles}
            aiContext={aiContext}
          />
        </div>
      </main>
    </div>
  );
}
