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
        className="absolute top-16 left-4 sm:left-14 p-3 rounded-2xl bg-white dark:bg-[#211B24] backdrop-blur-md border border-[#E8E1E5] dark:border-[#3A3040] shadow-md text-[#4B263F] dark:text-[#D6A0B4]"
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
        className="absolute top-20 right-4 sm:right-16 p-3 rounded-2xl bg-white dark:bg-[#211B24] backdrop-blur-md border border-[#E8E1E5] dark:border-[#3A3040] shadow-md text-[#B77A91] dark:text-[#B77A91]"
      >
        <Wind className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>

      {/* 3. Mid-Left Luxury Champagne Sparkles */}
      <div
        style={{
          animation: 'floatIcon3 9s ease-in-out infinite alternate',
          animationDelay: '1.4s',
          willChange: 'transform',
        }}
        className="hidden md:flex absolute top-72 left-8 p-3 rounded-2xl bg-white dark:bg-[#211B24] backdrop-blur-md border border-[#E8E1E5] dark:border-[#3A3040] shadow-md text-[#C69A5D] dark:text-[#D4AD76]"
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
        className="hidden md:flex absolute top-64 right-10 p-3 rounded-2xl bg-white dark:bg-[#211B24] backdrop-blur-md border border-[#E8E1E5] dark:border-[#3A3040] shadow-md text-[#B77A91] dark:text-[#D6A0B4]"
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
