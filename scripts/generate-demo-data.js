#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const DEMO_DATA_DIR = path.join(__dirname, '..', 'demo-data');

// Ensure demo-data directory exists
if (!fs.existsSync(DEMO_DATA_DIR)) {
  fs.mkdirSync(DEMO_DATA_DIR, { recursive: true });
  console.log('✅ Created demo-data directory');
}

// Generate CSV files
function generateCSV(filename, data) {
  const headers = ['timestamp', 'location', 'consumption', 'energy_kwh', 'waste_kg', 'efficiency_score'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.join(','))
  ].join('\n');

  const filePath = path.join(DEMO_DATA_DIR, filename);
  fs.writeFileSync(filePath, csvContent);
  console.log(`✅ Generated ${filename}`);
}

// Generate green report (all values < 80)
const greenData = [
  ['2024-01-15T08:00:00Z', 'Block A', 45, 12.5, 2.1, 85],
  ['2024-01-15T09:00:00Z', 'Block A', 52, 15.2, 1.8, 88],
  ['2024-01-15T10:00:00Z', 'Block B', 38, 11.1, 1.5, 92],
  ['2024-01-15T11:00:00Z', 'Block B', 41, 12.8, 1.9, 89],
  ['2024-01-15T12:00:00Z', 'Block C', 67, 18.9, 3.2, 78],
  ['2024-01-15T13:00:00Z', 'Block C', 72, 19.8, 2.8, 75],
  ['2024-01-15T14:00:00Z', 'Parking', 15, 4.2, 0.5, 95],
  ['2024-01-15T15:00:00Z', 'Parking', 18, 5.1, 0.8, 93],
];

generateCSV('green_report.csv', greenData);

// Generate anomaly report (values > 150)
const anomalyData = [
  ['2024-01-16T08:00:00Z', 'Block A', 95, 28.5, 4.1, 65],
  ['2024-01-16T09:00:00Z', 'Block A', 180, 52.3, 8.7, 45],
  ['2024-01-16T10:00:00Z', 'Block B', 78, 22.1, 3.5, 71],
  ['2024-01-16T11:00:00Z', 'Block B', 165, 48.8, 9.2, 42],
  ['2024-01-16T12:00:00Z', 'Block C', 89, 25.9, 4.8, 68],
  ['2024-01-16T13:00:00Z', 'Block C', 95, 27.8, 5.2, 66],
  ['2024-01-16T14:00:00Z', 'HVAC System', 220, 78.9, 12.5, 28],
  ['2024-01-16T15:00:00Z', 'HVAC System', 195, 68.2, 11.1, 35],
];

generateCSV('anomaly_report.csv', anomalyData);

// Generate critical waste report (values > 500)
const criticalData = [
  ['2024-01-17T08:00:00Z', 'Industrial Unit A', 650, 189.5, 45.2, 15],
  ['2024-01-17T09:00:00Z', 'Industrial Unit A', 720, 210.8, 52.1, 12],
  ['2024-01-17T10:00:00Z', 'Manufacturing Floor', 580, 168.9, 38.7, 22],
  ['2024-01-17T11:00:00Z', 'Manufacturing Floor', 890, 245.6, 68.9, 8],
  ['2024-01-17T12:00:00Z', 'Cooling System', 1200, 385.2, 89.5, 5],
  ['2024-01-17T13:00:00Z', 'Cooling System', 1150, 362.8, 82.1, 6],
  ['2024-01-17T14:00:00Z', 'Block C Critical', 750, 225.5, 58.9, 18],
  ['2024-01-17T15:00:00Z', 'Block C Critical', 680, 198.7, 48.2, 20],
];

generateCSV('critical_waste.csv', criticalData);

// Generate actual PDF file
function generatePDF() {
  const doc = new PDFDocument();
  const pdfPath = path.join(DEMO_DATA_DIR, 'sustainability_summary.pdf');
  
  doc.pipe(fs.createWriteStream(pdfPath));
  
  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('SUSTAINABILITY SUMMARY REPORT', 50, 50);
  doc.fontSize(12).font('Helvetica').text('Date: January 2024 | Location: Corporate Campus | Report ID: ENV-2024-001', 50, 80);
  
  // Draw line
  doc.moveTo(50, 100).lineTo(550, 100).stroke();
  
  // Executive Summary
  doc.fontSize(16).font('Helvetica-Bold').text('EXECUTIVE SUMMARY', 50, 120);
  doc.fontSize(11).font('Helvetica')
     .text('This report summarizes energy consumption and waste management findings across our corporate campus for January 2024.', 50, 150, { width: 500 });
  
  // Key Findings
  doc.fontSize(14).font('Helvetica-Bold').text('KEY FINDINGS:', 50, 190);
  
  doc.fontSize(11).font('Helvetica-Bold').text('1. ENERGY CONSUMPTION ANALYSIS', 50, 220);
  doc.font('Helvetica')
     .text('• Overall consumption increased by 15% compared to December 2023', 70, 240)
     .text('• Block A: Normal operations within acceptable parameters', 70, 255)
     .text('• Block B: Slight increase in HVAC usage due to weather conditions', 70, 270)
     .text('• Block C: CRITICAL - Excessive energy waste detected', 70, 285);
  
  doc.fontSize(11).font('Helvetica-Bold').text('2. BLOCK C ENERGY WASTE ISSUES', 50, 315);
  doc.font('Helvetica')
     .text('• Consumption levels 40% above baseline during off-hours', 70, 335)
     .text('• HVAC system running continuously despite building vacancy', 70, 350)
     .text('• Lighting systems active 24/7 in unoccupied areas', 70, 365)
     .text('• Server room cooling inefficiency detected', 70, 380);
  
  doc.fontSize(11).font('Helvetica-Bold').text('3. ENVIRONMENTAL IMPACT', 50, 410);
  doc.font('Helvetica')
     .text('• CO2 emissions increased by 12% due to Block C waste', 70, 430)
     .text('• Estimated annual waste cost: €45,000 if not addressed', 70, 445)
     .text('• Sustainability score dropped from 85 to 68', 70, 460);
  
  // Recommendations section
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold').text('RECOMMENDATIONS', 50, 50);
  
  doc.fontSize(12).font('Helvetica-Bold').text('IMMEDIATE ACTIONS (Block C):', 50, 80);
  doc.fontSize(11).font('Helvetica')
     .text('• Install smart thermostats with occupancy sensors', 70, 100)
     .text('• Implement automated lighting controls', 70, 115)
     .text('• Audit server room cooling systems', 70, 130)
     .text('• Schedule HVAC maintenance and optimization', 70, 145);
  
  // Critical Alert Box
  doc.rect(50, 180, 500, 100).fillAndStroke('#ffebee', '#d32f2f');
  doc.fillColor('#d32f2f').fontSize(14).font('Helvetica-Bold')
     .text('⚠️ CRITICAL ALERT: BLOCK C ENERGY WASTE', 70, 200);
  doc.fillColor('black').fontSize(11).font('Helvetica')
     .text('Block C shows excessive energy consumption patterns indicating', 70, 220)
     .text('significant environmental waste. Immediate action required.', 70, 235)
     .text('Priority Level: HIGH | Est. Annual Cost Impact: €45,000', 70, 255);
  
  // Monitoring Metrics
  doc.fontSize(14).font('Helvetica-Bold').text('MONITORING METRICS', 50, 310);
  doc.fontSize(11).font('Helvetica')
     .text('Current sustainability scores:', 50, 340)
     .text('• Block A: 88/100 (EXCELLENT)', 70, 360)
     .text('• Block B: 82/100 (GOOD)', 70, 375)
     .text('• Block C: 45/100 (CRITICAL - NEEDS IMMEDIATE ACTION)', 70, 390)
     .text('• Overall Campus: 68/100 (REQUIRES IMPROVEMENT)', 70, 405);
  
  // Footer
  doc.fontSize(10).font('Helvetica')
     .text('Contact: sustainability@company.com | Next Review: February 15, 2024', 50, 450)
     .text('This document contains sensitive environmental data. Handle according to company confidentiality policies.', 50, 470);
  
  doc.end();
  console.log('✅ Generated sustainability_summary.pdf');
}

generatePDF();

// For a real PDF, you would need a library like PDFKit
console.log('\n📋 DEMO DATA GENERATION COMPLETE!');
console.log(`📁 Files created in: ${DEMO_DATA_DIR}`);
console.log(`
📊 Generated files:
  • green_report.csv (normal consumption < 80)
  • anomaly_report.csv (high consumption > 150) 
  • critical_waste.csv (critical values > 500)
  • sustainability_summary.pdf (Block C energy waste report)

🧪 TEST THE SYSTEM:
  1. Start your dev server: npm run dev
  2. Upload these files to test anomaly detection
  3. Ask the AI: "What did you find in that report?"

✅ Real PDF generated using PDFKit!
`);