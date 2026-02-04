/// <reference types="pdfkit" />
import type { AnalysisResult } from '@/lib/types/analysis';

const MARGIN = 50;
const PAGE_WIDTH = 595;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 14;

function addText(doc: PDFKit.PDFDocument, text: string, y: number): number {
  doc.font('Helvetica').fontSize(11);
  doc.text(text, MARGIN, y, { width: CONTENT_WIDTH, lineGap: 2 });
  return doc.y + 6;
}

function addSectionTitle(doc: PDFKit.PDFDocument, text: string, y: number): number {
  doc.fontSize(14).font('Helvetica-Bold').fillColor('black');
  doc.text(text, MARGIN, y);
  return doc.y + 8;
}

function renderAnomalySection(
  doc: PDFKit.PDFDocument,
  result: AnalysisResult,
  y: number
): number {
  if (!result.anomaly.detected) return y + 8;
  y += 4;
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#b45309');
  y = addText(doc, `⚠ Anomalies detected (${result.anomaly.severity})`, y) + 4;
  doc.fontSize(11).font('Helvetica').fillColor('black');
  for (const issue of result.anomaly.issues) {
    y = addText(doc, `• ${issue}`, y);
  }
  if (result.anomaly.recommendations.length > 0) {
    y += 4;
    doc.font('Helvetica-Bold').text('Recommendations:', MARGIN, y);
    y += LINE_HEIGHT;
    for (const rec of result.anomaly.recommendations) {
      y = addText(doc, `• ${rec}`, y);
    }
  }
  if (result.webhookTriggered) {
    doc.font('Helvetica-Bold').fillColor('#059669');
    y = addText(doc, '✅ Workflow triggered', y) + 4;
    doc.fillColor('black');
  }
  return y + 16;
}

function renderResultSection(
  doc: PDFKit.PDFDocument,
  result: AnalysisResult,
  y: number
): number {
  y = addSectionTitle(doc, result.filename, y);
  y = addText(doc, result.summary, y) + 6;
  if (result.metadata.pageCount) y = addText(doc, `Pages: ${result.metadata.pageCount}`, y);
  if (result.metadata.rowCount) y = addText(doc, `Rows: ${result.metadata.rowCount}`, y);
  y = addText(doc, `Energy estimate: ${result.energyEstimate} kWh`, y) + 8;
  return renderAnomalySection(doc, result, y);
}

export async function generateAnalysisReportPDF(results: AnalysisResult[]): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  doc.fontSize(20).font('Helvetica-Bold').text('TerraInsight Analysis Report', MARGIN, 40);
  doc.fontSize(10).font('Helvetica').fillColor('#666666');
  doc.text(`Generated: ${new Date().toLocaleString()} | ${results.length} file(s) analyzed`, MARGIN, 65);
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

  doc.fontSize(9).font('Helvetica').fillColor('#666666');
  doc.text('TerraInsight EcoPulse AI | sustainability@company.com', MARGIN, doc.page.height - 40);

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    doc.end();
  });
}
