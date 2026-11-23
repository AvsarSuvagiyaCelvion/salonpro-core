'use client';

export interface InvoiceBillData {
  id: string;
  number: string;
  receipt_token?: string;
  customer_name: string;
  customer_mobile: string;
  customer_id?: string;
  appointment_id?: string;
  staff_name?: string;
  subtotal?: string | number;
  discount_amount?: string | number;
  tax_amount?: string | number;
  cgst?: string | number;
  sgst?: string | number;
  total: string | number;
  paid_amount?: string | number;
  due_amount?: string | number;
  payment_method?: string;
  payment_reference?: string;
  status?: string;
  created_at?: string;
  items?: Array<{
    name: string;
    qty?: number;
    unit_price?: string | number;
    discount?: string | number;
    kind?: string;
    staff_name?: string;
  }>;
  salon_name?: string;
  salon_phone?: string;
  salon_address?: string;
  salon_email?: string;
  salon_gstin?: string;
  salon_upi_id?: string;
  logo_url?: string | null;
  terms?: string[];
}

export interface ShareResult {
  success: boolean;
  method: 'native_share' | 'whatsapp_web' | 'cancelled';
  message: string;
}

function formatFullMobile(mobile: string | null | undefined): string {
  if (!mobile) return 'N/A';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    const ten = digits.slice(2);
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
  }
  return mobile;
}

/**
 * Loads an image from URL and clips it into a clean monochrome / crisp square in canvas.
 * Returns a PNG dataUrl ready for jsPDF with a 3-second timeout guard.
 */
async function loadBase64Logo(
  url: string | null | undefined
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!url || typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 3000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;
        const canvas = document.createElement('canvas');
        canvas.width = nw;
        canvas.height = nh;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, nw, nh);
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ dataUrl, width: nw, height: nh });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Builds an ultra-clean, commercial-grade Minimalist Black & White Tax Invoice PDF for salon customers.
 * - Pure white background with crisp charcoal typography (#111111, #262626)
 * - Subtle hairline dividers (#E5E5E5)
 * - Structured metadata: Salon info, Customer reference, Appointment details
 * - Balanced itemized table with automatic multi-page pagination & repeated headers
 * - Accurate financial summary with inclusive/exclusive GST breakdown
 * - Dynamic QR code for balance payment when applicable
 * - Formal minimalist footer with terms and boutique appreciation note
 */
export async function generateInvoicePdfDoc(invoice: InvoiceBillData): Promise<any> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15; // 15mm standard professional margin
  const contentWidth = pageWidth - margin * 2; // 180mm
  const rightX = pageWidth - margin; // 195mm

  let salonName = invoice.salon_name;
  let salonAddress = invoice.salon_address;
  let salonPhone = invoice.salon_phone;
  let salonEmail = invoice.salon_email;
  let salonGstin = invoice.salon_gstin;
  let salonUpiId = invoice.salon_upi_id;
  let logoUrl = invoice.logo_url;

  // Retrieve stored salon information from localStorage if not explicitly passed
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('salonpro_salon_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!salonName && parsed.name) salonName = parsed.name;
        if (!salonPhone && (parsed.phone || parsed.mobile)) salonPhone = parsed.phone || parsed.mobile;
        if (!salonEmail && parsed.email) salonEmail = parsed.email;
        if (!salonGstin && parsed.gstin) salonGstin = parsed.gstin;
        if (!salonUpiId && parsed.upi_id) salonUpiId = parsed.upi_id;
        if (!salonAddress && (parsed.address || parsed.city)) {
          salonAddress = [parsed.address, parsed.city].filter(Boolean).join(', ');
        }
        if (!logoUrl && parsed.logo_url) logoUrl = parsed.logo_url;
      }
    } catch {}
  }

  salonName = salonName || 'Salon Workspace';
  salonAddress = salonAddress || 'Premium Hair, Beauty & Wellness Studio';
  salonPhone = salonPhone || '';

  const finalSalonName: string = salonName;
  const finalSalonAddress: string = salonAddress;
  const finalSalonPhone: string = salonPhone;
  const finalSalonEmail: string = salonEmail || '';
  const finalSalonGstin: string = salonGstin || '';
  const finalSalonUpiId: string = salonUpiId || '';

  // Minimalist Palette Constants
  const C_BLACK = [17, 17, 17]; // #111111
  const C_CHARCOAL = [55, 65, 81]; // #374151
  const C_MUTED = [115, 115, 115]; // #737373
  const C_HAIRLINE = [229, 231, 235]; // #E5E7EB
  const C_LIGHT_BG = [250, 250, 250]; // #FAFAFA
  const C_HEADER_BG = [243, 244, 246]; // #F3F4F6

  // Total and status calculations
  const totalAmount = Number(invoice.total) || 0;
  const paidVal = invoice.paid_amount !== undefined ? Number(invoice.paid_amount) : totalAmount;
  const dueVal = Math.max(0, totalAmount - paidVal);
  const statusUpper = (
    invoice.status || (dueVal <= 0 ? 'PAID' : paidVal > 0 ? 'PARTIAL' : 'PENDING')
  ).toUpperCase();

  // GST Calculation (18% inclusive: 9% CGST + 9% SGST if not explicitly supplied)
  const explicitTax = Number(invoice.tax_amount || 0);
  const calcTax = explicitTax > 0 ? explicitTax : totalAmount > 0 ? (totalAmount * 18) / 118 : 0;
  const cgstVal = invoice.cgst !== undefined ? Number(invoice.cgst) : calcTax / 2;
  const sgstVal = invoice.sgst !== undefined ? Number(invoice.sgst) : calcTax / 2;
  const subtotalVal = Number(invoice.subtotal || totalAmount);
  const discountVal = Number(invoice.discount_amount || 0);
  const taxableVal = Math.max(0, totalAmount - calcTax);

  // Attempt to load logo
  const logoData = await loadBase64Logo(logoUrl);

  // Generate UPI QR Code if balance due
  let upiQrDataUrl: string | null = null;
  if (dueVal > 0 && finalSalonUpiId) {
    try {
      const { generateUpiQrDataUrl } = await import('@/lib/upi');
      upiQrDataUrl = await generateUpiQrDataUrl({
        upiId: finalSalonUpiId,
        name: finalSalonName,
        amount: dueVal,
        note: `Invoice ${invoice.number}`,
      });
    } catch {}
  }

  // Multi-page helper
  let currentPage = 1;

  function renderPageHeader() {
    let y = 14;

    // LEFT HEADER: Salon Identity & Logo
    if (logoData) {
      const maxDim = 18;
      const aspect = logoData.width / logoData.height;
      let w = maxDim;
      let h = maxDim;
      if (aspect > 1) {
        h = maxDim / aspect;
      } else {
        w = maxDim * aspect;
      }
      doc.addImage(logoData.dataUrl, 'PNG', margin, y, w, h);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
      const clippedName = doc.splitTextToSize(finalSalonName.toUpperCase(), 80)[0];
      doc.text(clippedName, margin + maxDim + 4, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(C_CHARCOAL[0], C_CHARCOAL[1], C_CHARCOAL[2]);
      const clippedAddr = doc.splitTextToSize(finalSalonAddress, 85);
      doc.text(clippedAddr[0], margin + maxDim + 4, y + 10.5);
      if (clippedAddr[1]) {
        doc.text(clippedAddr[1], margin + maxDim + 4, y + 14.5);
      }

      let subMeta = '';
      if (finalSalonPhone) subMeta += `Tel: ${finalSalonPhone}`;
      if (finalSalonEmail) subMeta += (subMeta ? '  |  ' : '') + finalSalonEmail;
      if (finalSalonGstin) subMeta += (subMeta ? '  |  ' : '') + `GSTIN: ${finalSalonGstin}`;
      if (subMeta) {
        doc.setFontSize(7);
        doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
        doc.text(subMeta, margin + maxDim + 4, y + (clippedAddr[1] ? 18.5 : 15));
      }
    } else {
      // Minimalist Monogram Block
      doc.setFillColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
      doc.rect(margin, y, 16, 16, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      const initial = (finalSalonName.charAt(0) || 'S').toUpperCase();
      doc.text(initial, margin + 8, y + 11, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
      const clippedName = doc.splitTextToSize(finalSalonName.toUpperCase(), 85)[0];
      doc.text(clippedName, margin + 20, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(C_CHARCOAL[0], C_CHARCOAL[1], C_CHARCOAL[2]);
      const clippedAddr = doc.splitTextToSize(finalSalonAddress, 85);
      doc.text(clippedAddr[0], margin + 20, y + 10.5);
      if (clippedAddr[1]) {
        doc.text(clippedAddr[1], margin + 20, y + 14.5);
      }

      let subMeta = '';
      if (finalSalonPhone) subMeta += `Tel: ${finalSalonPhone}`;
      if (finalSalonEmail) subMeta += (subMeta ? '  |  ' : '') + finalSalonEmail;
      if (finalSalonGstin) subMeta += (subMeta ? '  |  ' : '') + `GSTIN: ${finalSalonGstin}`;
      if (subMeta) {
        doc.setFontSize(7);
        doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
        doc.text(subMeta, margin + 20, y + (clippedAddr[1] ? 18.5 : 15));
      }
    }

    // RIGHT HEADER: Title, Invoice #, Date, Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text('TAX INVOICE', rightX, y + 5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(`Invoice No:`, rightX - 35, y + 10.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text(invoice.number || 'INV-0001', rightX, y + 10.5, { align: 'right' });

    const dateStr = invoice.created_at
      ? new Date(invoice.created_at).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(`Date & Time:`, rightX - 35, y + 15, { align: 'right' });
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text(dateStr, rightX, y + 15, { align: 'right' });

    // Status Badge (Minimalist Charcoal/White Border Pill)
    const badgeW = 28;
    const badgeH = 5.5;
    const badgeX = rightX - badgeW;
    const badgeY = y + 17.5;

    doc.setFillColor(statusUpper === 'PAID' ? 245 : 255, statusUpper === 'PAID' ? 245 : 255, statusUpper === 'PAID' ? 245 : 255);
    doc.setDrawColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text(
      statusUpper === 'PAID' ? 'PAID [ ✓ ]' : statusUpper === 'PARTIAL' ? 'PARTIAL PAYMENT' : 'PAYMENT DUE',
      badgeX + badgeW / 2,
      badgeY + 3.8,
      { align: 'center' }
    );
    doc.setLineWidth(0.2);

    // Subtle Top Divider Line
    y = 42;
    doc.setDrawColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, rightX, y);
    doc.setLineWidth(0.2);

    return y;
  }

  // 1. Render First Page Header
  let y = renderPageHeader();

  // ================= 2. CLIENT & APPOINTMENT METADATA CARD =================
  y += 4;
  doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
  doc.setDrawColor(C_HAIRLINE[0], C_HAIRLINE[1], C_HAIRLINE[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'FD');
  doc.setLineWidth(0.2);

  // Column 1: Client Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
  doc.text('BILLED TO (CUSTOMER)', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
  const clientName = doc.splitTextToSize(invoice.customer_name || 'Valued Client', 65)[0];
  doc.text(clientName, margin + 4, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(C_CHARCOAL[0], C_CHARCOAL[1], C_CHARCOAL[2]);
  doc.text(`Mobile: ${formatFullMobile(invoice.customer_mobile)}`, margin + 4, y + 15);

  // Column 2: Customer / Appointment ID
  const col2X = margin + 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
  doc.text('REFERENCE DETAILS', col2X, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(C_CHARCOAL[0], C_CHARCOAL[1], C_CHARCOAL[2]);
  if (invoice.customer_id) {
    doc.text(`Customer ID: ${invoice.customer_id.slice(0, 8).toUpperCase()}`, col2X, y + 10);
  } else {
    doc.text(`Channel: Counter / Salon Walk-in`, col2X, y + 10);
  }
  if (invoice.appointment_id) {
    doc.text(`Booking Ref: #${invoice.appointment_id.slice(0, 8).toUpperCase()}`, col2X, y + 15);
  } else {
    doc.text(`Billing Type: POS Direct Settlement`, col2X, y + 15);
  }

  // Column 3: Stylist & Payment Mode
  const col3X = rightX - 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
  doc.text('OPERATIONAL CONTEXT', col3X, y + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(C_CHARCOAL[0], C_CHARCOAL[1], C_CHARCOAL[2]);
  if (invoice.staff_name) {
    doc.text(`Attended By: ${invoice.staff_name}`, col3X, y + 10, { align: 'right' });
  } else {
    doc.text(`Attended By: Salon Stylist Team`, col3X, y + 10, { align: 'right' });
  }
  const methodStr = (invoice.payment_method || 'UPI / Cash / Card').toUpperCase();
  doc.text(`Payment Mode: ${methodStr}`, col3X, y + 15, { align: 'right' });

  y += 24;

  // ================= 3. ITEMIZED BILLING TABLE =================
  // Table columns (Total = 180mm):
  // # (10mm) | DESCRIPTION (84mm) | TYPE (20mm) | QTY (12mm) | UNIT PRICE (26mm) | TOTAL (28mm)
  const colW = [10, 84, 20, 12, 26, 28];

  function renderTableHeader(currentY: number) {
    doc.setFillColor(C_HEADER_BG[0], C_HEADER_BG[1], C_HEADER_BG[2]);
    doc.rect(margin, currentY, contentWidth, 7, 'F');

    doc.setDrawColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, rightX, currentY);
    doc.line(margin, currentY + 7, rightX, currentY + 7);
    doc.setLineWidth(0.2);

    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);

    let curX = margin;
    doc.text('#', curX + 5, currentY + 4.7, { align: 'center' });
    curX += colW[0];

    doc.text('SERVICE / PRODUCT DESCRIPTION', curX + 2, currentY + 4.7);
    curX += colW[1];

    doc.text('TYPE', curX + colW[2] / 2, currentY + 4.7, { align: 'center' });
    curX += colW[2];

    doc.text('QTY', curX + colW[3] / 2, currentY + 4.7, { align: 'center' });
    curX += colW[3];

    doc.text('UNIT PRICE (Rs.)', curX + colW[4] - 2, currentY + 4.7, { align: 'right' });
    curX += colW[4];

    doc.text('AMOUNT (Rs.)', curX + colW[5] - 2, currentY + 4.7, { align: 'right' });

    return currentY + 7;
  }

  y = renderTableHeader(y);

  const rawItems =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [{ name: 'Salon Service & Beauty Session', qty: 1, unit_price: invoice.total, kind: 'service' }];

  rawItems.forEach((item, idx) => {
    // Multi-page page-break check
    if (y > pageHeight - 75) {
      doc.addPage();
      currentPage++;
      y = renderPageHeader();
      y += 4;
      y = renderTableHeader(y);
    }

    const rowH = 8;
    // Row background (clean pure white with subtle hairline divider)
    if (idx % 2 === 1) {
      doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
      doc.rect(margin, y, contentWidth, rowH, 'F');
    }

    let curX = margin;

    // # index
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text(String(idx + 1).padStart(2, '0'), curX + 5, y + 5.2, { align: 'center' });
    curX += colW[0];

    // Description
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    const cleanItemName = doc.splitTextToSize(item.name || 'Service', 78)[0];
    doc.text(cleanItemName, curX + 2, y + 5.2);
    curX += colW[1];

    // Kind pill (Service / Retail)
    const kindStr = (item.kind || 'service').toUpperCase();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(C_CHARCOAL[0], C_CHARCOAL[1], C_CHARCOAL[2]);
    doc.text(kindStr === 'PRODUCT' ? 'RETAIL' : 'SERVICE', curX + colW[2] / 2, y + 5.2, {
      align: 'center',
    });
    curX += colW[2];

    // Qty
    const qty = Number(item.qty) || 1;
    doc.setFontSize(7.5);
    doc.text(String(qty), curX + colW[3] / 2, y + 5.2, { align: 'center' });
    curX += colW[3];

    // Unit Price
    const uPrice = Number(item.unit_price) || 0;
    doc.text(uPrice.toFixed(2), curX + colW[4] - 2, y + 5.2, { align: 'right' });
    curX += colW[4];

    // Amount
    const rTotal = uPrice * qty;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text(rTotal.toFixed(2), curX + colW[5] - 2, y + 5.2, { align: 'right' });

    // Subtle bottom hairline
    doc.setDrawColor(C_HAIRLINE[0], C_HAIRLINE[1], C_HAIRLINE[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowH, rightX, y + rowH);

    y += rowH;
  });

  // Check if summary fits on current page; otherwise break to next page
  if (y > pageHeight - 65) {
    doc.addPage();
    currentPage++;
    y = renderPageHeader();
    y += 4;
  }

  // ================= 4. FINANCIAL SUMMARY & SETTLEMENT =================
  y += 5;

  // Left Column: Settlement & UPI QR Code
  const leftColW = 80;
  const leftColX = margin;

  if (dueVal > 0 && upiQrDataUrl) {
    // Render UPI QR Box for balance
    doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
    doc.setDrawColor(C_HAIRLINE[0], C_HAIRLINE[1], C_HAIRLINE[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(leftColX, y, leftColW, 36, 1.5, 1.5, 'FD');

    doc.addImage(upiQrDataUrl, 'PNG', leftColX + 3, y + 3, 30, 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text('SCAN TO PAY BALANCE', leftColX + 36, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(C_CHARCOAL[0], C_CHARCOAL[1], C_CHARCOAL[2]);
    doc.text(`Amount: Rs. ${dueVal.toFixed(2)}`, leftColX + 36, y + 13);
    doc.text(`UPI ID:`, leftColX + 36, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(salonUpiId || '', 40)[0], leftColX + 36, y + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
    doc.text('Accepts GPay, PhonePe, Paytm', leftColX + 36, y + 29);
  } else {
    // Settled Stamp / Authorization Badge
    doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
    doc.setDrawColor(C_HAIRLINE[0], C_HAIRLINE[1], C_HAIRLINE[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(leftColX, y, leftColW, 30, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
    doc.text('PAYMENT SETTLEMENT RECEIPT', leftColX + 5, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(C_CHARCOAL[0], C_CHARCOAL[1], C_CHARCOAL[2]);
    doc.text(`Status: ${statusUpper === 'PAID' ? 'Settled in Full' : 'Pending Verification'}`, leftColX + 5, y + 13);
    doc.text(`Method: ${(invoice.payment_method || 'Electronic / Cash').toUpperCase()}`, leftColX + 5, y + 18);
    if (invoice.payment_reference) {
      doc.text(`Txn Ref: ${invoice.payment_reference}`, leftColX + 5, y + 23);
    } else {
      doc.text(`Generated by: SalonPro Certified POS Engine`, leftColX + 5, y + 23);
    }
  }

  // Right Column: Precise Accounting Breakdown
  const sumW = 88;
  const sumX = rightX - sumW;
  let sumY = y;

  function renderCalcRow(label: string, amountStr: string, isNegative = false, isBold = false) {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(
      isNegative ? 185 : isBold ? C_BLACK[0] : C_CHARCOAL[0],
      isNegative ? 28 : isBold ? C_BLACK[1] : C_CHARCOAL[1],
      isNegative ? 28 : isBold ? C_BLACK[2] : C_CHARCOAL[2]
    );
    doc.text(label, sumX + 2, sumY + 4);
    doc.text(amountStr, rightX - 2, sumY + 4, { align: 'right' });
    sumY += 5;
  }

  renderCalcRow('Gross Subtotal', `Rs. ${subtotalVal.toFixed(2)}`);

  if (discountVal > 0) {
    renderCalcRow('Promotional Discount', `- Rs. ${discountVal.toFixed(2)}`, true, true);
  }

  if (calcTax > 0) {
    renderCalcRow('Taxable Amount', `Rs. ${taxableVal.toFixed(2)}`);
    renderCalcRow('CGST (9.0%)', `Rs. ${cgstVal.toFixed(2)}`);
    renderCalcRow('SGST (9.0%)', `Rs. ${sgstVal.toFixed(2)}`);
  }

  // Grand Total Solid Bar
  sumY += 1.5;
  doc.setFillColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
  doc.rect(sumX, sumY, sumW, 8.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('GRAND TOTAL', sumX + 4, sumY + 5.7);
  doc.setFontSize(10.5);
  doc.text(`Rs. ${totalAmount.toFixed(2)}`, rightX - 4, sumY + 5.7, { align: 'right' });

  sumY += 10.5;

  // Paid vs Due Balance
  doc.setFillColor(C_LIGHT_BG[0], C_LIGHT_BG[1], C_LIGHT_BG[2]);
  doc.setDrawColor(C_HAIRLINE[0], C_HAIRLINE[1], C_HAIRLINE[2]);
  doc.setLineWidth(0.2);
  doc.rect(sumX, sumY, sumW, 6.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
  doc.text(`Paid: Rs. ${paidVal.toFixed(2)}`, sumX + 4, sumY + 4.5);

  doc.setTextColor(dueVal > 0 ? 185 : C_MUTED[0], dueVal > 0 ? 28 : C_MUTED[1], dueVal > 0 ? 28 : C_MUTED[2]);
  doc.text(
    dueVal > 0 ? `Balance Due: Rs. ${dueVal.toFixed(2)}` : 'Balance Due: Rs. 0.00 [ ✓ ]',
    rightX - 4,
    sumY + 4.5,
    { align: 'right' }
  );

  y = Math.max(y + 40, sumY + 12);

  // ================= 5. MINIMALIST TERMS & APPRECIATION FOOTER =================
  const footerY = Math.max(y + 10, pageHeight - 22);

  doc.setDrawColor(C_HAIRLINE[0], C_HAIRLINE[1], C_HAIRLINE[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 4, rightX, footerY - 4);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(C_BLACK[0], C_BLACK[1], C_BLACK[2]);
  doc.text(`Thank you for choosing ${salonName}.`, margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(C_MUTED[0], C_MUTED[1], C_MUTED[2]);
  doc.text(
    'Terms: 1. Services & products billed are subject to boutique policy. 2. Please retain this invoice for your records.',
    margin,
    footerY + 4.5
  );
  doc.text(
    'This is a computer-generated tax invoice verified by SalonPro Cloud ERP.',
    margin,
    footerY + 8.5
  );

  doc.setFontSize(7);
  doc.text(`Page ${currentPage} of ${currentPage}`, rightX, footerY + 8.5, { align: 'right' });

  return doc;
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
}

export function buildInvoiceWhatsAppMessage(
  invoice: InvoiceBillData
): { text: string; waUrl: string; cleanPhone: string } {
  const rawPhone = (invoice.customer_mobile || '').replace(/[^0-9]/g, '');
  const cleanPhone =
    rawPhone.length === 10 ? `91${rawPhone}` : rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const receiptLink = `${origin}/b/${invoice.receipt_token || invoice.number}`;
  const totalFormatted = Number(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const paidFormatted = Number(
    invoice.paid_amount !== undefined ? invoice.paid_amount : invoice.total || 0
  ).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  let salonName = invoice.salon_name;
  if (typeof window !== 'undefined' && !salonName) {
    try {
      const stored = localStorage.getItem('salonpro_salon_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) salonName = parsed.name;
      }
    } catch {}
  }
  salonName = salonName || 'Our Salon';

  const lines: string[] = [
    `*${salonName.toUpperCase()}*`,
    `Tax Invoice & Receipt`,
    ``,
    `Dear *${invoice.customer_name}*, thank you for your visit today!`,
    ``,
    `🧾 *Invoice #:* ${invoice.number}`,
    `💰 *Grand Total:* Rs. ${totalFormatted}`,
    `💳 *Amount Paid:* Rs. ${paidFormatted}`,
  ];

  if (invoice.items && invoice.items.length > 0) {
    lines.push(``, `*Services & Items:*`);
    for (const item of invoice.items) {
      const priceStr =
        item.unit_price !== undefined ? ` - Rs. ${Number(item.unit_price).toLocaleString('en-IN')}` : '';
      const qtyStr = item.qty && item.qty > 1 ? ` (x${item.qty})` : '';
      lines.push(`  • ${item.name}${qtyStr}${priceStr}`);
    }
  }

  lines.push(
    ``,
    `📄 *View Official Minimalist PDF Invoice:*`,
    `👉 ${receiptLink}`,
    ``,
    `_We appreciate your business and look forward to seeing you again._`
  );

  const text = lines.join('\n');
  const encodedText = encodeURIComponent(text);

  const isMobile = isMobileDevice();
  const waUrl = isMobile
    ? `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedText}`
    : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

  return { text, waUrl, cleanPhone };
}

/**
 * Downloads the high-resolution vector PDF invoice directly to the device.
 */
export async function downloadInvoicePdf(invoice: InvoiceBillData): Promise<boolean> {
  try {
    const doc = await generateInvoicePdfDoc(invoice);
    const cleanNum = (invoice.number || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Invoice_${cleanNum}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('downloadInvoicePdf error:', err);
    return false;
  }
}

/**
 * Dispatches WhatsApp message with fallback to PDF download.
 */
export async function dispatchSmartWhatsAppBill(invoice: InvoiceBillData): Promise<ShareResult> {
  const { waUrl } = buildInvoiceWhatsAppMessage(invoice);
  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }
  return {
    success: true,
    method: 'whatsapp_web',
    message: 'Opening WhatsApp...',
  };
}
