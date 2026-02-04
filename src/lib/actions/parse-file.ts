"use server";

import pdf from "pdf-parse";
import Papa from "papaparse";

/**
 * Extracted file data with metadata
 */
export interface ParsedFileData {
  filename: string;
  fileType: "pdf" | "csv" | "xlsx";
  extractedText: string;
  metadata: {
    pageCount?: number;
    rowCount?: number;
    headers?: string[];
    fileSize: number;
  };
  parseSuccess: boolean;
  error?: string;
}

/**
 * Server action to extract text from uploaded PDF/CSV files
 * Returns structured data that can be sent to AI context
 */
export async function parseFile(file: File): Promise<ParsedFileData> {
  const filename = file.name;
  const fileSize = file.size;
  const fileType = getFileType(filename);

  try {
    if (fileType === "pdf") {
      return await parsePdfFile(file, filename, fileSize);
    } else if (fileType === "csv") {
      return await parseCsvFile(file, filename, fileSize);
    } else if (fileType === "xlsx") {
      // For Excel files, we'll treat them as text for now
      // In production, consider using xlsx library
      return await parseExcelAsText(file, filename, fileSize);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error(`Parse error for ${filename}:`, error);
    return {
      filename,
      fileType,
      extractedText: "",
      metadata: { fileSize },
      parseSuccess: false,
      error: error instanceof Error ? error.message : "Unknown parsing error",
    };
  }
}

/**
 * Parse multiple files concurrently
 */
export async function parseFiles(files: File[]): Promise<ParsedFileData[]> {
  const parsePromises = files.map(file => parseFile(file));
  return await Promise.all(parsePromises);
}


// Helper functions

function getFileType(filename: string): "pdf" | "csv" | "xlsx" {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "csv":
      return "csv";
    case "xlsx":
    case "xls":
      return "xlsx";
    default:
      return "csv"; // Default fallback
  }
}

async function parsePdfFile(
  file: File,
  filename: string,
  fileSize: number
): Promise<ParsedFileData> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdf(buffer);

  return {
    filename,
    fileType: "pdf",
    extractedText: data.text,
    metadata: {
      pageCount: data.numpages,
      fileSize,
    },
    parseSuccess: true,
  };
}

async function parseCsvFile(
  file: File,
  filename: string,
  fileSize: number
): Promise<ParsedFileData> {
  const text = await file.text();
  
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    console.warn(`CSV parsing warnings for ${filename}:`, parsed.errors);
  }

  const headers = parsed.meta.fields || [];
  const rows = parsed.data as Record<string, any>[];

  // Convert parsed CSV data to readable text format
  let extractedText = `CSV Data Summary:\n`;
  extractedText += `Headers: ${headers.join(", ")}\n\n`;

  if (rows.length > 0) {
    extractedText += `Sample Data (first 5 rows):\n`;
    rows.slice(0, 5).forEach((row, index) => {
      extractedText += `Row ${index + 1}:\n`;
      headers.forEach(header => {
        extractedText += `  ${header}: ${row[header] || "N/A"}\n`;
      });
      extractedText += "\n";
    });

    if (rows.length > 5) {
      extractedText += `... and ${rows.length - 5} more rows\n`;
    }
  }

  return {
    filename,
    fileType: "csv",
    extractedText,
    metadata: {
      rowCount: rows.length,
      headers,
      fileSize,
    },
    parseSuccess: true,
  };
}

async function parseExcelAsText(
  file: File,
  filename: string,
  fileSize: number
): Promise<ParsedFileData> {
  // Basic fallback for Excel files - treat as binary and extract what we can
  // In production, use xlsx library for proper parsing
  const text = await file.text();
  
  // Extract any readable text (this is a basic approach)
  const extractedText = text
    .replaceAll(/[^\x20-\x7E\n\r\t]/g, " ") // Remove non-printable characters
    .replaceAll(/\s+/g, " ") // Normalize whitespace
    .trim();

  return {
    filename,
    fileType: "xlsx",
    extractedText: extractedText.length > 100 
      ? extractedText.substring(0, 1000) + "..."
      : extractedText,
    metadata: { fileSize },
    parseSuccess: extractedText.length > 0,
    error: extractedText.length === 0 ? "No readable text found in Excel file" : undefined,
  };
}