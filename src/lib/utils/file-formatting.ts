import { type ParsedFileData } from "../actions/parse-file";

/**
 * Formats parsed data for AI context injection
 */
export function formatForAIContext(parsedFiles: ParsedFileData[]): string {
  const context = parsedFiles
    .filter(file => file.parseSuccess)
    .map(file => {
      let content = `## File: ${file.filename} (${file.fileType.toUpperCase()})\n`;
      
      // Add metadata
      if (file.metadata.pageCount) {
        content += `Pages: ${file.metadata.pageCount}\n`;
      }
      if (file.metadata.rowCount) {
        content += `Rows: ${file.metadata.rowCount}\n`;
      }
      if (file.metadata.headers?.length) {
        content += `Headers: ${file.metadata.headers.join(", ")}\n`;
      }
      content += `File Size: ${(file.metadata.fileSize / 1024).toFixed(1)} KB\n\n`;
      
      // Add extracted content
      content += `### Content:\n${file.extractedText}\n\n`;
      
      return content;
    })
    .join("---\n\n");

  return context;
}