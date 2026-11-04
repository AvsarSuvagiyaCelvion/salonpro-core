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
      setLineStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 1800);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 font-mono text-[11px] space-y-1.5 shadow-inner">
      <div className="flex items-center justify-between text-slate-500 pb-1 border-b border-dashed border-slate-300">
        <span className="flex items-center gap-1 font-bold text-slate-700">
          <Receipt className="w-3 h-3 text-[#b3135b]" />
          <span>INV-2026-904</span>
        </span>
        <span>10-Sec POS</span>
      </div>

      <div className="space-y-1 text-slate-700 min-h-[75px]">
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
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-200"
          >
            <span>CGST (9%) + SGST (9%)</span>
            <span>+₹360</span>
          </motion.div>
        )}

        {lineStep >= 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between text-xs font-black text-[#b3135b] pt-1 border-t border-dashed border-slate-300"
          >
            <span>PAID VIA UPI</span>
            <span className="text-sm">₹2,360.00</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
