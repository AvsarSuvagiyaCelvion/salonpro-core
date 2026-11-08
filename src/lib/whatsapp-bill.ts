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

function maskMobile(mobile: string | null | undefined): string {
  if (!mobile) return 'N/A';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length >= 10) {
    const first2 = digits.slice(0, 2);
    const last3 = digits.slice(-3);
    return `${first2}${'X'.repeat(digits.length - 5)}${last3}`;
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
  const contentWidth = pageWidth - margin * 2;
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
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Salon Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(salonName, margin, 16);

  // Salon Address & Phone
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 200, 200);
  doc.text(salonAddress, margin, 23);
  if (salonPhone) {
    doc.text(`Ph: ${salonPhone}`, margin, 28);
  }

  // Status Badge (Paid)
  const isPaid = Number(invoice.paid_amount || invoice.total) >= Number(invoice.total);
  const badgeText = isPaid ? 'PAID IN FULL' : 'PARTIAL';
  const badgeWidth = 28;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.setFillColor(16, 185, 129); // emerald
  doc.roundedRect(badgeX, 10, badgeWidth, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(badgeText, badgeX + badgeWidth / 2, 14.8, { align: 'center' });

  // Receipt Label
  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('OFFICIAL TAX INVOICE', pageWidth - margin, 24, { align: 'right' });

  let y = 50;

  // 2. Invoice Meta & Billed To Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'FD');

  // Left: Billed To
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('BILLED TO', margin + 6, y + 7);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoice.customer_name || 'Valued Client', margin + 6, y + 14);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Mobile: ${maskMobile(invoice.customer_mobile)}`, margin + 6, y + 20);

  // Right: Invoice Details
  const rightX = pageWidth - margin - 6;
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('INVOICE NO', rightX, y + 7, { align: 'right' });

  doc.setTextColor(212, 167, 127); // #D4A77F
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoice.number, rightX, y + 14, { align: 'right' });

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
  doc.setFontSize(8.5);
  doc.text(dateStr, rightX, y + 20, { align: 'right' });

  y += 34;

  // 3. Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ITEMS & SERVICES', margin + 4, y + 5.5);
  doc.text('TYPE', margin + 95, y + 5.5);
  doc.text('QTY', margin + 125, y + 5.5, { align: 'center' });
  doc.text('AMOUNT (INR)', pageWidth - margin - 4, y + 5.5, { align: 'right' });

  y += 9;

  // 4. Items List
  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{ name: 'Salon Service & Grooming', qty: 1, unit_price: invoice.total, kind: 'service' }];

  items.forEach((item) => {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(item.name, margin + 4, y + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text((item.kind || 'service').toUpperCase(), margin + 95, y + 4.5);
    doc.text(String(item.qty || 1), margin + 125, y + 4.5, { align: 'center' });

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
    doc.line(margin, y + 7, pageWidth - margin, y + 7);

    y += 9;
  });

  y += 4;

  // 5. Financial Summary
  const totalsX = pageWidth - margin - 75;
  const totalsValX = pageWidth - margin - 4;

  function renderTotalRow(label: string, value: string, isBold = false, color = [71, 85, 105]) {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9.5 : 8.5);
    doc.text(label, totalsX, y);
    doc.text(value, totalsValX, y, { align: 'right' });
    y += 5.5;
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

  // Grand Total Box
  y += 2;
  doc.setFillColor(38, 22, 48); // #261630
  doc.roundedRect(totalsX - 4, y - 4, 82, 11, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GRAND TOTAL', totalsX, y + 3);
  doc.setFontSize(11);
  doc.text(
    `Rs. ${Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    totalsValX - 2,
    y + 3,
    { align: 'right' }
  );

  y += 18;

  // 6. Payment Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PAYMENT SUMMARY', margin + 4, y + 5.5);

  const paidAmount = Number(invoice.paid_amount || invoice.total);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Payment Received: Rs. ${paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 4, y + 12);

  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: PAID IN FULL ✓`, pageWidth - margin - 4, y + 12, { align: 'right' });

  // 7. Footer
  const footerY = 278;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Thank you for choosing ${salonName}! We look forward to serving you again.`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 174, 192);
  doc.text('Computer-generated tax invoice. No signature required. Powered by SalonPro Cloud ERP', pageWidth / 2, footerY + 5, {
    align: 'center',
  });

  return doc;
}

/**
 * Smart Device-Adaptive WhatsApp Bill Dispatcher:
 * - On Mobile/Tablet: Uses Web Share API to attach the PDF document directly into WhatsApp.
 * - On Desktop PC: Downloads PDF file directly to downloads and opens WhatsApp Web with the client chat & direct PDF link.
 */
export async function dispatchSmartWhatsAppBill(invoice: InvoiceBillData): Promise<ShareResult> {
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
  const fileName = `Invoice_${invoice.number}.pdf`;

  // 1. Generate PDF in memory
  let pdfFile: File | null = null;
  let doc: any = null;

  try {
    doc = await generateInvoicePdfDoc(invoice);
    const pdfBlob = doc.output('blob');
    pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
  } catch (err) {
    console.error('Failed to generate in-memory PDF:', err);
  }

  // 2. Check if device supports Web Share API with files (Mobile Phones & Tablets)
  const canShareFiles =
    pdfFile &&
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [pdfFile] });

  // 3. Mark sent in backend DB
  try {
    await fetch('/api/billing/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoice.id }),
    });
  } catch {}

  // 4A. Mobile / Tablet Path: Native file sharing directly into WhatsApp
  if (canShareFiles && pdfFile) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Invoice #${invoice.number}`,
        text: `Dear ${invoice.customer_name}, thank you for visiting ${salonName}! Here is your official PDF bill for ₹${totalFormatted}. Digital Bill: ${receiptLink}`,
      });

      return {
        success: true,
        method: 'native_share',
        message: 'WhatsApp opened with PDF bill attached! Tap Send in WhatsApp.',
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          method: 'cancelled',
          message: 'Sharing cancelled by user.',
        };
      }
      // If native share encountered an error, fall through to Desktop/WhatsApp Web path
    }
  }

  // 4B. Desktop PC / Laptop Path: Trigger PDF download + Open WhatsApp Web with prefilled message
  if (doc) {
    try {
      doc.save(fileName);
    } catch {}
  }

  const msg = [
    `✨ *Dear ${invoice.customer_name}, thank you for visiting ${salonName}!* ✨`,
    `🧾 *Invoice #:* ${invoice.number}`,
    `💰 *Total Amount:* ₹${totalFormatted}`,
    `💳 *Payment Received:* ₹${paidFormatted} (Paid in Full ✓)`,
    ``,
    `📄 *View & Download Official PDF Receipt:*`,
    `👉 ${receiptLink}`,
    ``,
    `_We look forward to welcoming you again!_`,
  ].join('\n');

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');

  return {
    success: true,
    method: 'whatsapp_web',
    message: 'PDF bill downloaded to PC & WhatsApp Web opened! Press Send in chat.',
  };
}
