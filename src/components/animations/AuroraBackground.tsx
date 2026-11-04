'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function AuroraBackground() {
  const shouldReduceMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Only enable cursor spotlight on desktop (pointer: fine)
    const media = window.matchMedia('(pointer: fine)');
    setIsDesktop(media.matches);

    if (!media.matches || shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [shouldReduceMotion]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Aurora Gradient Blob 1: Pink */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: ['-20%', '20%', '-20%'],
                y: ['-10%', '15%', '-10%'],
                scale: [1, 1.15, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 left-1/4 w-[550px] sm:w-[700px] h-[450px] sm:h-[600px] bg-gradient-to-br from-pink-300/35 via-rose-200/25 to-transparent rounded-full blur-[110px]"
      />

      {/* Aurora Gradient Blob 2: Purple */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: ['20%', '-15%', '20%'],
                y: ['10%', '-15%', '10%'],
                scale: [1.1, 0.95, 1.1],
              }
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-10 right-1/6 w-[500px] sm:w-[650px] h-[450px] sm:h-[550px] bg-gradient-to-bl from-purple-300/30 via-indigo-200/20 to-transparent rounded-full blur-[120px]"
      />

      {/* Aurora Gradient Blob 3: Soft Gold */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: ['-10%', '15%', '-10%'],
                y: ['20%', '-10%', '20%'],
                scale: [0.95, 1.1, 0.95],
              }
        }
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-64 left-1/3 w-[450px] sm:w-[600px] h-[400px] bg-gradient-to-tr from-amber-200/25 via-yellow-100/15 to-transparent rounded-full blur-[130px]"
      />

      {/* Desktop Cursor Spotlight (Radial Gradient Follower) */}
      {isDesktop && !shouldReduceMotion && (
        <div
          style={{
            transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)`,
          }}
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-radial from-pink-400/12 via-purple-300/6 to-transparent rounded-full blur-[80px] transition-transform duration-75 ease-out"
        />
      )}
    </div>
  );
}
