'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Automatically dismiss after 900ms
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="relative flex flex-col items-center">
            {/* Animated Scissors Icon */}
            <motion.div
              initial={{ scale: 0.8, rotate: -20 }}
              animate={{
                scale: [0.8, 1.1, 1],
                rotate: [-20, 15, 0],
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white flex items-center justify-center text-3xl font-black shadow-2xl shadow-pink-600/40 mb-3"
            >
              ✂
            </motion.div>

            {/* Logo Text Reveal */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-center"
            >
              <h2 className="text-xl font-black text-white tracking-tight">SalonPro</h2>
              <p className="text-[10px] text-pink-400 font-semibold uppercase tracking-widest mt-0.5">
                Operating System for Salons
              </p>
            </motion.div>

            {/* Snipping Line Animation */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
              className="h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent mt-3 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
