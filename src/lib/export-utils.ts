/**
 * StudioDesk Report Export Utilities
 * Provides seamless, client-side CSV and vector PDF document generation.
 */

export interface ExportColumn {
  header: string;
  key: string;
  width?: number; // relative weight or approximate mm
  align?: 'left' | 'right' | 'center';
  formatter?: (val: any, row: any) => string;
}

export interface SummaryKPI {
  label: string;
  value: string | number;
}

export interface CSVExportOptions {
  title?: string;
  subtitle?: string;
  salonName?: string;
  dateRangeText?: string;
  summaryKPIs?: SummaryKPI[];
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  salonName?: string;
  dateRangeText: string;
  columns: ExportColumn[];
  data: any[];
  summaryKPIs?: SummaryKPI[];
  filename?: string;
}

// Numeric keys that should be automatically totaled in the summary row
const MONETARY_OR_NUMERIC_KEYS = new Set([
  'total',
  'subtotal',
  'paid_amount',
  'due_amount',
  'discount_amount',
  'tax_amount',
  'services_revenue',
  'products_revenue',
  'total_revenue',
  'total_commission',
  'total_spent',
  'amount',
  'units_sold',
  'times_booked',
  'sessions_count',
  'customer_count',
  'appointments_count',
  'staff_count',
]);

/**
 * 1. Download Executive CSV with Metadata Header & UTF-8 BOM
 * (Properly opens in Excel / Numbers / Sheets with full title block & summary totals)
 */
export function exportToCSV(
  filename: string,
  columns: ExportColumn[],
  data: any[],
  options?: CSVExportOptions
) {
  if (!data || data.length === 0) {
    alert('No data available to export for the selected date range.');
    return;
  }

  const title = options?.title || 'Report Export';
  const salonName = options?.salonName || 'StudioDesk Workspace';
  const dateRangeText = options?.dateRangeText || 'All Time';
  const generatedAt = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const csvLines: string[] = [];

  // Top Metadata Block for Excel / Sheets
  csvLines.push(`"STUDIODESK ENTERPRISE BUSINESS INTELLIGENCE"`);
  csvLines.push(`"Report Title:","${title.replace(/"/g, '""')}"`);
  csvLines.push(`"Salon / Workspace:","${salonName.replace(/"/g, '""')}"`);
  csvLines.push(`"Period / Date Range:","${dateRangeText.replace(/"/g, '""')}"`);
  csvLines.push(`"Exported Date & Time:","${generatedAt}"`);
  csvLines.push(`"Total Records:","${data.length}"`);

  // KPI Summary Block if present
  if (options?.summaryKPIs && options.summaryKPIs.length > 0) {
    csvLines.push(`"--- EXECUTIVE SUMMARY METRICS ---"`);
    options.summaryKPIs.forEach((kpi) => {
      csvLines.push(`"${kpi.label}:","${String(kpi.value).replace(/"/g, '""')}"`);
    });
  }

  csvLines.push(''); // Spacer row before data table

  // Column Headers
  const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');
  csvLines.push(headers);

  // Data Rows
  data.forEach((row) => {
    const rowValues = columns.map((col) => {
      let val = row[col.key];
      if (col.formatter) {
        val = col.formatter(val, row);
      } else if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'number') {
        val = val.toString();
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvLines.push(rowValues.join(','));
  });

  // Calculate Totals Row for Numeric / Monetary Columns
  const hasTotals = columns.some((col) => MONETARY_OR_NUMERIC_KEYS.has(col.key));
  if (hasTotals) {
    csvLines.push(''); // Spacer row
    const totalsRow = columns.map((col, idx) => {
      if (idx === 0) return `"GRAND TOTAL"`;
      if (MONETARY_OR_NUMERIC_KEYS.has(col.key)) {
        const sum = data.reduce((acc, row) => {
          const raw = row[col.key];
          const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
          return acc + (isNaN(num) ? 0 : num);
        }, 0);
        return `"Rs. ${sum.toFixed(2)}"`;
      }
      return `""`;
    });
    csvLines.push(totalsRow.join(','));
  }

  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 2. Download Publication-Grade Vector PDF Report using jsPDF
 * Includes luxury dark header banner, proportional table scaling, status pill badges,
 * KPI summary grid, grand total row, and formal audit signature block.
 */
export async function exportToPDF(options: PDFExportOptions) {
  const {
    title,
    subtitle = 'Official Audited Multi-Tenant Business Report',
    salonName = 'StudioDesk',
    dateRangeText,
    columns,
    data,
    summaryKPIs = [],
    filename = 'StudioDesk_Report',
  } = options;

  if (!data || data.length === 0) {
    alert('No data available to export for the selected date range.');
    return;
  }

  const { jsPDF } = await import('jspdf');

  // Choose Landscape when columns >= 5 for maximum legibility and comfort
  const isLandscape = columns.length >= 5;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  let currentY = 0;

  function renderHeader(isFirstPage = true) {
    // 1. Luxury Dark Navy Brand Banner
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(0, 0, pageWidth, isFirstPage ? 36 : 16, 'F');

    // 2. Champagne Gold Line (#D4A77F)
    doc.setFillColor(212, 167, 127);
    doc.rect(0, isFirstPage ? 35 : 15, pageWidth, 1.2, 'F');

    if (isFirstPage) {
      // Organization / Salon Title
      doc.setTextColor(212, 167, 127);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`STUDIODESK ENTERPRISE · ${salonName.toUpperCase()}`, margin, 11);

      // Report Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(title.toUpperCase(), margin, 20);

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(subtitle, margin, 27);

      // Metadata Pill on Right
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240); // slate-200
      doc.text(`Period: ${dateRangeText}`, pageWidth - margin, 12, { align: 'right' });
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        pageWidth - margin,
        18,
        { align: 'right' }
      );
      doc.setTextColor(52, 211, 153); // emerald-400
      doc.setFont('helvetica', 'bold');
      doc.text(`● Verified Records: ${data.length}`, pageWidth - margin, 24, { align: 'right' });

      currentY = 42;
    } else {
      // Compact header on following pages
      doc.setTextColor(212, 167, 127);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`${salonName.toUpperCase()} · ${title.toUpperCase()}`, margin, 10);

      doc.setTextColor(203, 213, 225);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Period: ${dateRangeText}`, pageWidth - margin, 10, { align: 'right' });

      currentY = 22;
    }
  }

  renderHeader(true);

  // Render KPI Summary Cards on Page 1 if present
  if (summaryKPIs && summaryKPIs.length > 0) {
    const kpiCount = Math.min(summaryKPIs.length, 4);
    const cardGap = 4;
    const cardWidth = (contentWidth - cardGap * (kpiCount - 1)) / kpiCount;
    const cardHeight = 15;

    summaryKPIs.slice(0, 4).forEach((kpi, idx) => {
      const cardX = margin + idx * (cardWidth + cardGap);

      // Card Background with Subtle Border
      doc.setFillColor(248, 250, 252); // #F8FAFC
      doc.setDrawColor(226, 232, 240); // #E2E8F0
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

      // Top Gold Accent Line on each card
      doc.setFillColor(212, 167, 127);
      doc.rect(cardX + 2, currentY, cardWidth - 4, 0.8, 'F');

      // KPI Label
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const cleanLabel = kpi.label.toUpperCase().replace(/\(₹\)/g, '(RS)');
      doc.text(cleanLabel, cardX + 3.5, currentY + 5.5);

      // KPI Value (Cleanly replace Unicode Rupee with Rs.)
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      const cleanVal = String(kpi.value).replace(/₹/g, 'Rs. ');
      doc.text(cleanVal, cardX + 3.5, currentY + 11.5);
    });

    currentY += cardHeight + 7;
  }

  // Calculate Proportional Column Widths strictly scaled to fit 100% of contentWidth
  const totalWeight = columns.reduce((acc, col) => acc + (col.width || 25), 0);
  const colWidths = columns.map((col) => ((col.width || 25) / totalWeight) * contentWidth);

  // Table Header Row Drawer
  function drawTableHeader() {
    doc.setFillColor(30, 41, 59); // slate-800 (#1E293B)
    doc.rect(margin, currentY, contentWidth, 8, 'F');

    // Bottom gold accent line under header
    doc.setFillColor(212, 167, 127);
    doc.rect(margin, currentY + 7.4, contentWidth, 0.6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    columns.forEach((col, idx) => {
      const w = colWidths[idx];
      const align = col.align || 'left';
      const cleanHeader = col.header.toUpperCase().replace(/\(₹\)/g, '(RS)');
      const textX =
        align === 'right' ? curX + w - 3 : align === 'center' ? curX + w / 2 : curX + 2.5;
      doc.text(cleanHeader, textX, currentY + 5.2, { align });
      curX += w;
    });

    currentY += 8;
  }

  drawTableHeader();

  // Table Body Rows
  const rowHeight = 7.2;

  data.forEach((row, rowIdx) => {
    // Check page overflow
    if (currentY + rowHeight > pageHeight - 20) {
      doc.addPage();
      renderHeader(false);
      drawTableHeader();
    }

    // Alternating Zebra Row Background
    if (rowIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Bottom Row Border
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

    let curX = margin;

    columns.forEach((col, idx) => {
      const w = colWidths[idx];
      let val = row[col.key];

      if (col.formatter) {
        val = col.formatter(val, row);
      } else if (val === null || val === undefined) {
        val = '-';
      } else {
        val = String(val);
      }

      // Convert Unicode Rupee to Rs. to prevent character distortion in standard PDF fonts
      val = val.replace(/₹/g, 'Rs. ');

      const align = col.align || 'left';
      const isStatusCol =
        col.key === 'status' || col.header.toLowerCase().includes('status');

      // Check if this is a Status field that deserves a visual pill badge
      if (isStatusCol && val !== '-') {
        const statusUpper = val.toUpperCase().trim();
        const isPositive =
          statusUpper.includes('PAID') ||
          statusUpper.includes('ACTIVE') ||
          statusUpper.includes('CONFIRMED') ||
          statusUpper.includes('COMPLETED');
        const isWarning =
          statusUpper.includes('PARTIAL') ||
          statusUpper.includes('PENDING') ||
          statusUpper.includes('TRIAL');

        const badgeW = Math.min(w - 3, 18);
        const badgeH = 5;
        const badgeX = align === 'right' ? curX + w - badgeW - 2 : align === 'center' ? curX + (w - badgeW) / 2 : curX + 2;
        const badgeY = currentY + (rowHeight - badgeH) / 2;

        if (isPositive) {
          doc.setFillColor(220, 252, 231); // emerald-100
          doc.setDrawColor(187, 247, 208); // emerald-200
          doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'FD');
          doc.setTextColor(21, 128, 61); // emerald-700
        } else if (isWarning) {
          doc.setFillColor(254, 243, 199); // amber-100
          doc.setDrawColor(253, 230, 138); // amber-200
          doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'FD');
          doc.setTextColor(180, 83, 9); // amber-700
        } else {
          doc.setFillColor(255, 228, 230); // rose-100
          doc.setDrawColor(254, 205, 211); // rose-200
          doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'FD');
          doc.setTextColor(190, 18, 60); // rose-700
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text(statusUpper.slice(0, 10), badgeX + badgeW / 2, badgeY + 3.6, { align: 'center' });
      } else {
        // Standard Text / Numeric Cell
        doc.setFont('helvetica', align === 'right' ? 'bold' : 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59); // slate-800

        // Fit string to cell width with subtle ellipsis if excessively long
        const maxChars = Math.floor(w / 1.75);
        if (val.length > maxChars) {
          val = val.substring(0, Math.max(1, maxChars - 2)) + '..';
        }

        const textX =
          align === 'right' ? curX + w - 2.5 : align === 'center' ? curX + w / 2 : curX + 2.5;
        doc.text(val, textX, currentY + 4.8, { align });
      }

      curX += w;
    });

    currentY += rowHeight;
  });

  // Calculate & Draw Grand Total Row if numeric/monetary columns exist
  const hasTotals = columns.some((col) => MONETARY_OR_NUMERIC_KEYS.has(col.key));
  if (hasTotals) {
    if (currentY + 12 > pageHeight - 20) {
      doc.addPage();
      renderHeader(false);
      drawTableHeader();
    }

    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, currentY, contentWidth, 8, 'F');

    // Double Top Border
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.line(margin, currentY, margin + contentWidth, currentY);
    doc.line(margin, currentY + 0.6, margin + contentWidth, currentY + 0.6);

    // Bottom Border
    doc.line(margin, currentY + 8, margin + contentWidth, currentY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42); // slate-900

    let curX = margin;
    columns.forEach((col, idx) => {
      const w = colWidths[idx];
      const align = col.align || 'left';

      if (idx === 0) {
        doc.text('GRAND TOTAL', curX + 2.5, currentY + 5.2);
      } else if (MONETARY_OR_NUMERIC_KEYS.has(col.key)) {
        const sum = data.reduce((acc, row) => {
          const raw = row[col.key];
          const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
          return acc + (isNaN(num) ? 0 : num);
        }, 0);

        const isCount = col.key.includes('count') || col.key.includes('units') || col.key.includes('booked');
        const formattedSum = isCount
          ? sum.toLocaleString('en-IN')
          : `Rs. ${sum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const textX =
          align === 'right' ? curX + w - 2.5 : align === 'center' ? curX + w / 2 : curX + 2.5;
        doc.text(formattedSum, textX, currentY + 5.2, { align });
      }

      curX += w;
    });

    currentY += 12;
  }

  // Official Audit & Signatory Block on final page
  if (currentY + 22 > pageHeight - 15) {
    doc.addPage();
    renderHeader(false);
  }

  currentY += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, margin + contentWidth, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('DIGITALLY AUDITED TRANSACTION RECORD · STUDIODESK SECURE MULTI-TENANT CLOUD ERP', margin, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Prepared by: StudioDesk Automated Engine', margin, currentY + 6);
  doc.text('Authorized Signatory: ____________________________________', pageWidth - margin, currentY + 6, {
    align: 'right',
  });

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `StudioDesk Confidential Document · Page ${i} of ${totalPages} · Strictly for Internal & Tax Auditing`,
      pageWidth / 2,
      pageHeight - 4.5,
      { align: 'center' }
    );
  }

  // Trigger browser download
  doc.save(`${filename.replace(/\.pdf$/, '')}.pdf`);
}
