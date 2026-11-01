'use client';

import React, { useState } from 'react';
import { Download, Printer, Loader2, Check } from 'lucide-react';

interface PrintReceiptButtonProps {
  invoiceNumber?: string;
  targetId?: string;
}

export default function PrintReceiptButton({
  invoiceNumber = 'Receipt',
  targetId = 'invoice-receipt-card',
}: PrintReceiptButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // 1. Direct PDF File Download
  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);

    try {
      const target = document.getElementById(targetId);
      if (!target) {
        // Fallback to window.print if target element not found
        window.print();
        return;
      }

      // Dynamic client-side import to prevent SSR errors
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Capture receipt DOM element
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => {
          return (
            el.hasAttribute('data-html2canvas-ignore') ||
            el.classList.contains('print:hidden')
          );
        },
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = 210; // Standard A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If receipt is longer than A4, create single continuous height page; otherwise standard A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: imgHeight > 297 ? [imgWidth, imgHeight + 8] : 'a4',
      });

      pdf.addImage(imgData, 'PNG', 0, 4, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`Invoice-${invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error, falling back to print:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  // 2. Direct Hardware / Thermal Printer Trigger
  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full" data-html2canvas-ignore="true">
      {/* Button 1: Direct PDF File Download */}
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-pink-900/20 transition-all active:scale-95 cursor-pointer disabled:opacity-70 border-0 outline-none"
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
