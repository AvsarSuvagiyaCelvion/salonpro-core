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
      <div className="w-16 h-8 rounded-full bg-slate-200 dark:bg-slate-800 p-1 opacity-60" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle Dark and Light theme"
      className="relative flex items-center justify-between w-15 h-8 p-1 rounded-full bg-slate-200 dark:bg-[#2a1630] border border-slate-300 dark:border-pink-500/40 cursor-pointer shadow-inner transition-colors duration-300 focus:outline-none"
    >
      {/* Sun Icon */}
      <Sun className={`w-3.5 h-3.5 ml-1 transition-opacity ${theme === 'light' ? 'text-amber-500 opacity-100' : 'text-slate-400 opacity-40'}`} />

      {/* Moon Icon */}
      <Moon className={`w-3.5 h-3.5 mr-1 transition-opacity ${theme === 'dark' ? 'text-pink-300 opacity-100' : 'text-slate-400 opacity-40'}`} />

      {/* Sliding Animated Thumb */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-1 w-6 h-6 rounded-full shadow-md flex items-center justify-center text-xs transition-colors ${
          theme === 'dark'
            ? 'right-1 bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white'
            : 'left-1 bg-white text-amber-500'
        }`}
      >
        {theme === 'dark' ? <Moon className="w-3 h-3 text-white" /> : <Sun className="w-3 h-3 text-amber-500" />}
      </motion.div>
    </button>
  );
}
