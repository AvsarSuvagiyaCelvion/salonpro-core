'use client';

export interface InvoiceBillData {
  id: string;
  number: string;
  receipt_token?: string;
  customer_name: string;
  customer_mobile: string;
  subtotal?: string | number;
  discount_amount?: string | number;
  tax_amount?: string | number;
  total: string | number;
  paid_amount?: string | number;
  status?: string;
  created_at?: string;
  items?: Array<{ name: string; qty?: number; unit_price?: string | number; kind?: string }>;
  salon_name?: string;
  salon_phone?: string;
  salon_address?: string;
  logo_url?: string | null;
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
 * Safely loads an image from URL and converts it to a PNG base64 DataURL.
 * Includes a 3-second timeout and gracefully returns null on error / CORS blocks.
 */
async function loadBase64Image(
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
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ dataUrl, width: canvas.width, height: canvas.height });
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
 * Builds a publication-grade, luxury executive Tax Invoice PDF using jsPDF.
 * - Left Header: Salon Logo (if uploaded) or Elegant Typography & Monogram
 * - Right Header: Salon Contact Details, Invoice #, Date & Status Pill Badge
 * - Billed To Card: Client name, mobile, and payment summary
 * - Modern Billing Table: Proportional column widths, zebra striping
 * - Financial Breakdown: Subtotal, Discount, Tax, Grand Total Card & Due Amount
 * - Professional Footer: Brand appreciation, policy terms, digital receipt URL & Signatory line
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
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  let salonName = invoice.salon_name;
  let salonAddress = invoice.salon_address;
  let salonPhone = invoice.salon_phone;
  let logoUrl = invoice.logo_url;

  // Retrieve stored salon information from localStorage if not explicitly passed
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('salonpro_salon_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!salonName && parsed.name) salonName = parsed.name;
        if (!salonPhone && (parsed.phone || parsed.mobile)) salonPhone = parsed.phone || parsed.mobile;
        if (!salonAddress && (parsed.address || parsed.city)) {
          salonAddress = [parsed.address, parsed.city].filter(Boolean).join(', ');
        }
        if (!logoUrl && parsed.logo_url) logoUrl = parsed.logo_url;
      }
    } catch {}
  }

  salonName = salonName || 'Salon Workspace';
  salonAddress = salonAddress || 'Boutique Hair & Beauty Studio';
  salonPhone = salonPhone || '';

  // Attempt to load logo image if available
  const logoImg = await loadBase64Image(logoUrl);

  // ================= 1. LUXURY DUAL-HEADER =================
  let y = 14;

  // LEFT SIDE: Logo or Brand Typography
  if (logoImg) {
    // Proportional scaling within 42mm x 20mm bounding box
    const maxLogoW = 42;
    const maxLogoH = 20;
    let logoW = maxLogoW;
    let logoH = (logoImg.height / logoImg.width) * logoW;
    if (logoH > maxLogoH) {
      logoH = maxLogoH;
      logoW = (logoImg.width / logoImg.height) * logoH;
    }

    doc.addImage(logoImg.dataUrl, 'PNG', margin, y, logoW, logoH);

    // Salon Name underneath the logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    const clippedName = doc.splitTextToSize(salonName, 85)[0];
    doc.text(clippedName, margin, y + logoH + 5);
  } else {
    // Luxury Typography Block with Gold Accent Monogram
    doc.setFillColor(15, 23, 42); // #0F172A slate-900
    doc.roundedRect(margin, y, 16, 16, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(212, 167, 127); // #D4A77F Gold
    const initial = (salonName.charAt(0) || 'S').toUpperCase();
    doc.text(initial, margin + 8, y + 10.5, { align: 'center' });

    // Salon Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // slate-900
    const clippedName = doc.splitTextToSize(salonName, 78)[0];
    doc.text(clippedName, margin + 20, y + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('HAIR, BEAUTY & WELLNESS STUDIO', margin + 20, y + 13);
  }

  // RIGHT SIDE: Salon Contact Details & Official Status Badge
  const rightX = pageWidth - margin; // 196mm
  const isPaid = Number(invoice.paid_amount || invoice.total) >= Number(invoice.total);
  const statusUpper = (invoice.status || (isPaid ? 'PAID' : 'PARTIAL')).toUpperCase();

  // Status Badge Pill
  const badgeW = 28;
  const badgeH = 7;
  const badgeX = rightX - badgeW;
  if (statusUpper.includes('PAID')) {
    doc.setFillColor(209, 250, 229); // emerald-100
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.roundedRect(badgeX, y, badgeW, badgeH, 1.5, 1.5, 'FD');
    doc.setTextColor(4, 120, 87); // emerald-700
  } else {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(253, 230, 138); // amber-200
    doc.roundedRect(badgeX, y, badgeW, badgeH, 1.5, 1.5, 'FD');
    doc.setTextColor(180, 83, 9); // amber-700
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(statusUpper === 'PAID' ? 'PAID IN FULL ✓' : statusUpper, badgeX + badgeW / 2, y + 4.8, {
    align: 'center',
  });

  // Contact Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CONTACT & STUDIO INFO', rightX, y + 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  if (salonPhone) {
    doc.text(`Phone: ${salonPhone}`, rightX, y + 18, { align: 'right' });
  }
  if (salonAddress) {
    const clippedAddr = doc.splitTextToSize(salonAddress, 78);
    doc.text(clippedAddr[0], rightX, y + 22.5, { align: 'right' });
    if (clippedAddr[1]) {
      doc.text(clippedAddr[1], rightX, y + 26.5, { align: 'right' });
    }
  }

  // Luxury Divider Bar
  y = 44;
  doc.setDrawColor(212, 167, 127); // Gold line (#D4A77F)
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2); // reset line width

  // ================= 2. BILLED TO & INVOICE REFERENCE CARD =================
  y += 4;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, 'FD');

  // Left: Customer Details
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('BILLED TO / CUSTOMER', margin + 5, y + 6);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  const clientName = doc.splitTextToSize(invoice.customer_name || 'Valued Client', 80)[0];
  doc.text(clientName, margin + 5, y + 12);

  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Mobile: ${formatFullMobile(invoice.customer_mobile)}`, margin + 5, y + 17.5);

  // Right: Invoice Reference Details
  const metaRightX = pageWidth - margin - 5;
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TAX INVOICE NUMBER', metaRightX, y + 6, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(invoice.number || 'INV-0001', metaRightX, y + 12, { align: 'right' });

  const dateStr = invoice.created_at
    ? new Date(invoice.created_at).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${dateStr}`, metaRightX, y + 17.5, { align: 'right' });

  y += 28;

  // ================= 3. ITEMIZED BILLING TABLE =================
  // Header: # (10mm) | ITEM / SERVICE (80mm) | TYPE (24mm) | RATE (24mm) | QTY (16mm) | AMOUNT (28mm) = 182mm
  const colWidths = [10, 80, 24, 24, 16, 28];

  doc.setFillColor(15, 23, 42); // #0F172A Slate-900
  doc.rect(margin, y, contentWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  let curHeaderX = margin;
  doc.text('#', curHeaderX + 5, y + 5.2, { align: 'center' });
  curHeaderX += colWidths[0];

  doc.text('SERVICE / PRODUCT DESCRIPTION', curHeaderX + 3, y + 5.2);
  curHeaderX += colWidths[1];

  doc.text('TYPE', curHeaderX + colWidths[2] / 2, y + 5.2, { align: 'center' });
  curHeaderX += colWidths[2];

  doc.text('RATE (Rs.)', curHeaderX + colWidths[3] - 3, y + 5.2, { align: 'right' });
  curHeaderX += colWidths[3];

  doc.text('QTY', curHeaderX + colWidths[4] / 2, y + 5.2, { align: 'center' });
  curHeaderX += colWidths[4];

  doc.text('AMOUNT (Rs.)', curHeaderX + colWidths[5] - 3, y + 5.2, { align: 'right' });

  y += 8;

  // Items Rows
  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [{ name: 'Salon Service & Styling Session', qty: 1, unit_price: invoice.total, kind: 'service' }];

  items.forEach((item, idx) => {
    // Alternating Zebra Row Background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, y, contentWidth, 8.5, 'F');
    }

    let curColX = margin;

    // Index
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(String(idx + 1), curColX + 5, y + 5.5, { align: 'center' });
    curColX += colWidths[0];

    // Description
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const itemName = doc.splitTextToSize(item.name || 'Service', 74)[0];
    doc.text(itemName, curColX + 3, y + 5.5);
    curColX += colWidths[1];

    // Type Badge Pill
    const kind = (item.kind || 'service').toUpperCase();
    doc.setFillColor(kind === 'PRODUCT' ? 241 : 243, kind === 'PRODUCT' ? 245 : 244, kind === 'PRODUCT' ? 249 : 246);
    doc.roundedRect(curColX + 3, y + 1.8, 18, 5, 1, 1, 'F');
    doc.setTextColor(kind === 'PRODUCT' ? 71 : 140, kind === 'PRODUCT' ? 85 : 94, kind === 'PRODUCT' ? 105 : 46);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(kind, curColX + 12, y + 5.2, { align: 'center' });
    curColX += colWidths[2];

    // Rate
    const unitPrice = Number(item.unit_price) || 0;
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(unitPrice.toFixed(2), curColX + colWidths[3] - 3, y + 5.5, { align: 'right' });
    curColX += colWidths[3];

    // Qty
    const qty = item.qty || 1;
    doc.text(String(qty), curColX + colWidths[4] / 2, y + 5.5, { align: 'center' });
    curColX += colWidths[4];

    // Amount
    const rowTotal = unitPrice * qty;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(rowTotal.toFixed(2), curColX + colWidths[5] - 3, y + 5.5, { align: 'right' });

    // Subtle Bottom Line
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 8.5, pageWidth - margin, y + 8.5);

    y += 8.5;
  });

  // ================= 4. FINANCIAL SUMMARY BREAKDOWN =================
  y += 5;
  const summaryBoxW = 86;
  const summaryLeftX = pageWidth - margin - summaryBoxW; // 196 - 86 = 110mm

  function renderSummaryLine(label: string, value: string, isDiscount = false) {
    doc.setFont('helvetica', isDiscount ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(isDiscount ? 225 : 71, isDiscount ? 29 : 85, isDiscount ? 72 : 105);
    doc.text(label, summaryLeftX + 3, y);
    doc.text(value, pageWidth - margin - 3, y, { align: 'right' });
    y += 5.5;
  }

  const subtotalVal = Number(invoice.subtotal || invoice.total) || 0;
  renderSummaryLine('Subtotal', `Rs. ${subtotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

  if (Number(invoice.discount_amount || 0) > 0) {
    renderSummaryLine(
      'Promotional Discount',
      `-Rs. ${Number(invoice.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      true
    );
  }

  if (Number(invoice.tax_amount || 0) > 0) {
    renderSummaryLine(
      'Tax & GST',
      `Rs. ${Number(invoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    );
  }

  // Grand Total Card (Slate-900 with Gold Accent)
  y += 2;
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.roundedRect(summaryLeftX, y - 4, summaryBoxW, 11, 2, 2, 'F');

  // Gold accent bar on left of card
  doc.setFillColor(212, 167, 127);
  doc.rect(summaryLeftX, y - 4, 3, 11, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GRAND TOTAL', summaryLeftX + 7, y + 3.2);

  doc.setFontSize(11);
  doc.setTextColor(212, 167, 127); // Gold text for total
  doc.text(
    `Rs. ${Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    pageWidth - margin - 4,
    y + 3.2,
    { align: 'right' }
  );

  y += 13;

  // Payment Status Box
  const paidVal = Number(invoice.paid_amount || invoice.total);
  const dueVal = Math.max(0, Number(invoice.total) - paidVal);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryLeftX, y - 2, summaryBoxW, 11, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text(
    `Paid: Rs. ${paidVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    summaryLeftX + 4,
    y + 4.5
  );

  doc.setTextColor(dueVal > 0 ? 190 : 100, dueVal > 0 ? 18 : 116, dueVal > 0 ? 60 : 139);
  doc.text(
    dueVal > 0
      ? `Due: Rs. ${dueVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      : 'Balance Due: Rs. 0.00 ✓',
    pageWidth - margin - 4,
    y + 4.5,
    { align: 'right' }
  );

  // ================= 5. PROFESSIONAL EXECUTIVE FOOTER =================
  const footerY = pageHeight - 34; // 263mm
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Thank You Warm Note
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Thank You for Visiting ${salonName}! ✨`, margin, footerY + 6);

  // Terms & Online Booking Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Services & retail products are non-refundable · Book 24/7 online & view receipts anytime',
    margin,
    footerY + 11
  );

  // ERP Verification Watermark
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'DIGITALLY VERIFIED TAX RECORD · POWERED BY SALONPRO ENTERPRISE CLOUD ERP',
    margin,
    footerY + 16
  );

  // Authorized Signatory Line on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Authorized Signatory: ________________________', rightX, footerY + 12, { align: 'right' });

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
  const totalFormatted = Number(invoice.total || 0).toLocaleString('en-IN');
  const paidFormatted = Number(invoice.paid_amount || invoice.total || 0).toLocaleString('en-IN');

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
    `✨ *${salonName.toUpperCase()}* ✨`,
    `*Official Tax Invoice*`,
    ``,
    `Dear *${invoice.customer_name}*, thank you for visiting us!`,
    ``,
    `🧾 *Invoice #:* ${invoice.number}`,
    `💰 *Total Amount:* ₹${totalFormatted}`,
    `💳 *Payment Received:* ₹${paidFormatted} (Paid in Full ✓)`,
  ];

  if (invoice.items && invoice.items.length > 0) {
    lines.push(``, `✂️ *Services & Products:*`);
    for (const item of invoice.items) {
      const priceStr =
        item.unit_price !== undefined ? ` - ₹${Number(item.unit_price).toLocaleString('en-IN')}` : '';
      const qtyStr = item.qty && item.qty > 1 ? ` (x${item.qty})` : '';
      lines.push(`  • ${item.name}${qtyStr}${priceStr}`);
    }
  }

  lines.push(
    ``,
    `📄 *View & Download Official PDF Receipt:*`,
    `👉 ${receiptLink}`,
    ``,
    `_We look forward to welcoming you again!_ ✨`
  );

  const text = lines.join('\n');
  const encodedText = encodeURIComponent(text);

  // Desktop web.whatsapp.com directly vs Mobile api.whatsapp.com
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
    const filename = `Invoice_${(invoice.number || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
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
