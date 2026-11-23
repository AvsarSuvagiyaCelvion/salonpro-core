'use client';

import React, { useState } from 'react';
import { Download, Printer, Loader2, Check } from 'lucide-react';
import { generateInvoicePdfDoc } from '@/lib/whatsapp-bill';

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
    email?: string | null;
    gstin?: string | null;
    upi_id?: string | null;
    logo_url?: string | null;
  };
  invoice: {
    number: string;
    created_at: string;
    customer_name: string;
    customer_mobile?: string | null;
    customer_id?: string | null;
    appointment_id?: string | null;
    subtotal: number | string;
    discount_amount?: number | string;
    tax_amount?: number | string;
    total: number | string;
  };
  items: InvoiceItem[];
  payments: PaymentRecord[];
  taxableSubtotal?: number;
  cgst?: number;
  sgst?: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
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

  // Direct PDF Vector Document Download using minimalist publication engine
  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);

    try {
      const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
      const primaryPayment = payments && payments.length > 0 ? payments[0] : null;

      const doc = await generateInvoicePdfDoc({
        id: invoice.number,
        number: invoice.number,
        customer_name: invoice.customer_name,
        customer_mobile: invoice.customer_mobile || '',
        customer_id: invoice.customer_id || undefined,
        appointment_id: invoice.appointment_id || undefined,
        subtotal: invoice.subtotal,
        discount_amount: invoice.discount_amount,
        tax_amount: (cgst || 0) + (sgst || 0),
        cgst,
        sgst,
        total: invoice.total,
        paid_amount: status === 'PAID' ? invoice.total : totalPaid,
        due_amount: Math.max(0, Number(invoice.total) - totalPaid),
        payment_method: primaryPayment?.method || 'UPI / Cash / Card',
        payment_reference: primaryPayment?.reference || undefined,
        status,
        created_at: invoice.created_at,
        items: (items || []).map((it) => ({
          name: it.name,
          qty: it.qty || 1,
          unit_price: it.unit_price,
          kind: it.kind || 'service',
        })),
        salon_name: salon.name,
        salon_phone: salon.phone || '',
        salon_address: salon.address || '',
        salon_email: salon.email || '',
        salon_gstin: salon.gstin || '',
        salon_upi_id: salon.upi_id || '',
        logo_url: salon.logo_url,
      });

      const cleanNum = (invoice.number || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`Invoice_${cleanNum}.pdf`);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // Fallback to hardware print dialog
      if (typeof window !== 'undefined') {
        window.print();
      }
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full print:hidden">
      {/* Button 1: Minimalist Black PDF File Download */}
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-70 border-0 outline-none"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Generating A4 PDF...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span>PDF Saved!</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Download A4 PDF</span>
          </>
        )}
      </button>

      {/* Button 2: Minimalist White Print Receipt */}
      <button
        type="button"
        onClick={handlePrint}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-900 text-xs sm:text-sm font-bold border border-neutral-300 shadow-xs transition-all active:scale-95 cursor-pointer outline-none"
      >
        <Printer className="w-4 h-4 text-neutral-700" />
        <span>Print Invoice</span>
      </button>
    </div>
  );
}
