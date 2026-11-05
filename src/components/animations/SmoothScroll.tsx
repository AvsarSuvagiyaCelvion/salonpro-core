'use client';

import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <>
      {/* Ultra-thin gradient scroll progress bar at top */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D4A77F] via-[#B8905F] to-[#D4A77F] z-[9999] origin-left pointer-events-none shadow-sm shadow-[#D4A77F]/30"
      />
      {children}
    </>
  );
}
