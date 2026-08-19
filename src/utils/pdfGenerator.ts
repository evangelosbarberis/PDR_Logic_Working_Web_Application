import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Estimate, PanelId, MarkupType } from '../types';
import { PANEL_CONFIGS, COIN_DIMENSIONS } from '../data/matrix';

export interface GeneratedPdfResult {
  doc: jsPDF;
  blob: Blob;
  dataUri: string;
  base64: string;
  fileName: string;
}

const MARKUP_LABELS: Record<MarkupType, string> = {
  aluminumPanels: 'Alum +25%',
  highStrengthSteel: 'HSS +25%',
  doublePanels: 'Double Metal +25%',
  gluePull: 'Glue Pull +25%',
  limitedAccess: 'Obstructed +25%',
  xlPanel: 'XL Panel +25%',
};

export interface PdfOptions {
  theme?: 'dark' | 'light';
}

export function generateEstimatePdf(estimate: Estimate, options: PdfOptions = { theme: 'dark' }): GeneratedPdfResult {
  const isDark = options.theme !== 'light'; // Default to website black theme

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 612 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 792 pt
  const margin = 24; // Compact 24pt margins to guarantee 1-page fit

  // Theme color definitions
  const gold = [197, 160, 89]; // #C5A059
  const bg = isDark ? [15, 15, 15] : [255, 255, 255]; // #0F0F0F or #FFFFFF
  const cardBg = isDark ? [24, 24, 24] : [248, 250, 252]; // #181818 or Slate-50
  const cardBorder = isDark ? [45, 45, 45] : [226, 232, 240];
  const textPrimary = isDark ? [224, 222, 215] : [15, 23, 42]; // #E0DED7 or Slate-900
  const textMuted = isDark ? [142, 142, 142] : [100, 116, 139]; // #8E8E8E or Slate-500
  const rowAltBg = isDark ? [20, 20, 20] : [241, 245, 249];

  // 1. Fill entire 1-page canvas background
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer luxury boundary hairline
  doc.setDrawColor(isDark ? 45 : 220, isDark ? 45 : 220, isDark ? 45 : 220);
  doc.setLineWidth(0.75);
  doc.rect(margin - 8, margin - 8, pageWidth - (margin - 8) * 2, pageHeight - (margin - 8) * 2, 'S');

  // 2. Header Banner (Compact: Y = 24 to 74)
  doc.setFillColor(isDark ? 20 : 245, isDark ? 20 : 245, isDark ? 20 : 245);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 48, 4, 4, 'F');

  // Gold accent bar
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.rect(margin, margin + 46, pageWidth - margin * 2, 2, 'F');

  // Logo & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('PDR LOGIC', margin + 12, margin + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  doc.text('HAIL DAMAGE VALUATION REPORT', margin + 12, margin + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Precision Paintless Dent Repair • Certified G&G Paradigm 2025 Standard', margin + 12, margin + 41);

  // Right Header Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(estimate.roNumber || '#EST-8829-X', pageWidth - margin - 12, margin + 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  const estDate = new Date(estimate.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(`Date: ${estDate}  •  Status: ${(estimate.status || 'Approved').toUpperCase()}`, pageWidth - margin - 12, margin + 31, { align: 'right' });

  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Insurer: ${estimate.insuranceCompany || 'USAA'}  •  Tech: ${estimate.technicianName || 'Master Tech'}`, pageWidth - margin - 12, margin + 41, { align: 'right' });

  let currentY = margin + 54;

  // 3. Dual Metadata Cards (Compact: Height 62pt)
  const cardWidth = (pageWidth - margin * 2 - 10) / 2;
  const cardHeight = 62;

  // Left Card: Customer & Claim
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('CUSTOMER & CLAIM DETAILS', margin + 8, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Customer:', margin + 8, currentY + 23);
  doc.text('Phone / Email:', margin + 8, currentY + 34);
  doc.text('Insurance Carrier:', margin + 8, currentY + 45);
  doc.text('Claim Number:', margin + 8, currentY + 55);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  doc.text(estimate.customerName || 'Customer', margin + 70, currentY + 23);
  doc.setFont('helvetica', 'normal');
  doc.text(`${estimate.customerPhone || 'N/A'}  /  ${estimate.customerEmail || 'N/A'}`, margin + 70, currentY + 34);
  doc.setFont('helvetica', 'bold');
  doc.text(estimate.insuranceCompany || 'USAA', margin + 70, currentY + 45);
  doc.setFont('courier', 'bold');
  doc.text(estimate.claimNumber || 'N/A', margin + 70, currentY + 55);

  // Right Card: Vehicle Specs
  const rightCardX = margin + cardWidth + 10;
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(rightCardX, currentY, cardWidth, cardHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('VEHICLE & DAMAGE SPECIFICATIONS', rightCardX + 8, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Vehicle:', rightCardX + 8, currentY + 23);
  doc.text('VIN:', rightCardX + 8, currentY + 34);
  doc.text('Body / Doors:', rightCardX + 8, currentY + 45);
  doc.text('Color / Finish:', rightCardX + 8, currentY + 55);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  doc.text(`${estimate.vehicle.year || ''} ${estimate.vehicle.make || ''} ${estimate.vehicle.model || ''}`, rightCardX + 65, currentY + 23);
  doc.setFont('courier', 'bold');
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(estimate.vehicle.vin || 'N/A', rightCardX + 65, currentY + 34);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2]);
  doc.text(`${estimate.vehicle.bodyClass || 'Sedan'} (${estimate.vehicle.doors || '4'} Doors)`, rightCardX + 65, currentY + 45);
  doc.text(`${estimate.vehicle.color || 'Pearl White OEM'}`, rightCardX + 65, currentY + 55);

  currentY += cardHeight + 8;

  // 4. Panel Breakdown Table (Compact layout strictly bounded to fit page)
  const panelKeys = (Object.keys(estimate.panels) as PanelId[]);
  const damagedPanels = panelKeys.filter(
    id => estimate.panels[id].dentCount > 0 || (estimate.panels[id].riItems && estimate.panels[id].riItems.some(i => i.selected))
  );

  // If no damaged panels recorded, show compact sample rows
  const displayPanels = damagedPanels.length > 0 ? damagedPanels : panelKeys.slice(0, 5);

  const tableData = displayPanels.map(panelId => {
    const p = estimate.panels[panelId];
    const config = PANEL_CONFIGS[panelId];
    const coin = COIN_DIMENSIONS[p.primaryDentSize || 'dime'];
    
    // Markups
    const markupsList = (p.markups || []).map(m => MARKUP_LABELS[m] || m);
    const markupStr = markupsList.length > 0 ? markupsList.join(', ') : '-';

    // R&I Operations
    const activeRi = (p.riItems || []).filter(i => i.selected);
    const riSummary = activeRi.length > 0 
      ? activeRi.map(i => `${i.name} (${i.hours}h)`).join(', ')
      : '-';

    return [
      config.name,
      p.dentCount > 0 ? `${p.dentCount} (${coin.name})` : '-',
      p.dentCount > 0 ? `$${(p.baseCost || 0).toLocaleString()}` : '$0',
      p.oversizeCount > 0 ? `${p.oversizeCount} (+$${p.oversizeCost})` : '-',
      markupStr,
      riSummary,
      p.riCost > 0 ? `$${p.riCost.toLocaleString()}` : '$0',
      `$${(p.totalCost || 0).toLocaleString()}`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      'Panel',
      'Hail / Size',
      'Base Matrix',
      'O/S (+ $50)',
      'Condition (+25%)',
      'R&I Operations',
      'R&I Labor',
      'Total'
    ]],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: isDark ? [24, 24, 24] : [240, 240, 240],
      textColor: [197, 160, 89],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 3,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [textPrimary[0], textPrimary[1], textPrimary[2]],
      cellPadding: 2.8,
      lineColor: isDark ? [38, 38, 38] : [230, 230, 230],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 74 },
      1: { cellWidth: 58 },
      2: { halign: 'right', cellWidth: 50 },
      3: { halign: 'center', cellWidth: 48 },
      4: { cellWidth: 78, fontSize: 6 },
      5: { cellWidth: 160, fontSize: 6 },
      6: { halign: 'right', cellWidth: 44 },
      7: { halign: 'right', fontStyle: 'bold', textColor: isDark ? [197, 160, 89] : [15, 23, 42], cellWidth: 52 },
    },
    alternateRowStyles: {
      fillColor: [rowAltBg[0], rowAltBg[1], rowAltBg[2]],
    },
  });

  const tableEndY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : currentY + 200;

  // 5. Bottom Section (Fixed positioning to guarantee 1-PAGE fit)
  const bottomSectionY = Math.max(tableEndY + 8, pageHeight - 170);
  const leftWidth = pageWidth - margin * 2 - 210 - 10;
  const financialBoxWidth = 210;
  const financialBoxX = pageWidth - margin - financialBoxWidth;

  // Left Side: Certification & Signatures Box
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(margin, bottomSectionY, leftWidth, 116, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('CERTIFICATION & REPAIR AUTHORIZATION', margin + 8, bottomSectionY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const termsLines = [
    '• Valuation computed strictly according to G&G Paradigm 2025 PDR pricing matrix.',
    '• Condition markups represent high tensile aluminum, double metal, glue-pull only access.',
    '• R&I operations calculated according to standard Motor/Mitchell mechanical labor times.',
    '• Workmanship guaranteed against paint checking, fracturing, or surface deterioration.',
  ];
  let termY = bottomSectionY + 21;
  termsLines.forEach(t => {
    doc.text(t, margin + 8, termY);
    termY += 9;
  });

  // Signature lines
  const sigY = bottomSectionY + 76;
  doc.setDrawColor(isDark ? 70 : 200, isDark ? 70 : 200, isDark ? 70 : 200);
  doc.line(margin + 8, sigY + 14, margin + 140, sigY + 14);
  doc.setFontSize(6.5);
  doc.text('Technician / Appraiser Signature', margin + 8, sigY + 22);

  doc.line(margin + 160, sigY + 14, margin + leftWidth - 10, sigY + 14);
  doc.text('Customer Authorization / Date', margin + 160, sigY + 22);

  // Right Side: Luxury Gold Financial Summary Box
  doc.setFillColor(isDark ? 20 : 248, isDark ? 20 : 248, isDark ? 20 : 248);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(1);
  doc.roundedRect(financialBoxX, bottomSectionY, financialBoxWidth, 116, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('G&G PARADIGM 2025 TOTALS', financialBoxX + 10, bottomSectionY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

  let rowY = bottomSectionY + 27;
  const printFinRow = (label: string, value: string, isGold = false, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(isGold ? gold[0] : textPrimary[0], isGold ? gold[1] : textPrimary[1], isGold ? gold[2] : textPrimary[2]);
    doc.text(label, financialBoxX + 10, rowY);
    doc.text(value, financialBoxX + financialBoxWidth - 10, rowY, { align: 'right' });
    rowY += 11.5;
  };

  printFinRow('Total Hail Dents:', `${estimate.summary.totalDentCount || 0} pts`);
  printFinRow('Gross Matrix Base:', `$${(estimate.summary.matrixBaseTotal || 0).toLocaleString()}`);
  printFinRow('Oversize Dents (+ $50):', `+$${(estimate.summary.oversizeTotal || 0).toLocaleString()}`);
  printFinRow('25% Condition Markups:', `+$${(estimate.summary.markupsTotal || 0).toLocaleString()}`);
  printFinRow('R&I Labor Schedule:', `+$${(estimate.summary.riLaborTotal || 0).toLocaleString()}`);

  if (estimate.summary.discountTotal > 0) {
    printFinRow(`Insurer CCC Discount (${estimate.discounts.cccPercentage}%):`, `-$${estimate.summary.discountTotal.toLocaleString()}`, true);
  }

  // Divider
  doc.setDrawColor(isDark ? 55 : 220, isDark ? 55 : 220, isDark ? 55 : 220);
  doc.line(financialBoxX + 8, rowY - 1, financialBoxX + financialBoxWidth - 8, rowY - 1);
  rowY += 6;

  // Grand Total Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text('GRAND TOTAL:', financialBoxX + 10, rowY + 3);
  doc.text(`$${(estimate.summary.grandTotal || 0).toLocaleString()}`, financialBoxX + financialBoxWidth - 10, rowY + 3, { align: 'right' });

  // 6. Footer (Y = 776)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `PDR Logic Appraisal Certificate #${estimate.roNumber} • 1-Page Official Valuation • Dispatched via PDR Logic Mobile Platform`,
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  );

  // Enforce STRICT single-page output (delete any accidental extra pages if table had overflow)
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(doc.getNumberOfPages());
  }

  const fileName = `PDR_Logic_Appraisal_${(estimate.roNumber || 'EST').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');
  const base64 = doc.output('datauristring').split(',')[1] || '';

  return {
    doc,
    blob,
    dataUri,
    base64,
    fileName,
  };
}
