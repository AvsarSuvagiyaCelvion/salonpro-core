'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Receipt } from 'lucide-react';

export default function PosInvoiceDemo() {
  const shouldReduceMotion = useReducedMotion();
  const [lineStep, setLineStep] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;

    // Loop steps:
    // 0: Header only
    // 1: Add Hair Cut
    // 2: Add Treatment Serum
    // 3: Add CGST/SGST Taxes
    // 4: Grand total counts up
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setLineStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 2400);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-[#080B12] border border-[#E5E7EB] dark:border-[#2A2F3A] font-mono text-[11px] space-y-1.5 shadow-inner transition-colors duration-300">
      <div className="flex items-center justify-between text-[#6B7280] dark:text-[#A0A8B8] pb-1 border-b border-dashed border-[#E5E7EB] dark:border-[#2A2F3A]">
        <span className="flex items-center gap-1 font-bold text-[#1F2937] dark:text-[#FFFFFF]">
          <Receipt className="w-3 h-3 text-[#D4A77F]" />
          <span>INV-2026-904</span>
        </span>
        <span className="text-[10px] text-[#10B981] font-bold">10-Sec POS</span>
      </div>

      <div className="space-y-1 text-[#1F2937] dark:text-[#FFFFFF] min-h-[75px]">
        {lineStep >= 1 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between"
          >
            <span>Haircut & Styling</span>
            <span className="font-bold">₹800</span>
          </motion.div>
        )}

        {lineStep >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between"
          >
            <span>Argan Hair Serum</span>
            <span className="font-bold">₹1,200</span>
          </motion.div>
        )}

        {lineStep >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-1 border-t border-[#E5E7EB] dark:border-[#2A2F3A] space-y-0.5 text-[10px] text-[#6B7280] dark:text-[#A0A8B8]"
          >
            <div className="flex items-center justify-between">
              <span>CGST (9%)</span>
              <span>₹180</span>
            </div>
            <div className="flex items-center justify-between">
              <span>SGST (9%)</span>
              <span>₹180</span>
            </div>
          </motion.div>
        )}

        {lineStep >= 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-1 border-t-2 border-[#D4A77F] flex items-center justify-between text-xs font-black text-[#D4A77F]"
          >
            <span>Total Payable</span>
            <span>₹2,360</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
