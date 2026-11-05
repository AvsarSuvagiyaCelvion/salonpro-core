'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

const slotsData = [
  { time: '10:00 AM', name: 'Ritu K.', color: 'bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] border border-[#E5E7EB] dark:border-[#2A2F3A]' },
  { time: '11:30 AM', name: 'Priya S.', color: 'bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] border border-[#E5E7EB] dark:border-[#2A2F3A]' },
  { time: '02:00 PM', name: 'Kavita M.', color: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' },
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
    <div className="mt-3 p-3 rounded-2xl bg-[#F8F9FA] dark:bg-[#080B12] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-1.5 shadow-inner transition-colors duration-300">
      <div className="text-[10px] font-bold text-[#6B7280] dark:text-[#A0A8B8] uppercase tracking-wider mb-1 flex items-center justify-between">
        <span>Today&apos;s Schedule</span>
        <span className="text-[#D4A77F]">Stylist: Priya</span>
      </div>

      <div className="space-y-1">
        {slotsData.map((slot, idx) => (
          <div
            key={slot.time}
            className="flex items-center justify-between p-1.5 rounded-xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[11px]"
          >
            <span className="font-mono text-[#6B7280] dark:text-[#A0A8B8] font-semibold">{slot.time}</span>
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
              <span className="px-2 py-0.5 rounded-lg text-[10px] text-[#9CA3AF] bg-[#F3F4F6] dark:bg-[#1C2230]">
                Available
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
