'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TypewriterProps {
  firstLine: string;
  secondLine: string;
  onComplete?: () => void;
  speedMs?: number;
}

export default function Typewriter({
  firstLine,
  secondLine,
  onComplete,
  speedMs = 50,
}: TypewriterProps) {
  const shouldReduceMotion = useReducedMotion();
  const hasRunRef = useRef(false);

  // Initialize with full text if already typed in this session or reduced motion requested
  const [displayedCount, setDisplayedCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const alreadyDone = sessionStorage.getItem('salonpro_typewriter_done');
      if (alreadyDone === 'true' || shouldReduceMotion) {
        return secondLine.length;
      }
    }
    return 0;
  });

  const [isDone, setIsDone] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const alreadyDone = sessionStorage.getItem('salonpro_typewriter_done');
      if (alreadyDone === 'true' || shouldReduceMotion) {
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    // If already typed once in this session, trigger onComplete immediately and exit
    if (typeof window !== 'undefined' && sessionStorage.getItem('salonpro_typewriter_done') === 'true') {
      setIsDone(true);
      setDisplayedCount(secondLine.length);
      onComplete?.();
      return;
    }

    if (shouldReduceMotion) {
      setIsDone(true);
      setDisplayedCount(secondLine.length);
      onComplete?.();
      return;
    }

    if (hasRunRef.current) return;
    hasRunRef.current = true;

    let currentIndex = 0;
    let timerId: NodeJS.Timeout;

    const typeNextChar = () => {
      currentIndex += 1;
      setDisplayedCount(currentIndex);

      if (currentIndex >= secondLine.length) {
        setIsDone(true);
        try {
          sessionStorage.setItem('salonpro_typewriter_done', 'true');
        } catch {}
        onComplete?.();
        return;
      }

      timerId = setTimeout(typeNextChar, speedMs);
    };

    // Short initial delay before second line starts typing
    timerId = setTimeout(typeNextChar, 180);

    return () => clearTimeout(timerId);
  }, [secondLine, speedMs, shouldReduceMotion, onComplete]);

  const displayedSecond = secondLine.slice(0, displayedCount);

  return (
    <div className="relative max-w-4xl mx-auto px-1 sm:px-2">
      <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#242126] dark:text-[#F5EFF5] tracking-tight leading-[1.25] sm:leading-[1.15]">
        {/* Static First Line - Always immediately visible without typing lag */}
        <span className="block mb-1 sm:mb-2">{firstLine}</span>

        {/* Dynamic Typewriter Second Line with Zero Layout Shift (CLS 0) */}
        <span className="relative inline-block min-h-[1.2em]">
          {/* Invisible Clone reserving exact bounding box on all device sizes */}
          <span
            aria-hidden="true"
            className="opacity-0 select-none pointer-events-none"
          >
            {secondLine}
          </span>

          {/* Real-time Character-by-Character Typed Text */}
          <span className="absolute inset-0 left-0 top-0 bg-gradient-to-r from-[#4B263F] via-[#B77A91] to-[#C69A5D] dark:from-[#D6A0B4] dark:via-[#B77A91] dark:to-[#D4AD76] bg-clip-text text-transparent">
            {displayedSecond}
            {!isDone && (
              <span className="inline-block w-[2.5px] sm:w-[3.5px] h-[0.85em] bg-[#4B263F] dark:bg-[#D6A0B4] ml-1 align-baseline animate-pulse" />
            )}
          </span>
        </span>
      </h1>
    </div>
  );
}
