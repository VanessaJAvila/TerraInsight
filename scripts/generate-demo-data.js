#!/usr/bin/env node
/**
 * TerraInsight Demo Data Generator
 *
 * Generates CSV and PDF demo files for testing the analysis pipeline.
 * Requires: pdfkit, @faker-js/faker
 * Install: npm install pdfkit @faker-js/faker
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const DEMO_ROOT = path.join(ROOT, 'demo-data');
const CSV_DIR = path.join(DEMO_ROOT, 'csv');
const PDF_DIR = path.join(DEMO_ROOT, 'pdf');

function ensureDirs() {
  [DEMO_ROOT, CSV_DIR, PDF_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created ${path.relative(ROOT, dir)}`);
    }
  });
}

function isEsmProject() {
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
    return pkg.type === 'module';
  } catch {
    return false;
  }
}

function loadDeps() {
  let PDFDocument;

  try {
    PDFDocument = require('pdfkit');
  } catch (err) {
    console.error('Missing pdfkit. Run: npm install pdfkit @faker-js/faker', err);
    process.exit(1);
  }

  return {
    PDFDocument,
    loadFaker: async () => {
      try {
        const mod = await import('@faker-js/faker');
        return mod.faker;
      } catch (err) {
        console.error('Missing @faker-js/faker. Run: npm install pdfkit @faker-js/faker', err);
        process.exit(1);
      }
    },
  };
}

function generateGreenReport(faker) {
  const count = faker.number.int({ min: 10, max: 20 });
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      id: faker.string.uuid(),
      location: faker.company.name(),
      consumption: faker.number.int({ min: 10, max: 79 }),
      date: faker.date.recent({ days: 30 }).toISOString().slice(0, 10),
    });
  }
  return rows;
}

function generateAnomalyReport(faker) {
  const count = faker.number.int({ min: 10, max: 20 });
  const rows = [];
  const anomalyIndices = new Set();
  while (anomalyIndices.size < 2) {
    anomalyIndices.add(faker.number.int({ min: 0, max: count - 1 }));
  }
  for (let i = 0; i < count; i++) {
    const consumption = anomalyIndices.has(i)
      ? faker.number.int({ min: 151, max: 280 })
      : faker.number.int({ min: 40, max: 140 });
    rows.push({
      id: faker.string.uuid(),
      location: faker.company.name(),
      consumption,
      date: faker.date.recent({ days: 30 }).toISOString().slice(0, 10),
    });
  }
  return rows;
}

function generateCriticalWaste(faker) {
  const count = faker.number.int({ min: 5, max: 10 });
  const rows = [];
  const criticalIndex = faker.number.int({ min: 0, max: count - 1 });
  for (let i = 0; i < count; i++) {
    const consumption = i === criticalIndex
      ? faker.number.int({ min: 501, max: 800 })
      : faker.number.int({ min: 350, max: 480 });
    rows.push({
      id: faker.string.uuid(),
      location: faker.company.name(),
      consumption,
      date: faker.date.recent({ days: 14 }).toISOString().slice(0, 10),
    });
  }
  return rows;
}

function writeCSV(filepath, rows) {
  const headers = ['id', 'location', 'consumption', 'date'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push([row.id, `"${row.location}"`, row.consumption, row.date].join(','));
  }
  fs.writeFileSync(filepath, lines.join('\n'));
}

function writeSustainabilitySummary(PDFDocument, fs, faker, filepath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    stream.on('finish', resolve);
    stream.on('error', reject);

    const reportDate = faker.date.recent({ days: 60 }).toISOString().slice(0, 10);
    doc.fontSize(20).font('Helvetica-Bold').text('Sustainability Summary Report', 50, 50);
    doc.fontSize(11).font('Helvetica')
      .text(`Report ID: ${faker.string.alphanumeric(10).toUpperCase()} | Date: ${reportDate}`, 50, 80);
    doc.moveTo(50, 100).lineTo(550, 100).stroke();
    doc.fontSize(14).font('Helvetica-Bold').text('Executive Summary', 50, 120);
    doc.fontSize(11).font('Helvetica')
      .text('This report provides an overview of energy consumption and sustainability metrics across our facilities. All monitored zones are operating within expected parameters.', 50, 150, { width: 500 });
    doc.fontSize(12).font('Helvetica-Bold').text('Key Metrics', 50, 220);
    doc.font('Helvetica')
      .text('• Average consumption: 62 kWh (within baseline)', 70, 250)
      .text('• Carbon intensity: 0.28 kg CO2/kWh', 70, 270)
      .text('• Renewable energy share: 34%', 70, 290);
    doc.fontSize(10).font('Helvetica')
      .text(`Contact: sustainability@company.com | Next review: ${faker.date.soon({ days: 30 }).toISOString().slice(0, 10)}`, 50, 400);
    doc.end();
  });
}

function writeAuditReportCritical(PDFDocument, fs, faker, filepath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    stream.on('finish', resolve);
    stream.on('error', reject);

    const reportDate = faker.date.recent({ days: 7 }).toISOString().slice(0, 10);
    const criticalValue = faker.number.int({ min: 500, max: 650 });
    doc.fontSize(20).font('Helvetica-Bold').text('Audit Report — Critical Findings', 50, 50);
    doc.fontSize(11).font('Helvetica')
      .text(`Audit ID: AUD-${faker.string.numeric(6)} | Date: ${reportDate}`, 50, 80);
    doc.moveTo(50, 100).lineTo(550, 100).stroke();
    doc.fontSize(14).font('Helvetica-Bold').text('Findings', 50, 120);
    doc.fontSize(11).font('Helvetica')
      .text('During the facility audit, several areas were inspected. Block C was identified as requiring immediate attention due to elevated consumption levels.', 50, 150, { width: 500 });
    doc.fontSize(12).font('Helvetica-Bold').text('Block C — Critical Alert', 50, 230);
    doc.rect(50, 255, 500, 55).fillAndStroke('#ffebee', '#d32f2f');
    doc.fillColor('#b71c1c').fontSize(12).font('Helvetica-Bold')
      .text(`Consumption: ${criticalValue} kWh — CRITICAL`, 70, 275);
    doc.fillColor('black').fontSize(11).font('Helvetica')
      .text('Block C exceeds baseline by 42%. Immediate investigation recommended.', 70, 295);
    doc.fontSize(11).font('Helvetica')
      .text('Recommended actions: Review HVAC settings, audit after-hours equipment, and verify lighting controls.', 50, 340, { width: 500 });
    doc.fontSize(10).font('Helvetica')
      .text('This is an automated audit report. Escalate to facilities management.', 50, 450);
    doc.end();
  });
}

async function run() {
  console.log('TerraInsight Demo Data Generator\n');
  const isEsm = isEsmProject();
  console.log(`Project type: ${isEsm ? 'ESM' : 'CommonJS'}`);

  ensureDirs();
  const { PDFDocument, loadFaker } = loadDeps();
  const faker = await loadFaker();

  const greenRows = generateGreenReport(faker);
  writeCSV(path.join(CSV_DIR, 'green_report.csv'), greenRows);
  console.log(`Generated green_report.csv (${greenRows.length} records, consumption < 80)`);

  const anomalyRows = generateAnomalyReport(faker);
  writeCSV(path.join(CSV_DIR, 'anomaly_report.csv'), anomalyRows);
  console.log(`Generated anomaly_report.csv (${anomalyRows.length} records, ≥2 with consumption > 150)`);

  const criticalRows = generateCriticalWaste(faker);
  writeCSV(path.join(CSV_DIR, 'critical_waste.csv'), criticalRows);
  console.log(`Generated critical_waste.csv (${criticalRows.length} records, ≥1 with consumption > 500)`);

  await writeSustainabilitySummary(PDFDocument, fs, faker, path.join(PDF_DIR, 'sustainability_summary.pdf'));
  console.log('Generated sustainability_summary.pdf (no anomalies)');

  await writeAuditReportCritical(PDFDocument, fs, faker, path.join(PDF_DIR, 'audit_report_critical.pdf'));
  console.log('Generated audit_report_critical.pdf (Block C, critical, large value)');

  console.log(`\nDemo data complete. Output: ${DEMO_ROOT}`);
  console.log('Upload files from demo-data/csv and demo-data/pdf to test the analysis route.');
}

// Top-level await requires ESM; script runs as CommonJS
(async () => { // NOSONAR
  try {
    await run();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
