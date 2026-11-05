'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { Scissors, Sparkles, Feather, Wind } from 'lucide-react';

export default function FloatingIcons() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    /* Positioned safely in the side margins; visible on md+ without occluding text */
    <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Top-Left Floating Scissors */}
      <div
        style={{
          animation: 'floatBobUpDown1 3.8s ease-in-out infinite',
          willChange: 'transform',
        }}
        className="absolute top-14 left-4 xl:left-12 p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-[#141926]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-lg shadow-[#D4A77F]/10 dark:shadow-black/30 text-[#D4A77F] transition-colors"
      >
        <Scissors className="w-5 h-5 xl:w-6 xl:h-6" />
      </div>

      {/* 2. Top-Right Floating Hair Dryer / Air Flow */}
      <div
        style={{
          animation: 'floatBobUpDown2 4.2s ease-in-out infinite',
          animationDelay: '0.9s',
          willChange: 'transform',
        }}
        className="absolute top-16 right-4 xl:right-14 p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-[#141926]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-lg shadow-[#D4A77F]/10 dark:shadow-black/30 text-[#D4A77F] transition-colors"
      >
        <Wind className="w-5 h-5 xl:w-6 xl:h-6" />
      </div>

      {/* 3. Mid-Left Luxury Champagne Sparkles */}
      <div
        style={{
          animation: 'floatBobUpDown3 3.6s ease-in-out infinite',
          animationDelay: '1.6s',
          willChange: 'transform',
        }}
        className="absolute top-64 left-6 xl:left-16 p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-[#141926]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-lg shadow-[#D4A77F]/10 dark:shadow-black/30 text-[#D4A77F] transition-colors"
      >
        <Sparkles className="w-5 h-5 xl:w-6 xl:h-6" />
      </div>

      {/* 4. Mid-Right Styling Feather */}
      <div
        style={{
          animation: 'floatBobUpDown4 4.4s ease-in-out infinite',
          animationDelay: '2.3s',
          willChange: 'transform',
        }}
        className="absolute top-60 right-6 xl:right-16 p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-[#141926]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-lg shadow-[#D4A77F]/10 dark:shadow-black/30 text-[#D4A77F] transition-colors"
      >
        <Feather className="w-5 h-5 xl:w-6 xl:h-6" />
      </div>

      <style jsx>{`
        @keyframes floatBobUpDown1 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-24px) rotate(8deg);
          }
        }
        @keyframes floatBobUpDown2 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(-8deg);
          }
        }
        @keyframes floatBobUpDown3 {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-22px) scale(1.08);
          }
        }
        @keyframes floatBobUpDown4 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-26px) rotate(10deg);
          }
        }
      `}</style>
    </div>
  );
}
