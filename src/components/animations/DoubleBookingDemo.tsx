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
      setStep((prev) => ((prev + 1) % 4) as any);
    }, 2400);

    return () => clearInterval(timer);
  }, [shouldReduceMotion]);

  return (
    <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5] shadow-md relative overflow-hidden transition-colors duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-[#E8E1E5] dark:border-[#3A3040] text-xs">
        <span className="font-bold text-[#242126] dark:text-[#F5EFF5]">Interactive Conflict Engine</span>
        <span className="text-[10px] font-mono text-[#4B263F] dark:text-[#D6A0B4] font-semibold">Slot: 04:00 PM (Stylist: Priya)</span>
      </div>

      <div className="py-3 flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* The 4:00 PM Slot Box */}
        <motion.div
          animate={
            step === 2
              ? { x: [-6, 6, -5, 5, -2, 2, 0], borderColor: '#C65B62' }
              : step >= 1
              ? { borderColor: '#2F7D68' }
              : { borderColor: '#E8E1E5' }
          }
          transition={{ duration: 0.4 }}
          className={`w-full sm:w-64 p-3 rounded-xl border-2 transition-colors ${
            step === 2
              ? 'bg-[#C65B62]/10 dark:bg-[#EF858B]/15 border-[#C65B62] dark:border-[#EF858B]'
              : step >= 1
              ? 'bg-[#2F7D68]/10 dark:bg-[#55B99A]/15 border-[#2F7D68] dark:border-[#55B99A]'
              : 'bg-[#F7F5F2] dark:bg-[#151218] border-[#E8E1E5] dark:border-[#3A3040]'
          }`}
        >
          <div className="text-[10px] text-[#77717A] dark:text-[#B5AAB8] font-mono flex items-center justify-between mb-1.5">
            <span>Primary Slot: 04:00 PM</span>
            {step >= 1 && <span className="text-[#2F7D68] dark:text-[#55B99A] font-bold">● Occupied</span>}
          </div>

          {/* Client 1 Chip */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 rounded-lg bg-[#2F7D68] dark:bg-[#55B99A] text-white dark:text-[#151218] font-bold text-xs flex items-center justify-between shadow-xs"
              >
                <span>Client A (Pooja P.)</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-white dark:text-[#151218]" />
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
                className="mt-2 p-2 rounded-lg bg-[#C65B62] dark:bg-[#EF858B] text-white dark:text-[#151218] font-bold text-xs flex items-center justify-between shadow-xs"
              >
                <span>Client B (Concurrent Attempt)</span>
                <AlertCircle className="w-3.5 h-3.5 text-white dark:text-[#151218]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Advisory Lock Action Callout */}
        <div className="text-center sm:text-left min-w-[180px]">
          {step === 0 && (
            <span className="text-xs text-[#77717A] dark:text-[#B5AAB8]">Waiting for booking requests...</span>
          )}
          {step === 1 && (
            <span className="text-xs text-[#2F7D68] dark:text-[#55B99A] font-semibold flex items-center gap-1 justify-center sm:justify-start">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Client A Confirmed!</span>
            </span>
          )}
          {step === 2 && (
            <span className="text-xs text-[#C65B62] dark:text-[#EF858B] font-bold flex items-center gap-1 justify-center sm:justify-start animate-bounce">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Collision Detected!</span>
            </span>
          )}
          {step === 3 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4B263F]/10 dark:bg-[#D6A0B4]/20 text-[#4B263F] dark:text-[#D6A0B4] border border-[#4B263F]/20 dark:border-[#D6A0B4]/40 text-xs font-bold"
            >
              <ShieldCheck className="w-4 h-4 text-[#4B263F] dark:text-[#D6A0B4]" />
              <span>Slot Protected (409 Handled)</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
