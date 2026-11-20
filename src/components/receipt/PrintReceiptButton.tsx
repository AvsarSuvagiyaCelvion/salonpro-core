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
    logo_url?: string | null;
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

  // 1. Direct PDF Vector Document Download using unified publication-grade engine
  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);

    try {
      const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
      const doc = await generateInvoicePdfDoc({
        id: invoice.number,
        number: invoice.number,
        customer_name: invoice.customer_name,
        customer_mobile: invoice.customer_mobile || '',
        subtotal: invoice.subtotal,
        discount_amount: invoice.discount_amount,
        tax_amount: (cgst || 0) + (sgst || 0),
        total: invoice.total,
        paid_amount: status === 'PAID' ? invoice.total : totalPaid,
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
        logo_url: salon.logo_url,
      });

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
      // Fallback to hardware print dialog
      if (typeof window !== 'undefined') {
        window.print();
      }
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
