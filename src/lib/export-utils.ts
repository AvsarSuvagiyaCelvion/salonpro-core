/**
 * SalonPro Report Export Utilities
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

/**
 * 1. Download CSV with UTF-8 BOM (properly opens in Excel without character encoding issues)
 */
export function exportToCSV(filename: string, columns: ExportColumn[], data: any[]) {
  if (!data || data.length === 0) {
    alert('No data available to export for the selected date range.');
    return;
  }

  const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
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
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
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
 * 2. Download Styled Luxury Salon Vector PDF using jsPDF
 */
export async function exportToPDF(options: PDFExportOptions) {
  const {
    title,
    subtitle = 'Official Business Report',
    salonName = 'SalonPro',
    dateRangeText,
    columns,
    data,
    summaryKPIs = [],
    filename = 'SalonPro_Report',
  } = options;

  if (!data || data.length === 0) {
    alert('No data available to export for the selected date range.');
    return;
  }

  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: columns.length > 5 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  let currentY = 0;

  function renderHeader(isFirstPage = true) {
    // Top dark brand banner
    doc.setFillColor(16, 20, 31); // #10141F
    doc.rect(0, 0, pageWidth, isFirstPage ? 34 : 16, 'F');

    // Champagne gold line
    doc.setFillColor(212, 167, 127); // #D4A77F
    doc.rect(0, isFirstPage ? 33 : 15, pageWidth, 1.2, 'F');

    if (isFirstPage) {
      // Salon Name / Organization
      doc.setTextColor(212, 167, 127);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(salonName.toUpperCase(), margin, 12);

      // Title & Subtitle
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(title, margin, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(160, 168, 184);
      doc.text(subtitle, margin, 26);

      // Generated Date & Date Range on the right
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text(`Period: ${dateRangeText}`, pageWidth - margin, 14, { align: 'right' });
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 20, { align: 'right' });
      doc.text(`Total Records: ${data.length}`, pageWidth - margin, 26, { align: 'right' });
      currentY = 40;
    } else {
      doc.setTextColor(212, 167, 127);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${salonName} · ${title}`, margin, 10);

      doc.setTextColor(200, 200, 200);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(dateRangeText, pageWidth - margin, 10, { align: 'right' });
      currentY = 22;
    }
  }

  renderHeader(true);

  // Render Summary KPI Cards if present
  if (summaryKPIs.length > 0) {
    const kpiCount = Math.min(summaryKPIs.length, 4);
    const cardGap = 4;
    const cardWidth = (contentWidth - cardGap * (kpiCount - 1)) / kpiCount;
    const cardHeight = 16;

    summaryKPIs.slice(0, 4).forEach((kpi, idx) => {
      const cardX = margin + idx * (cardWidth + cardGap);
      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(kpi.label.toUpperCase(), cardX + 4, currentY + 5.5);

      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(String(kpi.value), cardX + 4, currentY + 12);
    });

    currentY += cardHeight + 8;
  }

  // Calculate dynamic column widths
  const colWidths = columns.map((col) => {
    if (col.width) return col.width;
    return contentWidth / columns.length;
  });

  // Table Header
  function drawTableHeader() {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, currentY + 8, margin + contentWidth, currentY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);

    let curX = margin;
    columns.forEach((col, idx) => {
      const w = colWidths[idx];
      const align = col.align || 'left';
      const textX = align === 'right' ? curX + w - 3 : align === 'center' ? curX + w / 2 : curX + 3;
      doc.text(col.header.toUpperCase(), textX, currentY + 5.5, { align });
      curX += w;
    });

    currentY += 8;
  }

  drawTableHeader();

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const rowHeight = 7.5;

  data.forEach((row, rowIdx) => {
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - 15) {
      doc.addPage();
      renderHeader(false);
      drawTableHeader();
    }

    // Zebra striping
    if (rowIdx % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Subtle bottom row border
    doc.setDrawColor(243, 244, 246);
    doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

    doc.setTextColor(31, 41, 55);
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

      // Truncate text if too long for cell width
      const maxChars = Math.floor(w / 2.2);
      if (val.length > maxChars) {
        val = val.substring(0, maxChars - 2) + '..';
      }

      const align = col.align || 'left';
      const textX = align === 'right' ? curX + w - 3 : align === 'center' ? curX + w / 2 : curX + 3;
      doc.text(val, textX, currentY + 5, { align });
      curX += w;
    });

    currentY += rowHeight;
  });

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `SalonPro Confidential Document · Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Trigger browser download
  doc.save(`${filename.replace(/\.pdf$/, '')}.pdf`);
}

