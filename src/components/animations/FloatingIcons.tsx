'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Scissors, Sparkles, Feather, Wind } from 'lucide-react';

export default function FloatingIcons() {
  const shouldReduceMotion = useReducedMotion();
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)');
    setIsDesktop(media.matches);

    if (!media.matches || shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 35;
      const y = (e.clientY - innerHeight / 2) / 35;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none -z-5">
      {/* 1. Top-Left Floating Scissors */}
      <motion.div
        animate={{
          y: [-8, 8, -8],
          rotate: [-6, 6, -6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          transform: isDesktop
            ? `translate(${mouseOffset.x * 1.2}px, ${mouseOffset.y * 1.2}px)`
            : undefined,
        }}
        className="absolute top-16 left-4 sm:left-14 p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-pink-200/80 shadow-lg shadow-pink-900/5 text-[#b3135b]"
      >
        <Scissors className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.div>

      {/* 2. Top-Right Floating Hair Dryer / Air Flow */}
      <motion.div
        animate={{
          y: [10, -10, 10],
          rotate: [8, -4, 8],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
        style={{
          transform: isDesktop
            ? `translate(${-mouseOffset.x * 1.5}px, ${-mouseOffset.y * 1.5}px)`
            : undefined,
        }}
        className="absolute top-20 right-4 sm:right-16 p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-purple-200/80 shadow-lg shadow-purple-900/5 text-purple-600"
      >
        <Wind className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.div>

      {/* 3. Mid-Left Luxury Mirror */}
      <motion.div
        animate={{
          y: [-12, 6, -12],
          rotate: [-4, 8, -4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        style={{
          transform: isDesktop
            ? `translate(${mouseOffset.x * 0.9}px, ${mouseOffset.y * 0.9}px)`
            : undefined,
        }}
        className="hidden md:flex absolute top-72 left-8 p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-amber-200/80 shadow-lg shadow-amber-900/5 text-amber-600"
      >
        <Sparkles className="w-5 h-5" />
      </motion.div>

      {/* 4. Mid-Right Styling Feather */}
      <motion.div
        animate={{
          y: [8, -12, 8],
          rotate: [5, -8, 5],
        }}
        transition={{
          duration: 7.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
        style={{
          transform: isDesktop
            ? `translate(${-mouseOffset.x * 1.1}px, ${-mouseOffset.y * 1.1}px)`
            : undefined,
        }}
        className="hidden md:flex absolute top-64 right-10 p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-rose-200/80 shadow-lg shadow-rose-900/5 text-rose-500"
      >
        <Feather className="w-5 h-5" />
      </motion.div>
    </div>
  );
}
