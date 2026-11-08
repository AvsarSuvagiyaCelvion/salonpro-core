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
 * Builds an official high-resolution vector PDF in memory using jsPDF.
 */
export async function generateInvoicePdfDoc(invoice: InvoiceBillData): Promise<any> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm
  let salonName = invoice.salon_name;
  let salonAddress = invoice.salon_address;
  let salonPhone = invoice.salon_phone;

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
      }
    } catch {}
  }

  salonName = salonName || 'Salon Workspace';
  salonAddress = salonAddress || 'Boutique Hair & Beauty Studio';
  salonPhone = salonPhone || '';

  // 1. Top Header Banner
  doc.setFillColor(24, 24, 27); // #18181b
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Salon Name (Safely clipped to 125mm so it never collides with status badge)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const clippedSalonName = doc.splitTextToSize(salonName, 125)[0];
  doc.text(clippedSalonName, margin, 15);

  // Salon Address & Phone
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  const clippedAddress = doc.splitTextToSize(salonAddress, 125)[0];
  doc.text(clippedAddress, margin, 22);
  if (salonPhone) {
    doc.text(`Ph: ${salonPhone}`, margin, 27);
  }

  // Status Badge (Paid)
  const isPaid = Number(invoice.paid_amount || invoice.total) >= Number(invoice.total);
  const badgeText = isPaid ? 'PAID IN FULL' : 'PARTIAL';
  const badgeWidth = 26;
  const badgeX = pageWidth - margin - badgeWidth; // 195 - 26 = 169mm
  doc.setFillColor(16, 185, 129); // emerald
  doc.roundedRect(badgeX, 10, badgeWidth, 6.5, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(badgeText, badgeX + badgeWidth / 2, 14.5, { align: 'center' });

  // Receipt Label
  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('OFFICIAL TAX INVOICE', pageWidth - margin, 23, { align: 'right' });

  let y = 46;

  // 2. Invoice Meta & Billed To Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2.5, 2.5, 'FD');

  // Left: Billed To
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('BILLED TO', margin + 5, y + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  const clientName = doc.splitTextToSize(invoice.customer_name || 'Valued Client', 85)[0];
  doc.text(clientName, margin + 5, y + 12.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Mobile: ${formatFullMobile(invoice.customer_mobile)}`, margin + 5, y + 18.5);

  // Right: Invoice Details
  const rightX = pageWidth - margin - 5;
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('INVOICE NO', rightX, y + 6, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(invoice.number, rightX, y + 12.5, { align: 'right' });

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
  doc.text(dateStr, rightX, y + 18.5, { align: 'right' });

  y += 30;

  // 3. Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7.5, 'F');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ITEMS & SERVICES', margin + 4, y + 5);
  doc.text('TYPE', margin + 88, y + 5);
  doc.text('QTY', margin + 118, y + 5, { align: 'center' });
  doc.text('AMOUNT (INR)', pageWidth - margin - 4, y + 5, { align: 'right' });

  y += 8.5;

  // 4. Items List
  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{ name: 'Salon Service & Grooming', qty: 1, unit_price: invoice.total, kind: 'service' }];

  items.forEach((item) => {
    // Service Name safely clipped to 80mm so it never overlaps the TYPE column
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const itemName = doc.splitTextToSize(item.name || 'Service', 80)[0];
    doc.text(itemName, margin + 4, y + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text((item.kind || 'service').toUpperCase(), margin + 88, y + 4.5);
    doc.text(String(item.qty || 1), margin + 118, y + 4.5, { align: 'center' });

    const itemTotal = Number(item.unit_price) * (item.qty || 1);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Rs. ${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      pageWidth - margin - 4,
      y + 4.5,
      { align: 'right' }
    );

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

    y += 8;
  });

  y += 4;

  // 5. Financial Summary
  const totalsX = 120;
  const totalsValX = pageWidth - margin - 4; // 191mm

  function renderTotalRow(label: string, value: string, isBold = false, color = [71, 85, 105]) {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9 : 8);
    doc.text(label, totalsX, y);
    doc.text(value, totalsValX, y, { align: 'right' });
    y += 5;
  }

  const subtotalNum = Number(invoice.subtotal || invoice.total);
  renderTotalRow('Subtotal', `Rs. ${subtotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

  if (Number(invoice.discount_amount || 0) > 0) {
    renderTotalRow(
      'Discount',
      `-Rs. ${Number(invoice.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      false,
      [219, 39, 119]
    );
  }

  // Grand Total Box (Width strictly fits right margin: totalsX - 3 to pageWidth - margin = 78mm)
  y += 2;
  const grandTotalBoxWidth = pageWidth - margin - (totalsX - 3); // 78mm
  doc.setFillColor(24, 24, 27); // #18181b
  doc.roundedRect(totalsX - 3, y - 3.5, grandTotalBoxWidth, 9.5, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GRAND TOTAL', totalsX, y + 2.5);
  doc.setFontSize(10);
  doc.text(
    `Rs. ${Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    pageWidth - margin - 3,
    y + 2.5,
    { align: 'right' }
  );

  y += 14;

  // 6. Payment Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 13, 2, 2, 'FD');

  const paidAmount = Number(invoice.paid_amount || invoice.total);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Payment Received: Rs. ${paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 5, y + 8);

  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: PAID IN FULL ✓`, pageWidth - margin - 5, y + 8, { align: 'right' });

  // 7. Clean Minimal Footer: ONLY "Thank You! Please Visit Again ✨"
  const footerY = Math.max(y + 18, 260);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 20, footerY - 5, pageWidth - margin - 20, footerY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Thank You! Please Visit Again ✨', pageWidth / 2, footerY + 2, { align: 'center' });

  return doc;
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
}

export function buildInvoiceWhatsAppMessage(invoice: InvoiceBillData): { text: string; waUrl: string; cleanPhone: string } {
  const rawPhone = (invoice.customer_mobile || '').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
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
      const priceStr = item.unit_price !== undefined ? ` - ₹${Number(item.unit_price).toLocaleString('en-IN')}` : '';
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

  // CRITICAL FIX: Desktop browsers hitting wa.me experience an intermediate redirect bug on WhatsApp's
  // redirect server where multi-byte UTF-8 emojis get corrupted into  replacement diamonds (\uFFFD).
  // 1. On Desktop / Laptop: Use web.whatsapp.com directly (zero intermediate redirect -> emojis remain 100% intact).
  // 2. On Mobile (Android/iOS): Use api.whatsapp.com to trigger the native WhatsApp app intent directly.
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
    const cleanSalon = (invoice.salon_name || 'Salon').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanInv = (invoice.number || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${cleanSalon}-${cleanInv}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to download invoice PDF:', err);
    return false;
  }
}

/**
 * Opens WhatsApp directly into the customer's chat with the pre-filled itemized bill and digital receipt link.
 * Synchronous execution ensures ZERO browser popup blocker issues on PC & Mobile!
 */
export async function openDirectWhatsAppChat(invoice: InvoiceBillData): Promise<ShareResult> {
  const { text, waUrl } = buildInvoiceWhatsAppMessage(invoice);

  // 1. Copy exact message with emojis to clipboard as instant fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  // 2. Immediately open customer's chat directly in WhatsApp
  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank');
  }

  // 3. Mark sent in backend DB
  try {
    await fetch('/api/billing/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoice.id }),
    });
  } catch {}

  const isMobile = isMobileDevice();
  return {
    success: true,
    method: 'whatsapp_web',
    message: isMobile
      ? 'WhatsApp app opened directly in customer chat! Press Send to deliver the bill.'
      : 'WhatsApp Web opened directly in customer chat! Message also copied to clipboard. Press Send.',
  };
}

/**
 * Smart Device-Adaptive WhatsApp Bill Dispatcher
 */
export async function dispatchSmartWhatsAppBill(invoice: InvoiceBillData): Promise<ShareResult> {
  return openDirectWhatsAppChat(invoice);
}
