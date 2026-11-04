'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { Scissors, Sparkles, Feather, Wind } from 'lucide-react';

export default function FloatingIcons() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none -z-5">
      {/* 1. Top-Left Floating Scissors */}
      <div
        style={{
          animation: 'floatIcon1 7s ease-in-out infinite alternate',
          willChange: 'transform',
        }}
        className="absolute top-16 left-4 sm:left-14 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-pink-200/80 dark:border-pink-500/30 shadow-lg shadow-pink-900/5 text-[#b3135b] dark:text-pink-400"
      >
        <Scissors className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>

      {/* 2. Top-Right Floating Hair Dryer / Air Flow */}
      <div
        style={{
          animation: 'floatIcon2 8s ease-in-out infinite alternate',
          animationDelay: '0.8s',
          willChange: 'transform',
        }}
        className="absolute top-20 right-4 sm:right-16 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-purple-200/80 dark:border-purple-500/30 shadow-lg shadow-purple-900/5 text-purple-600 dark:text-purple-400"
      >
        <Wind className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>

      {/* 3. Mid-Left Luxury Sparkles */}
      <div
        style={{
          animation: 'floatIcon3 9s ease-in-out infinite alternate',
          animationDelay: '1.4s',
          willChange: 'transform',
        }}
        className="hidden md:flex absolute top-72 left-8 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-amber-200/80 dark:border-amber-500/30 shadow-lg shadow-amber-900/5 text-amber-600 dark:text-amber-400"
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
        className="hidden md:flex absolute top-64 right-10 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-rose-200/80 dark:border-rose-500/30 shadow-lg shadow-rose-900/5 text-rose-500 dark:text-rose-400"
      >
        <Feather className="w-5 h-5" />
      </div>

      <style jsx>{`
        @keyframes floatIcon1 {
          0% {
            transform: translate3d(0, -8px, 0) rotate(-6deg);
          }
          100% {
            transform: translate3d(0, 8px, 0) rotate(6deg);
          }
        }
        @keyframes floatIcon2 {
          0% {
            transform: translate3d(0, 10px, 0) rotate(6deg);
          }
          100% {
            transform: translate3d(0, -10px, 0) rotate(-4deg);
          }
        }
        @keyframes floatIcon3 {
          0% {
            transform: translate3d(0, -10px, 0) rotate(-4deg);
          }
          100% {
            transform: translate3d(0, 8px, 0) rotate(8deg);
          }
        }
        @keyframes floatIcon4 {
          0% {
            transform: translate3d(0, 8px, 0) rotate(5deg);
          }
          100% {
            transform: translate3d(0, -10px, 0) rotate(-6deg);
          }
        }
      `}</style>
    </div>
  );
}
