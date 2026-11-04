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
    <div className="mt-3 p-3.5 rounded-2xl bg-[#F7F5F2] dark:bg-[#151218] border border-[#E8E1E5] dark:border-[#3A3040] font-mono text-[11px] space-y-1.5 shadow-inner transition-colors duration-300">
      <div className="flex items-center justify-between text-[#77717A] dark:text-[#B5AAB8] pb-1 border-b border-dashed border-[#E8E1E5] dark:border-[#3A3040]">
        <span className="flex items-center gap-1 font-bold text-[#242126] dark:text-[#F5EFF5]">
          <Receipt className="w-3 h-3 text-[#4B263F] dark:text-[#D6A0B4]" />
          <span>INV-2026-904</span>
        </span>
        <span className="text-[10px] text-[#2F7D68] dark:text-[#55B99A] font-bold">10-Sec POS</span>
      </div>

      <div className="space-y-1 text-[#242126] dark:text-[#F5EFF5] min-h-[75px]">
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
            className="pt-1 border-t border-[#E8E1E5] dark:border-[#3A3040] space-y-0.5 text-[10px] text-[#77717A] dark:text-[#B5AAB8]"
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
            className="pt-1 border-t-2 border-[#4B263F] dark:border-[#D6A0B4] flex items-center justify-between text-xs font-black text-[#4B263F] dark:text-[#D6A0B4]"
          >
            <span>Total Payable</span>
            <span>₹2,360</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
