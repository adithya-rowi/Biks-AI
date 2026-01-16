/**
 * PDF Export Service
 *
 * Generates professional PDF reports for CIS Controls assessments.
 * Uses pdfkit for PDF generation with custom formatting.
 */

import PDFDocument from 'pdfkit';
import { storage } from '../storage';
import type { Assessment, Safeguard, Criterion, Finding } from '@shared/schema';

// ============================================================================
// Types
// ============================================================================

export class PDFExportError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'PDFExportError';
  }
}

export interface ExportOptions {
  includeGapDetails?: boolean;
  includeFindings?: boolean;
  includeCriteria?: boolean;
}

interface SafeguardWithCriteria extends Safeguard {
  criteria: Criterion[];
}

// ============================================================================
// Color Constants
// ============================================================================

const COLORS = {
  primary: '#0F766E', // Teal
  secondary: '#6B7280', // Gray
  success: '#059669', // Green
  warning: '#D97706', // Amber
  danger: '#DC2626', // Red
  muted: '#9CA3AF', // Light gray
  background: '#F3F4F6', // Light background
  white: '#FFFFFF',
  black: '#111827',
  tableBorder: '#E5E7EB',
  tableHeader: '#F9FAFB',
};

const STATUS_COLORS: Record<string, string> = {
  covered: COLORS.success,
  partial: COLORS.warning,
  gap: COLORS.danger,
  met: COLORS.success,
  not_met: COLORS.danger,
  insufficient: COLORS.muted,
};

const SEVERITY_COLORS: Record<string, string> = {
  high: COLORS.danger,
  medium: COLORS.warning,
  low: COLORS.muted,
};

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generate a PDF report for an assessment
 *
 * @param assessmentId - The ID of the assessment to export
 * @param options - Export options
 * @returns Buffer containing the PDF data
 */
export async function generateAssessmentReport(
  assessmentId: string,
  options: ExportOptions = {}
): Promise<Buffer> {
  const {
    includeGapDetails = true,
    includeFindings = true,
    includeCriteria = true,
  } = options;

  // Fetch assessment data
  const assessment = await storage.getAssessment(assessmentId);
  if (!assessment) {
    throw new PDFExportError(`Assessment not found: ${assessmentId}`, 'NOT_FOUND');
  }

  // Fetch related data
  const safeguards = await storage.getSafeguardsByAssessment(assessmentId);
  const findings = await storage.getFindingsByAssessment(assessmentId);

  // Fetch criteria for each safeguard
  const safeguardsWithCriteria: SafeguardWithCriteria[] = await Promise.all(
    safeguards.map(async (sg) => {
      const criteria = await storage.getCriteriaBySafeguard(sg.id);
      return { ...sg, criteria };
    })
  );

  // Sort safeguards by CIS ID
  safeguardsWithCriteria.sort((a, b) => {
    const [aMajor, aMinor] = a.cisId.split('.').map(Number);
    const [bMajor, bMinor] = b.cisId.split('.').map(Number);
    if (aMajor !== bMajor) return aMajor - bMajor;
    return aMinor - bMinor;
  });

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true,
    info: {
      Title: `CIS Controls Assessment - ${assessment.name}`,
      Author: 'Biks.ai',
      Subject: 'Security Assessment Report',
      CreationDate: new Date(),
    },
  });

  // Collect PDF data in a buffer
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Generate PDF content
  addCoverPage(doc, assessment);
  doc.addPage();

  addExecutiveSummary(doc, assessment, safeguardsWithCriteria);
  doc.addPage();

  addSafeguardsTable(doc, safeguardsWithCriteria);

  if (includeGapDetails) {
    const gapsAndPartials = safeguardsWithCriteria.filter(
      (sg) => sg.status === 'gap' || sg.status === 'partial'
    );
    if (gapsAndPartials.length > 0) {
      doc.addPage();
      addGapDetails(doc, gapsAndPartials, includeCriteria);
    }
  }

  if (includeFindings && findings.length > 0) {
    doc.addPage();
    addFindingsSummary(doc, findings);
  }

  // Add page numbers
  addPageNumbers(doc);

  // Finalize the PDF
  doc.end();

  // Wait for PDF generation to complete
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
}

// ============================================================================
// PDF Sections
// ============================================================================

function addCoverPage(doc: PDFKit.PDFDocument, assessment: Assessment): void {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Background header bar
  doc.rect(0, 0, pageWidth, 200).fill(COLORS.primary);

  // Logo/Title area
  doc.fillColor(COLORS.white).fontSize(36).font('Helvetica-Bold');
  doc.text('Biks.ai', 50, 60);

  doc.fontSize(14).font('Helvetica');
  doc.text('CIS Controls Assessment Platform', 50, 105);

  // Main title
  doc.fillColor(COLORS.black).fontSize(28).font('Helvetica-Bold');
  doc.text('Security Assessment Report', 50, 260, { align: 'center', width: pageWidth - 100 });

  // Assessment name
  doc.fontSize(20).font('Helvetica');
  doc.text(assessment.name, 50, 310, { align: 'center', width: pageWidth - 100 });

  // Framework badge
  doc.fontSize(12).fillColor(COLORS.secondary);
  doc.text(assessment.framework, 50, 350, { align: 'center', width: pageWidth - 100 });

  // Divider line
  doc.moveTo(100, 400).lineTo(pageWidth - 100, 400).strokeColor(COLORS.tableBorder).stroke();

  // Report details
  const detailsY = 440;
  doc.fontSize(11).fillColor(COLORS.secondary);

  doc.text('Generated:', 100, detailsY);
  doc.fillColor(COLORS.black).text(formatDate(new Date()), 200, detailsY);

  doc.fillColor(COLORS.secondary).text('Assessment Date:', 100, detailsY + 25);
  doc.fillColor(COLORS.black).text(formatDate(assessment.createdAt), 200, detailsY + 25);

  if (assessment.dueDate) {
    doc.fillColor(COLORS.secondary).text('Due Date:', 100, detailsY + 50);
    doc.fillColor(COLORS.black).text(assessment.dueDate, 200, detailsY + 50);
  }

  doc.fillColor(COLORS.secondary).text('Status:', 100, detailsY + 75);
  doc.fillColor(COLORS.black).text(capitalizeFirst(assessment.status), 200, detailsY + 75);

  // Maturity score circle at bottom
  const scoreY = pageHeight - 200;
  const centerX = pageWidth / 2;

  // Score circle
  doc.circle(centerX, scoreY, 50).fillAndStroke(COLORS.background, COLORS.primary);

  // Score number
  doc.fillColor(COLORS.primary).fontSize(32).font('Helvetica-Bold');
  const scoreText = `${assessment.maturityScore}%`;
  doc.text(scoreText, centerX - 35, scoreY - 15, { width: 70, align: 'center' });

  // Score label
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.secondary);
  doc.text('Maturity Score', centerX - 50, scoreY + 60, { width: 100, align: 'center' });

  // Footer
  doc.fontSize(9).fillColor(COLORS.muted);
  doc.text('Confidential - For Internal Use Only', 50, pageHeight - 50, {
    align: 'center',
    width: pageWidth - 100,
  });
}

function addExecutiveSummary(
  doc: PDFKit.PDFDocument,
  assessment: Assessment,
  safeguards: SafeguardWithCriteria[]
): void {
  const pageWidth = doc.page.width;

  // Section header
  addSectionHeader(doc, 'Executive Summary');

  let currentY = doc.y + 20;

  // Overview paragraph
  doc.fontSize(11).fillColor(COLORS.black).font('Helvetica');
  const overviewText = `This report presents the findings of the ${assessment.framework} assessment for "${assessment.name}". The assessment evaluated ${safeguards.length} security safeguards against industry best practices and organizational policies.`;
  doc.text(overviewText, 50, currentY, { width: pageWidth - 100, lineGap: 4 });

  currentY = doc.y + 30;

  // Stats boxes
  const boxWidth = (pageWidth - 140) / 4;
  const boxHeight = 80;
  const boxes = [
    { label: 'Maturity Score', value: `${assessment.maturityScore}%`, color: COLORS.primary },
    { label: 'Covered', value: `${assessment.controlsCovered}`, color: COLORS.success },
    { label: 'Partial', value: `${assessment.controlsPartial}`, color: COLORS.warning },
    { label: 'Gap', value: `${assessment.controlsGap}`, color: COLORS.danger },
  ];

  boxes.forEach((box, i) => {
    const x = 50 + i * (boxWidth + 10);

    // Box background
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 5).fill(COLORS.background);

    // Value
    doc.fillColor(box.color).fontSize(24).font('Helvetica-Bold');
    doc.text(box.value, x, currentY + 15, { width: boxWidth, align: 'center' });

    // Label
    doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica');
    doc.text(box.label, x, currentY + 50, { width: boxWidth, align: 'center' });
  });

  currentY += boxHeight + 40;

  // Coverage breakdown
  doc.fillColor(COLORS.black).fontSize(14).font('Helvetica-Bold');
  doc.text('Coverage Breakdown', 50, currentY);
  currentY += 25;

  const total = assessment.totalControls || safeguards.length;
  const coveredPct = total > 0 ? Math.round((assessment.controlsCovered / total) * 100) : 0;
  const partialPct = total > 0 ? Math.round((assessment.controlsPartial / total) * 100) : 0;
  const gapPct = total > 0 ? Math.round((assessment.controlsGap / total) * 100) : 0;

  // Progress bar
  const barWidth = pageWidth - 100;
  const barHeight = 20;

  // Background
  doc.roundedRect(50, currentY, barWidth, barHeight, 3).fill(COLORS.background);

  // Covered section
  if (coveredPct > 0) {
    const coveredWidth = (coveredPct / 100) * barWidth;
    doc.rect(50, currentY, coveredWidth, barHeight).fill(COLORS.success);
  }

  // Partial section
  if (partialPct > 0) {
    const partialStart = 50 + (coveredPct / 100) * barWidth;
    const partialWidth = (partialPct / 100) * barWidth;
    doc.rect(partialStart, currentY, partialWidth, barHeight).fill(COLORS.warning);
  }

  // Gap section
  if (gapPct > 0) {
    const gapStart = 50 + ((coveredPct + partialPct) / 100) * barWidth;
    const gapWidth = (gapPct / 100) * barWidth;
    doc.rect(gapStart, currentY, gapWidth, barHeight).fill(COLORS.danger);
  }

  currentY += barHeight + 15;

  // Legend
  const legendItems = [
    { label: `Covered (${coveredPct}%)`, color: COLORS.success },
    { label: `Partial (${partialPct}%)`, color: COLORS.warning },
    { label: `Gap (${gapPct}%)`, color: COLORS.danger },
  ];

  let legendX = 50;
  legendItems.forEach((item) => {
    doc.circle(legendX + 5, currentY + 5, 5).fill(item.color);
    doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica');
    doc.text(item.label, legendX + 15, currentY, { continued: false });
    legendX += 120;
  });

  currentY += 40;

  // Key findings summary
  doc.fillColor(COLORS.black).fontSize(14).font('Helvetica-Bold');
  doc.text('Key Observations', 50, currentY);
  currentY += 25;

  doc.fontSize(11).font('Helvetica').fillColor(COLORS.black);
  const observations = generateObservations(assessment, safeguards);
  observations.forEach((obs) => {
    doc.text(`• ${obs}`, 60, currentY, { width: pageWidth - 120, lineGap: 4 });
    currentY = doc.y + 10;
  });
}

function addSafeguardsTable(
  doc: PDFKit.PDFDocument,
  safeguards: SafeguardWithCriteria[]
): void {
  addSectionHeader(doc, 'Safeguards Overview');

  const pageWidth = doc.page.width;
  const tableLeft = 50;
  const tableWidth = pageWidth - 100;

  // Column definitions
  const columns = [
    { header: 'CIS ID', width: 50 },
    { header: 'Safeguard Name', width: tableWidth - 230 },
    { header: 'Status', width: 60 },
    { header: 'Score', width: 50 },
    { header: 'Owner', width: 70 },
  ];

  let currentY = doc.y + 20;
  const rowHeight = 25;
  const headerHeight = 30;

  // Function to draw table header
  const drawHeader = () => {
    doc.rect(tableLeft, currentY, tableWidth, headerHeight).fill(COLORS.tableHeader);
    doc.strokeColor(COLORS.tableBorder).lineWidth(0.5);
    doc.rect(tableLeft, currentY, tableWidth, headerHeight).stroke();

    let colX = tableLeft;
    doc.fillColor(COLORS.black).fontSize(9).font('Helvetica-Bold');
    columns.forEach((col) => {
      doc.text(col.header, colX + 5, currentY + 10, { width: col.width - 10 });
      colX += col.width;
    });

    currentY += headerHeight;
  };

  // Draw initial header
  drawHeader();

  // Draw rows
  safeguards.forEach((sg, index) => {
    // Check if we need a new page
    if (currentY + rowHeight > doc.page.height - 80) {
      doc.addPage();
      currentY = 50;
      drawHeader();
    }

    // Row background (alternating)
    if (index % 2 === 1) {
      doc.rect(tableLeft, currentY, tableWidth, rowHeight).fill('#FAFAFA');
    }

    // Row border
    doc.strokeColor(COLORS.tableBorder).lineWidth(0.5);
    doc.rect(tableLeft, currentY, tableWidth, rowHeight).stroke();

    // Cell content
    let colX = tableLeft;
    doc.fontSize(8).font('Helvetica');

    // CIS ID
    doc.fillColor(COLORS.primary).text(sg.cisId, colX + 5, currentY + 8, {
      width: columns[0].width - 10,
    });
    colX += columns[0].width;

    // Name (truncate if too long)
    doc.fillColor(COLORS.black);
    const name = sg.name.length > 45 ? sg.name.substring(0, 42) + '...' : sg.name;
    doc.text(name, colX + 5, currentY + 8, { width: columns[1].width - 10 });
    colX += columns[1].width;

    // Status with color
    const statusColor = STATUS_COLORS[sg.status] || COLORS.muted;
    doc.fillColor(statusColor).font('Helvetica-Bold');
    doc.text(capitalizeFirst(sg.status), colX + 5, currentY + 8, {
      width: columns[2].width - 10,
    });
    colX += columns[2].width;

    // Score
    doc.fillColor(COLORS.black).font('Helvetica');
    doc.text(`${sg.score}%`, colX + 5, currentY + 8, { width: columns[3].width - 10 });
    colX += columns[3].width;

    // Owner
    doc.fillColor(COLORS.secondary);
    doc.text(sg.owner || '-', colX + 5, currentY + 8, { width: columns[4].width - 10 });

    currentY += rowHeight;
  });
}

function addGapDetails(
  doc: PDFKit.PDFDocument,
  safeguards: SafeguardWithCriteria[],
  includeCriteria: boolean
): void {
  addSectionHeader(doc, 'Gap Analysis Details');

  const pageWidth = doc.page.width;
  let currentY = doc.y + 20;

  safeguards.forEach((sg, index) => {
    // Check if we need a new page (leave room for at least header + some content)
    if (currentY > doc.page.height - 150) {
      doc.addPage();
      currentY = 50;
    }

    // Safeguard header
    const statusColor = STATUS_COLORS[sg.status] || COLORS.muted;

    // Status badge
    doc.roundedRect(50, currentY, 60, 18, 3).fill(statusColor);
    doc.fillColor(COLORS.white).fontSize(8).font('Helvetica-Bold');
    doc.text(capitalizeFirst(sg.status), 55, currentY + 5, { width: 50, align: 'center' });

    // CIS ID and Name
    doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica-Bold');
    doc.text(`${sg.cisId}`, 120, currentY + 2);

    doc.fillColor(COLORS.black).fontSize(11).font('Helvetica');
    doc.text(sg.name, 160, currentY + 3, { width: pageWidth - 220 });

    currentY = doc.y + 15;

    // Criteria breakdown (if included)
    if (includeCriteria && sg.criteria.length > 0) {
      sg.criteria.forEach((criterion) => {
        // Check for page break
        if (currentY > doc.page.height - 80) {
          doc.addPage();
          currentY = 50;
        }

        const criterionColor = STATUS_COLORS[criterion.status] || COLORS.muted;

        // Bullet point with status color
        doc.circle(60, currentY + 5, 3).fill(criterionColor);

        // Criterion text
        doc.fillColor(COLORS.black).fontSize(9).font('Helvetica');
        const statusLabel = `[${capitalizeFirst(criterion.status)}]`;
        doc.text(`${statusLabel} ${criterion.text}`, 70, currentY, {
          width: pageWidth - 130,
          lineGap: 2,
        });

        // Citation if available
        if (criterion.citationExcerpt) {
          currentY = doc.y + 3;
          doc.fillColor(COLORS.muted).fontSize(8).font('Helvetica-Oblique');
          const excerpt = criterion.citationExcerpt.length > 100
            ? criterion.citationExcerpt.substring(0, 97) + '...'
            : criterion.citationExcerpt;
          doc.text(`"${excerpt}"`, 80, currentY, { width: pageWidth - 140 });
        }

        currentY = doc.y + 10;
      });
    }

    // Add some spacing between safeguards
    currentY += 15;

    // Add divider between safeguards (except last)
    if (index < safeguards.length - 1) {
      doc.moveTo(50, currentY).lineTo(pageWidth - 50, currentY)
        .strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();
      currentY += 20;
    }
  });
}

function addFindingsSummary(doc: PDFKit.PDFDocument, findings: Finding[]): void {
  addSectionHeader(doc, 'Findings Summary');

  const pageWidth = doc.page.width;
  let currentY = doc.y + 20;

  // Sort findings by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sortedFindings = [...findings].sort(
    (a, b) => (severityOrder[a.severity as keyof typeof severityOrder] || 3) -
              (severityOrder[b.severity as keyof typeof severityOrder] || 3)
  );

  sortedFindings.forEach((finding, index) => {
    // Check for page break
    if (currentY > doc.page.height - 150) {
      doc.addPage();
      currentY = 50;
    }

    const severityColor = SEVERITY_COLORS[finding.severity] || COLORS.muted;

    // Finding card background
    doc.roundedRect(50, currentY, pageWidth - 100, 10, 3).fill(severityColor);
    currentY += 15;

    // Finding title
    doc.fillColor(COLORS.black).fontSize(11).font('Helvetica-Bold');
    doc.text(finding.title, 50, currentY, { width: pageWidth - 100 });
    currentY = doc.y + 8;

    // CIS ID and Severity badge
    doc.fillColor(COLORS.secondary).fontSize(9).font('Helvetica');
    doc.text(`CIS ${finding.cisId}`, 50, currentY);

    doc.fillColor(severityColor).font('Helvetica-Bold');
    doc.text(` | ${capitalizeFirst(finding.severity)} Severity`, 100, currentY);
    currentY += 20;

    // Impact
    doc.fillColor(COLORS.black).fontSize(9).font('Helvetica-Bold');
    doc.text('Impact:', 50, currentY);
    doc.font('Helvetica').fillColor(COLORS.secondary);
    doc.text(finding.impact, 50, currentY + 12, { width: pageWidth - 100, lineGap: 2 });
    currentY = doc.y + 10;

    // Recommendation
    doc.fillColor(COLORS.black).font('Helvetica-Bold');
    doc.text('Recommendation:', 50, currentY);
    doc.font('Helvetica').fillColor(COLORS.secondary);
    doc.text(finding.recommendation, 50, currentY + 12, { width: pageWidth - 100, lineGap: 2 });
    currentY = doc.y + 20;

    // Divider (except last)
    if (index < sortedFindings.length - 1) {
      doc.moveTo(50, currentY).lineTo(pageWidth - 50, currentY)
        .strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();
      currentY += 20;
    }
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

function addSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
  const pageWidth = doc.page.width;
  const y = doc.y || 50;

  // Header bar
  doc.rect(0, y, pageWidth, 35).fill(COLORS.primary);

  // Title
  doc.fillColor(COLORS.white).fontSize(16).font('Helvetica-Bold');
  doc.text(title, 50, y + 10);

  doc.y = y + 35;
}

function addPageNumbers(doc: PDFKit.PDFDocument): void {
  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Skip cover page
    if (i === 0) continue;

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica');
    doc.text(`Page ${i} of ${pageCount - 1}`, pageWidth - 100, pageHeight - 30, {
      width: 50,
      align: 'right',
    });

    // Footer line
    doc.moveTo(50, pageHeight - 40).lineTo(pageWidth - 50, pageHeight - 40)
      .strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function generateObservations(
  assessment: Assessment,
  safeguards: SafeguardWithCriteria[]
): string[] {
  const observations: string[] = [];

  const total = assessment.totalControls || safeguards.length;
  const coveredPct = total > 0 ? Math.round((assessment.controlsCovered / total) * 100) : 0;
  const gapPct = total > 0 ? Math.round((assessment.controlsGap / total) * 100) : 0;

  // Overall assessment
  if (assessment.maturityScore >= 80) {
    observations.push(
      `The organization demonstrates strong security maturity with a ${assessment.maturityScore}% score.`
    );
  } else if (assessment.maturityScore >= 50) {
    observations.push(
      `The organization shows moderate security maturity (${assessment.maturityScore}%) with room for improvement.`
    );
  } else {
    observations.push(
      `The assessment reveals significant security gaps with a maturity score of ${assessment.maturityScore}%.`
    );
  }

  // Coverage observation
  if (coveredPct > 0) {
    observations.push(
      `${assessment.controlsCovered} safeguards (${coveredPct}%) are fully covered with documented evidence.`
    );
  }

  // Gap observation
  if (assessment.controlsGap > 0) {
    observations.push(
      `${assessment.controlsGap} safeguards (${gapPct}%) represent security gaps requiring immediate attention.`
    );
  }

  // Partial observation
  if (assessment.controlsPartial > 0) {
    observations.push(
      `${assessment.controlsPartial} safeguards are partially implemented and need additional work to achieve full compliance.`
    );
  }

  // Identify highest-risk areas (most gaps by asset type)
  const assetTypeGaps: Record<string, number> = {};
  safeguards.forEach((sg) => {
    if (sg.status === 'gap') {
      assetTypeGaps[sg.assetType] = (assetTypeGaps[sg.assetType] || 0) + 1;
    }
  });

  const topGapArea = Object.entries(assetTypeGaps).sort(([, a], [, b]) => b - a)[0];
  if (topGapArea && topGapArea[1] > 1) {
    observations.push(
      `The "${topGapArea[0]}" asset category has the most gaps (${topGapArea[1]} safeguards) and should be prioritized.`
    );
  }

  return observations;
}
