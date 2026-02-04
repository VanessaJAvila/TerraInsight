"use client";

import { useState } from "react";
import { EcoDropzone } from "./eco-dropzone";
import { EcoAgent } from "./eco-agent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ParsedFileData } from "@/lib/actions/parse-file";

interface DashboardClientProps {
  readonly onFilesParsed: (parsedFiles: ParsedFileData[]) => void;
  readonly parsedFiles: ParsedFileData[];
  readonly aiContext: string;
}

export function DashboardClient({ onFilesParsed, parsedFiles, aiContext }: DashboardClientProps) {
  // State for handling file processing
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handler for when files are selected in the dropzone
  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected:", files.map(f => f.name));
  };

  // Handler for when files are parsed
  const handleFilesParsed = (newParsedFiles: ParsedFileData[]) => {
    setIsAnalyzing(true);
    onFilesParsed(newParsedFiles);
    
    // Simulate processing time for UI feedback
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1000);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Eco-Dropzone - Takes 2/3 width */}
      <div className="lg:col-span-2">
        <Card className="border-charcoal-800 bg-charcoal-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Eco-Dropzone
              {isAnalyzing && (
                <span className="inline-flex items-center rounded-full bg-emerald-accent/10 px-2 py-1 text-xs text-emerald-accent">
                  Processing...
                </span>
              )}
              {parsedFiles.length > 0 && !isAnalyzing && (
                <span className="inline-flex items-center rounded-full bg-emerald-accent/20 px-2 py-1 text-xs text-emerald-accent">
                  {parsedFiles.length} file{parsedFiles.length > 1 ? 's' : ''} processed
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Upload Energy or Carbon reports for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EcoDropzone 
              onFilesSelected={handleFilesSelected}
              onFilesParsed={handleFilesParsed}
              disabled={isAnalyzing}
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Eco-Agent Panel */}
      <div>
        <Card className="h-full border-charcoal-800 bg-charcoal-900/50">
          <CardContent className="pt-6">
            <EcoAgent aiContext={aiContext} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}