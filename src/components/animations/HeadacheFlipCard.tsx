'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, RotateCw } from 'lucide-react';

interface HeadacheFlipCardProps {
  headacheTitle: string;
  headacheDesc: string;
  solutionTitle: string;
  solutionDesc: string;
}

export default function HeadacheFlipCard({
  headacheTitle,
  headacheDesc,
  solutionTitle,
  solutionDesc,
}: HeadacheFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // If reduced motion, show a clean stacked card without 3D flip
  if (shouldReduceMotion) {
    return (
      <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">❌</span>
          <div>
            <h4 className="font-bold text-[#1F2937] dark:text-[#FFFFFF]">{headacheTitle}</h4>
            <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">{headacheDesc}</p>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#10B981]/30 text-[#10B981] text-xs">
          <strong>{solutionTitle}:</strong> {solutionDesc}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[250px] sm:h-[230px] w-full perspective-[1000px] cursor-pointer group select-none"
      onClick={() => setIsFlipped(!isFlipped)}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full relative preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT: The Red Headache */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 flex items-center justify-center font-bold text-lg shrink-0">
              ❌
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#1F2937] dark:text-[#FFFFFF] leading-snug">
                {headacheTitle}
              </h4>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-2 leading-relaxed">
                {headacheDesc}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
            <span className="text-[#EF4444] font-semibold">Common Salon Struggle</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#D4A77F]">
              <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
              <span>Hover or Tap to see Solution</span>
            </span>
          </div>
        </div>

        {/* BACK: The Green SalonPro Solution */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden bg-[#F8F9FA] dark:bg-[#10141F] border border-[#10B981]/40 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#10B981] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-[#1F2937] dark:text-[#FFFFFF] leading-snug">
                {solutionTitle}
              </h4>
              <p className="text-xs text-[#10B981] mt-2 leading-relaxed font-medium">
                {solutionDesc}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between text-[11px] text-[#10B981] font-bold">
            <span>✨ SalonPro Built-In</span>
            <span className="text-[10px] bg-white dark:bg-[#141926] px-2 py-0.5 rounded-full border border-[#10B981]/30">
              Zero Headache
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
