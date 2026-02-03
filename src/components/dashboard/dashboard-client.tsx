"use client";

import { useState } from "react";
import { EcoDropzone } from "./eco-dropzone";
import { EcoAgent } from "./eco-agent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardClient() {
  // State for handling file selection and processing
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handler for when files are selected in the dropzone
  const handleFilesSelected = async (files: File[]) => {
    console.log("Files selected:", files.map(f => f.name));
    setSelectedFiles(files);
    
    if (files.length > 0) {
      setIsAnalyzing(true);
      // Here you could add logic to process/analyze the files
      // For now, we'll just simulate processing
      setTimeout(() => {
        setIsAnalyzing(false);
        console.log("File analysis complete");
      }, 2000);
    }
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
              {selectedFiles.length > 0 && !isAnalyzing && (
                <span className="inline-flex items-center rounded-full bg-emerald-accent/20 px-2 py-1 text-xs text-emerald-accent">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready
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
              disabled={isAnalyzing}
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Eco-Agent Panel */}
      <div>
        <Card className="h-full border-charcoal-800 bg-charcoal-900/50">
          <CardContent className="pt-6">
            <EcoAgent />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}