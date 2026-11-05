'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check saved theme or system preference
    const saved = localStorage.getItem('salonpro_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('salonpro_theme', next);
    } catch {}

    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return (
      <div className="w-14 h-7.5 rounded-full bg-[#E5E7EB] dark:bg-[#1C2230] p-1 opacity-60" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle Dark and Light theme"
      className="relative flex items-center justify-between w-14 h-7.5 p-1 rounded-full bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] cursor-pointer shadow-inner transition-colors duration-300 focus:outline-none"
    >
      {/* Sun Icon */}
      <Sun className={`w-3.5 h-3.5 ml-0.5 transition-opacity ${theme === 'light' ? 'text-[#D4A77F] opacity-100' : 'text-[#6B7280] opacity-40'}`} />

      {/* Moon Icon */}
      <Moon className={`w-3.5 h-3.5 mr-0.5 transition-opacity ${theme === 'dark' ? 'text-[#D4A77F] opacity-100' : 'text-[#A0A8B8] opacity-40'}`} />

      {/* Sliding Animated Thumb */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 w-6.5 h-6.5 rounded-full shadow-md flex items-center justify-center text-xs transition-colors ${
          theme === 'dark'
            ? 'right-0.5 bg-[#141926] text-[#D4A77F] border border-[#2A2F3A]'
            : 'left-0.5 bg-white text-[#D4A77F] border border-[#E5E7EB]'
        }`}
      >
        {theme === 'dark' ? <Moon className="w-3 h-3 text-[#D4A77F]" /> : <Sun className="w-3 h-3 text-[#D4A77F]" />}
      </motion.div>
    </button>
  );
}
