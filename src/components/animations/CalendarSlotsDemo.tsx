'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

const slotsData = [
  { time: '10:00 AM', name: 'Ritu K.', color: 'bg-pink-100 text-[#b3135b]' },
  { time: '11:30 AM', name: 'Priya S.', color: 'bg-purple-100 text-purple-700' },
  { time: '02:00 PM', name: 'Kavita M.', color: 'bg-emerald-100 text-emerald-800' },
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
    <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 shadow-inner">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
        <span>Today&apos;s Schedule</span>
        <span className="text-[#b3135b]">Stylist: Priya</span>
      </div>

      <div className="space-y-1">
        {slotsData.map((slot, idx) => (
          <div
            key={slot.time}
            className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-slate-200 text-[11px]"
          >
            <span className="font-mono text-slate-600 font-semibold">{slot.time}</span>
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
              <span className="px-2 py-0.5 rounded-lg text-[10px] text-slate-400 bg-slate-50">
                Available
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
