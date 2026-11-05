'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DoubleBookingDemo() {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (shouldReduceMotion) return;

    // Cycle through animation steps:
    // 0: Slot empty
    // 1: Client 1 enters 4:00 PM slot (Green)
    // 2: Client 2 tries to enter same slot -> Collision! (Red Shake)
    // 3: SalonPro blocks Client 2 with "Slot Protected" badge
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setStep((prev) => ((prev + 1) % 4) as any);
    }, 2800);

    return () => clearInterval(timer);
  }, [shouldReduceMotion]);

  return (
    <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#1F2937] dark:text-[#FFFFFF] shadow-md relative overflow-hidden transition-colors duration-300">
      <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A] text-xs">
        <span className="font-bold text-[#1F2937] dark:text-[#FFFFFF]">Interactive Conflict Engine</span>
        <span className="text-[10px] font-mono text-[#D4A77F] font-semibold">Slot: 04:00 PM</span>
      </div>

      <div className="py-3 flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* The 4:00 PM Slot Box */}
        <motion.div
          animate={
            step === 2
              ? { x: [-6, 6, -5, 5, -2, 2, 0], borderColor: '#EF4444' }
              : step >= 1
              ? { borderColor: '#10B981' }
              : { borderColor: '#E5E7EB' }
          }
          transition={{ duration: 0.4 }}
          className={`w-full max-w-[280px] sm:w-64 p-3 rounded-xl border-2 transition-colors ${
            step === 2
              ? 'bg-[#EF4444]/10 border-[#EF4444]'
              : step >= 1
              ? 'bg-[#10B981]/10 border-[#10B981]'
              : 'bg-[#F8F9FA] dark:bg-[#080B12] border-[#E5E7EB] dark:border-[#2A2F3A]'
          }`}
        >
          <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] font-mono flex items-center justify-between mb-1.5">
            <span>Primary Slot: 04:00 PM</span>
            {step >= 1 && <span className="text-[#10B981] font-bold">● Occupied</span>}
          </div>

          {/* Client 1 Chip */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 rounded-lg bg-[#10B981] text-white font-bold text-xs flex items-center justify-between shadow-xs"
              >
                <span>Client A (Pooja P.)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Client 2 Attempt / Rejection */}
          <AnimatePresence>
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2 p-2 rounded-lg bg-[#EF4444] text-white font-bold text-xs flex items-center justify-between shadow-xs"
              >
                <span>Client B (Concurrent Attempt)</span>
                <AlertCircle className="w-3.5 h-3.5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Advisory Lock Action Callout */}
        <div className="text-center sm:text-left min-w-0 sm:min-w-[180px]">
          {step === 0 && (
            <span className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Waiting for booking requests...</span>
          )}
          {step === 1 && (
            <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1 justify-center sm:justify-start">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Client A Confirmed!</span>
            </span>
          )}
          {step === 2 && (
            <span className="text-xs text-[#EF4444] font-bold flex items-center gap-1 justify-center sm:justify-start animate-bounce">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Collision Prevented!</span>
            </span>
          )}
          {step === 3 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4A77F]/20 text-[#D4A77F] border border-[#D4A77F]/40 text-xs font-bold"
            >
              <ShieldCheck className="w-4 h-4 text-[#D4A77F]" />
              <span>Slot Protected (0 Overlaps)</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
