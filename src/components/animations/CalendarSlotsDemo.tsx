'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

const slotsData = [
  { time: '10:00 AM', name: 'Ritu K.', color: 'bg-[#F1EBEF] dark:bg-[#2B2230] text-[#4B263F] dark:text-[#D6A0B4] border border-[#E8E1E5] dark:border-[#3A3040]' },
  { time: '11:30 AM', name: 'Priya S.', color: 'bg-[#F1EBEF] dark:bg-[#2B2230] text-[#B77A91] dark:text-[#D6A0B4] border border-[#E8E1E5] dark:border-[#3A3040]' },
  { time: '02:00 PM', name: 'Kavita M.', color: 'bg-[#2F7D68]/15 dark:bg-[#55B99A]/20 text-[#2F7D68] dark:text-[#55B99A] border border-[#2F7D68]/30 dark:border-[#55B99A]/30' },
];

export default function CalendarSlotsDemo() {
  const shouldReduceMotion = useReducedMotion();
  const [filledCount, setFilledCount] = useState(1);

  useEffect(() => {
    if (shouldReduceMotion) return;

    // Slots fill one after another
    const interval = setInterval(() => {
      setFilledCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 1900);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div className="mt-3 p-3 rounded-2xl bg-[#F7F5F2] dark:bg-[#151218] border border-[#E8E1E5] dark:border-[#3A3040] space-y-1.5 shadow-inner transition-colors duration-300">
      <div className="text-[10px] font-bold text-[#77717A] dark:text-[#B5AAB8] uppercase tracking-wider mb-1 flex items-center justify-between">
        <span>Today&apos;s Schedule</span>
        <span className="text-[#4B263F] dark:text-[#D6A0B4]">Stylist: Priya</span>
      </div>

      <div className="space-y-1">
        {slotsData.map((slot, idx) => (
          <div
            key={slot.time}
            className="flex items-center justify-between p-1.5 rounded-xl bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[11px]"
          >
            <span className="font-mono text-[#77717A] dark:text-[#B5AAB8] font-semibold">{slot.time}</span>
            {idx < filledCount ? (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${slot.color}`}
              >
                <Check className="w-2.5 h-2.5" />
                <span>{slot.name}</span>
              </motion.span>
            ) : (
              <span className="px-2 py-0.5 rounded-lg text-[10px] text-[#77717A]/60 dark:text-[#B5AAB8]/50 bg-[#F1EBEF]/40 dark:bg-[#2B2230]/40">
                Available
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
