/// <reference types="pdfkit" />
import type { AnalysisResult } from '@/lib/types/analysis';

const MARGIN = 50;
const PAGE_WIDTH = 595;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 14;

function sanitizeText(s: string): string {
  return String(s ?? "").replaceAll("\0", "");
}

function addText(doc: PDFKit.PDFDocument, text: string, y: number): number {
  doc.font("Helvetica").fontSize(11);
  doc.text(sanitizeText(text), MARGIN, y, { width: CONTENT_WIDTH, lineGap: 2 });
  return doc.y + 6;
}

function addSectionTitle(doc: PDFKit.PDFDocument, text: string, y: number): number {
  doc.fontSize(14).font("Helvetica-Bold").fillColor("black");
  doc.text(sanitizeText(text), MARGIN, y);
  return doc.y + 8;
}

function renderAnomalySection(
  doc: PDFKit.PDFDocument,
  result: AnalysisResult,
  y: number
): number {
  const anomaly = result.anomaly ?? { detected: false, severity: "medium", issues: [], recommendations: [] };
  if (!anomaly.detected) return y + 8;
  y += 4;
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#b45309');
  y = addText(doc, `[!] Anomalies detected (${anomaly.severity ?? "medium"})`, y) + 4;
  doc.fontSize(11).font('Helvetica').fillColor('black');
  const issues = Array.isArray(anomaly.issues) ? anomaly.issues : [];
  for (const issue of issues) {
    y = addText(doc, `• ${sanitizeText(String(issue))}`, y);
  }
  const recs = Array.isArray(anomaly.recommendations) ? anomaly.recommendations : [];
  if (recs.length > 0) {
    y += 4;
    doc.font('Helvetica-Bold').text('Recommendations:', MARGIN, y);
    y += LINE_HEIGHT;
    for (const rec of recs) {
      y = addText(doc, `• ${sanitizeText(String(rec))}`, y);
    }
  }
  if (result.webhookTriggered) {
    doc.font('Helvetica-Bold').fillColor('#059669');
    y = addText(doc, "[OK] Workflow triggered", y) + 4;
    doc.fillColor('black');
  }
  return y + 16;
}

function renderResultSection(
  doc: PDFKit.PDFDocument,
  result: AnalysisResult,
  y: number
): number {
  const filename = String(result?.filename ?? "Report");
  const summary = String(result?.summary ?? "No summary.");
  const meta = (result?.metadata && typeof result.metadata === "object" ? result.metadata : {}) as { pageCount?: number; rowCount?: number };
  const energyEstimate = Number(result?.energyEstimate) || 0;
  y = addSectionTitle(doc, filename, y);
  y = addText(doc, summary, y) + 6;
  if (meta.pageCount != null) y = addText(doc, `Pages: ${meta.pageCount}`, y);
  if (meta.rowCount != null) y = addText(doc, `Rows: ${meta.rowCount}`, y);
  y = addText(doc, `Energy estimate: ${energyEstimate} kWh`, y) + 8;
  return renderAnomalySection(doc, result, y);
}

export async function generateAnalysisReportPDF(results: AnalysisResult[]): Promise<Buffer> {
  const pdfkitModule = await import("pdfkit");
  const mod = pdfkitModule as { default?: new (opts?: object) => PDFKit.PDFDocument; [key: string]: unknown };
  const PDFDocument = mod.default ?? mod;
  if (typeof PDFDocument !== "function") {
    throw new TypeError("PDFKit constructor not found; check pdfkit package.");
  }
  const doc = new PDFDocument({ margin: MARGIN, size: "A4", bufferPages: true });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  doc.fontSize(20).font("Helvetica-Bold").text("TerraInsight Analysis Report", MARGIN, 40);
  doc.fontSize(10).font("Helvetica").fillColor("#666666");
  const generatedLine = `Generated: ${new Date().toISOString()} | ${results.length} file(s) analyzed`;
  doc.text(sanitizeText(generatedLine), MARGIN, 65);
  doc.moveTo(MARGIN, 90).lineTo(PAGE_WIDTH - MARGIN, 90).stroke();
  doc.fillColor('black');

  let y = 110;
  for (const result of results) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    y = renderResultSection(doc, result, y);
  }

  doc.fontSize(9).font("Helvetica").fillColor("#666666");
  const pageHeight = doc.page?.height ?? 842;
  doc.text("TerraInsight EcoPulse AI | sustainability@company.com", MARGIN, pageHeight - 40);

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    doc.end();
  });
}
