'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 300px
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 12 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          aria-label="Scroll to top"
          title="Scroll to top"
          className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 dark:bg-[#141926]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2F3A] hover:border-[#D4A77F] dark:hover:border-[#D4A77F] text-[#1F2937] dark:text-[#FFFFFF] hover:text-[#D4A77F] dark:hover:text-[#D4A77F] shadow-lg shadow-black/10 dark:shadow-black/40 flex items-center justify-center group cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A77F]/30"
        >
          <ArrowUp className="w-5 h-5 text-[#D4A77F] transition-transform duration-200 group-hover:-translate-y-0.5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
