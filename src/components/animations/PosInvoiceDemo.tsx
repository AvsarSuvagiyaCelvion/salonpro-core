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
    <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 font-mono text-[11px] space-y-1.5 shadow-inner">
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1 border-b border-dashed border-slate-300 dark:border-slate-700">
        <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
          <Receipt className="w-3 h-3 text-[#b3135b] dark:text-pink-400" />
          <span>INV-2026-904</span>
        </span>
        <span>10-Sec POS</span>
      </div>

      <div className="space-y-1 text-slate-700 dark:text-slate-300 min-h-[75px]">
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
            className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400"
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
      </div>

      <div className="pt-1.5 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between font-bold text-slate-900 dark:text-white">
        <span>Total (GST Paid)</span>
        <span className="text-[#b3135b] dark:text-pink-400 font-extrabold text-xs">
          {lineStep >= 4 ? '₹2,360' : lineStep >= 2 ? '₹2,000' : '₹800'}
        </span>
      </div>
    </div>
  );
}
