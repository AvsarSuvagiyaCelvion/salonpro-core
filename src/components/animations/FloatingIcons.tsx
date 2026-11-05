'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { Scissors, Sparkles, Feather, Wind } from 'lucide-react';

export default function FloatingIcons() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    /* Positioned safely across all screens: mobile, tablet & desktop with zero content overlap */
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Top-Left Floating Scissors */}
      <div
        style={{
          animation: 'floatBobUpDown1 3.8s ease-in-out infinite',
          willChange: 'transform',
        }}
        className="absolute top-2 sm:top-8 xl:top-14 left-1 sm:left-4 xl:left-12 p-2 sm:p-3 xl:p-3.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#141926]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-md sm:shadow-lg shadow-[#D4A77F]/10 dark:shadow-black/30 text-[#D4A77F] opacity-80 sm:opacity-100 transition-colors"
      >
        <Scissors className="w-3.5 h-3.5 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />
      </div>

      {/* 2. Top-Right Floating Hair Dryer / Air Flow */}
      <div
        style={{
          animation: 'floatBobUpDown2 4.2s ease-in-out infinite',
          animationDelay: '0.9s',
          willChange: 'transform',
        }}
        className="absolute top-3 sm:top-10 xl:top-16 right-1 sm:right-4 xl:right-14 p-2 sm:p-3 xl:p-3.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#141926]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-md sm:shadow-lg shadow-[#D4A77F]/10 dark:shadow-black/30 text-[#D4A77F] opacity-80 sm:opacity-100 transition-colors"
      >
        <Wind className="w-3.5 h-3.5 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />
      </div>

      {/* 3. Mid-Left Luxury Champagne Sparkles */}
      <div
        style={{
          animation: 'floatBobUpDown3 3.6s ease-in-out infinite',
          animationDelay: '1.6s',
          willChange: 'transform',
        }}
        className="absolute top-44 sm:top-56 xl:top-64 left-1 sm:left-4 xl:left-16 p-2 sm:p-3 xl:p-3.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#141926]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-md sm:shadow-lg shadow-[#D4A77F]/10 dark:shadow-black/30 text-[#D4A77F] opacity-75 sm:opacity-100 transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />
      </div>

      {/* 4. Mid-Right Styling Feather */}
      <div
        style={{
          animation: 'floatBobUpDown4 4.4s ease-in-out infinite',
          animationDelay: '2.3s',
          willChange: 'transform',
        }}
        className="absolute top-40 sm:top-52 xl:top-60 right-1 sm:right-4 xl:right-16 p-2 sm:p-3 xl:p-3.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-[#141926]/90 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-md sm:shadow-lg shadow-[#D4A77F]/10 dark:shadow-black/30 text-[#D4A77F] opacity-75 sm:opacity-100 transition-colors"
      >
        <Feather className="w-3.5 h-3.5 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />
      </div>

      <style jsx>{`
        @keyframes floatBobUpDown1 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(6deg);
          }
        }
        @keyframes floatBobUpDown2 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-14px) rotate(-6deg);
          }
        }
        @keyframes floatBobUpDown3 {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.08);
          }
        }
        @keyframes floatBobUpDown4 {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-18px) rotate(8deg);
          }
        }

        @media (min-width: 640px) {
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
        }
      `}</style>
    </div>
  );
}
