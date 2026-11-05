'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { Scissors, Sparkles, Feather, Wind } from 'lucide-react';

export default function FloatingIcons() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    /* Hidden on mobile to prevent any text occlusion; positioned safely in the desktop margins */
    <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none select-none -z-5">
      {/* 1. Top-Left Floating Scissors */}
      <div
        style={{
          animation: 'floatIcon1 7s ease-in-out infinite alternate',
          willChange: 'transform',
        }}
        className="absolute top-16 left-6 xl:left-14 p-3 rounded-2xl bg-white dark:bg-[#141926] backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-md text-[#D4A77F]"
      >
        <Scissors className="w-5 h-5 xl:w-6 xl:h-6" />
      </div>

      {/* 2. Top-Right Floating Hair Dryer / Air Flow */}
      <div
        style={{
          animation: 'floatIcon2 8s ease-in-out infinite alternate',
          animationDelay: '0.8s',
          willChange: 'transform',
        }}
        className="absolute top-20 right-6 xl:right-16 p-3 rounded-2xl bg-white dark:bg-[#141926] backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-md text-[#D4A77F]"
      >
        <Wind className="w-5 h-5 xl:w-6 xl:h-6" />
      </div>

      {/* 3. Mid-Left Luxury Champagne Sparkles */}
      <div
        style={{
          animation: 'floatIcon3 9s ease-in-out infinite alternate',
          animationDelay: '1.4s',
          willChange: 'transform',
        }}
        className="absolute top-72 left-8 p-3 rounded-2xl bg-white dark:bg-[#141926] backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-md text-[#D4A77F]"
      >
        <Sparkles className="w-5 h-5" />
      </div>

      {/* 4. Mid-Right Styling Feather */}
      <div
        style={{
          animation: 'floatIcon4 8.5s ease-in-out infinite alternate',
          animationDelay: '2s',
          willChange: 'transform',
        }}
        className="absolute top-64 right-10 p-3 rounded-2xl bg-white dark:bg-[#141926] backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-md text-[#D4A77F]"
      >
        <Feather className="w-5 h-5" />
      </div>

      <style jsx>{`
        @keyframes floatIcon1 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          100% {
            transform: translate3d(10px, -18px, 0) rotate(8deg);
          }
        }
        @keyframes floatIcon2 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          100% {
            transform: translate3d(-12px, -14px, 0) rotate(-6deg);
          }
        }
        @keyframes floatIcon3 {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(14px, 12px, 0) scale(1.08);
          }
        }
        @keyframes floatIcon4 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          100% {
            transform: translate3d(-10px, 16px, 0) rotate(12deg);
          }
        }
      `}</style>
    </div>
  );
}
