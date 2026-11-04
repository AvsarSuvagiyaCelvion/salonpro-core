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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">❌</span>
          <div>
            <h4 className="font-bold text-slate-900">{headacheTitle}</h4>
            <p className="text-xs text-slate-600 mt-1">{headacheDesc}</p>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
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
          className="absolute inset-0 w-full h-full backface-hidden bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
              ❌
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {headacheTitle}
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {headacheDesc}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-rose-600 font-semibold">Common Salon Struggle</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#b3135b]">
              <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
              <span>Hover or Tap to see Solution</span>
            </span>
          </div>
        </div>

        {/* BACK: The Green SalonPro Solution */}
        <div
          className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-emerald-900/20">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-emerald-950 leading-snug">
                {solutionTitle}
              </h4>
              <p className="text-xs text-emerald-900 mt-2 leading-relaxed font-medium">
                {solutionDesc}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-700 font-bold">
            <span>✨ SalonPro Guaranteed</span>
            <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              Zero Headache
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
