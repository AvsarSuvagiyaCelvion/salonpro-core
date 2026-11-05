'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageLoader() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show loader once per browser session
    const hasShown = sessionStorage.getItem('salonpro_loader_shown');
    if (hasShown) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    try {
      sessionStorage.setItem('salonpro_loader_shown', 'true');
    } catch {}

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] bg-[#080B12] flex flex-col items-center justify-center pointer-events-none select-none"
        >
          <div className="relative flex flex-col items-center">
            {/* GPU Hardware-Accelerated Snappy Scissors Cut in Champagne Gold */}
            <div
              className="w-16 h-16 rounded-2xl bg-[#10141F] border border-[#2A2F3A] text-[#D4A77F] flex items-center justify-center text-3xl font-black shadow-2xl shadow-black/50 mb-3"
              style={{
                willChange: 'transform, opacity',
                animation: 'snipAndPulse 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              ✂
            </div>

            {/* Logo Text Reveal */}
            <div className="text-center">
              <h2 className="text-xl font-black text-white tracking-tight">SalonPro</h2>
              <p className="text-[10px] text-[#D4A77F] font-semibold uppercase tracking-widest mt-0.5">
                Modern Salon Operating System
              </p>
            </div>

            {/* Snipping Line */}
            <div
              className="h-[2px] bg-gradient-to-r from-transparent via-[#D4A77F] to-transparent mt-3 rounded-full"
              style={{
                width: '120px',
                animation: 'expandLine 0.6s ease-out forwards',
              }}
            />
          </div>

          <style jsx>{`
            @keyframes snipAndPulse {
              0% {
                transform: translate3d(0, 0, 0) scale(0.8) rotate(-15deg);
                opacity: 0.5;
              }
              50% {
                transform: translate3d(0, 0, 0) scale(1.08) rotate(10deg);
                opacity: 1;
              }
              100% {
                transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
                opacity: 1;
              }
            }
            @keyframes expandLine {
              0% {
                width: 0px;
                opacity: 0;
              }
              100% {
                width: 140px;
                opacity: 1;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
