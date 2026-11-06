'use client';

import React, { useState } from 'react';
import { Download, Printer, Loader2, Check } from 'lucide-react';

export interface InvoiceItem {
  name: string;
  kind?: string;
  qty?: number;
  unit_price: number | string;
}

export interface PaymentRecord {
  method: string;
  amount: number | string;
  reference?: string | null;
}

export interface PrintReceiptButtonProps {
  salon: {
    name: string;
    address?: string | null;
    phone?: string | null;
  };
  invoice: {
    number: string;
    created_at: string;
    customer_name: string;
    customer_mobile?: string | null;
    subtotal: number | string;
    discount_amount?: number | string;
    total: number | string;
  };
  items: InvoiceItem[];
  payments: PaymentRecord[];
  taxableSubtotal?: number;
  cgst?: number;
  sgst?: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
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

export default function PrintReceiptButton({
  salon,
  invoice,
  items,
  payments,
  taxableSubtotal = 0,
  cgst = 0,
  sgst = 0,
  status,
}: PrintReceiptButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // 1. Direct PDF Vector Document Download (Zero Print Menu)
  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);

    try {
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // 1. Top Header Banner
      doc.setFillColor(24, 24, 27); // #18181b
      doc.rect(0, 0, pageWidth, 42, 'F');

      // Salon Name
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(salon.name || 'Salon Receipt', margin, 16);

      // Salon Address & Phone
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(200, 200, 200);
      doc.text(salon.address || 'Boutique Salon & Spa', margin, 23);
      if (salon.phone) {
        doc.text(`Ph: ${salon.phone}`, margin, 28);
      }

      // Status Badge
      const badgeText = (status || 'PAID').toUpperCase();
      const badgeWidth = 24;
      const badgeX = pageWidth - margin - badgeWidth;
      if (status === 'PAID') {
        doc.setFillColor(16, 185, 129); // emerald
      } else if (status === 'PARTIAL') {
        doc.setFillColor(245, 158, 11); // amber
      } else {
        doc.setFillColor(244, 63, 94); // rose
      }
      doc.roundedRect(badgeX, 10, badgeWidth, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
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
      doc.text(invoice.customer_name || 'Walk-in Client', margin + 6, y + 14);

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

      const dateStr = new Date(invoice.created_at).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
      (items || []).forEach((item) => {
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

      renderTotalRow(
        'Subtotal',
        `Rs. ${Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      );
      if (Number(invoice.discount_amount) > 0) {
        renderTotalRow(
          'Discount',
          `-Rs. ${Number(invoice.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          false,
          [219, 39, 119]
        );
      }
      if (taxableSubtotal > 0) {
        renderTotalRow('Taxable Value', `Rs. ${Number(taxableSubtotal).toFixed(2)}`);
      }
      if (cgst > 0) {
        renderTotalRow('CGST (9%)', `Rs. ${Number(cgst).toFixed(2)}`);
      }
      if (sgst > 0) {
        renderTotalRow('SGST (9%)', `Rs. ${Number(sgst).toFixed(2)}`);
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

      const payStr =
        (payments || [])
          .map((p) => `${p.method.toUpperCase()}: Rs. ${Number(p.amount).toLocaleString('en-IN')}`)
          .join(' | ') || 'No payment recorded';
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(payStr, margin + 4, y + 12);

      const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Total Paid: Rs. ${totalPaid.toLocaleString('en-IN')}`,
        pageWidth - margin - 4,
        y + 12,
        { align: 'right' }
      );

      // 7. Footer
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Thank you for pampering yourself with us! ✨', pageWidth / 2, 275, {
        align: 'center',
      });
      doc.setFontSize(7);
      doc.text(
        'Prices are inclusive of all applicable GST. This is a computer generated invoice.',
        pageWidth / 2,
        280,
        { align: 'center' }
      );
      doc.text('Powered by SalonPro ERP Cloud', pageWidth / 2, 284, { align: 'center' });

      // Direct Browser File Download: Name with salon name and invoice number instead of generic "Invoice-INV-..."
      const cleanSalonName = (salon.name || 'Salon')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_');
      const cleanInvoiceNum = (invoice.number || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`${cleanSalonName}-${cleanInvoiceNum}.pdf`);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Unable to generate PDF directly. Please use the Print Receipt button to save as PDF.');
    } finally {
      setDownloading(false);
    }
  }

  // 2. Hardware / Browser Print Trigger
  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full print:hidden">
      {/* Button 1: Direct PDF File Download */}
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs sm:text-sm font-bold shadow-lg shadow-[#D4A77F]/20 transition-all active:scale-95 cursor-pointer disabled:opacity-70 border-0 outline-none"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Generating PDF...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <Check className="w-4 h-4 text-emerald-300" />
            <span>PDF Downloaded!</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </>
        )}
      </button>

      {/* Button 2: Direct Print Receipt */}
      <button
        type="button"
        onClick={handlePrint}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-bold border border-neutral-300 shadow-sm transition-all active:scale-95 cursor-pointer outline-none"
      >
        <Printer className="w-4 h-4 text-neutral-600" />
        <span>Print Receipt</span>
      </button>
    </div>
  );
}
