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
  const fullText = `${firstLine}\n${secondLine}`;
  const hasRunRef = useRef(false);

  // Initialize with full text if already typed in this session or reduced motion requested
  const [displayedCount, setDisplayedCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const alreadyDone = sessionStorage.getItem('salonpro_typewriter_done');
      if (alreadyDone === 'true' || shouldReduceMotion) {
        return fullText.length;
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
      setDisplayedCount(fullText.length);
      onComplete?.();
      return;
    }

    if (shouldReduceMotion) {
      setIsDone(true);
      setDisplayedCount(fullText.length);
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

      if (currentIndex >= fullText.length) {
        setIsDone(true);
        try {
          sessionStorage.setItem('salonpro_typewriter_done', 'true');
        } catch {}
        onComplete?.();
        return;
      }

      // Add a natural brief pause (150ms) between the first line and second line
      const delay = currentIndex === firstLine.length ? 150 : speedMs;
      timerId = setTimeout(typeNextChar, delay);
    };

    timerId = setTimeout(typeNextChar, 100);

    return () => clearTimeout(timerId);
  }, [fullText, firstLine.length, speedMs, shouldReduceMotion, onComplete]);

  // Split currently displayed text across the two lines
  const firstLineCount = Math.min(displayedCount, firstLine.length);
  const displayedFirst = firstLine.slice(0, firstLineCount);

  // If first line done, remaining chars go to second line (+1 for newline separator)
  const secondLineChars = Math.max(0, displayedCount - firstLine.length - 1);
  const displayedSecond = secondLine.slice(0, secondLineChars);

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Invisible Clone to strictly reserve height and prevent layout shift (CLS 0) */}
      <h1
        aria-hidden="true"
        className="opacity-0 pointer-events-none select-none text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.22] sm:leading-[1.15] break-normal"
      >
        {firstLine} <br className="hidden sm:block" />
        <span className="bg-gradient-to-r from-[#4B263F] via-[#B77A91] to-[#C69A5D] dark:from-[#D6A0B4] dark:via-[#B77A91] dark:to-[#D4AD76] bg-clip-text text-transparent">
          {secondLine}
        </span>
      </h1>

      {/* Actual Live Animated Typewriter Element */}
      <h1 className="absolute inset-0 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#242126] dark:text-[#F5EFF5] tracking-tight leading-[1.22] sm:leading-[1.15] break-normal">
        <span>{displayedFirst}</span>
        {displayedCount <= firstLine.length && (
          <span className="inline-block w-[3px] h-[0.85em] bg-[#4B263F] dark:bg-[#D6A0B4] ml-1 align-baseline animate-pulse" />
        )}

        {displayedCount > firstLine.length && (
          <>
            <br className="hidden sm:block" />{' '}
            <span className="bg-gradient-to-r from-[#4B263F] via-[#B77A91] to-[#C69A5D] dark:from-[#D6A0B4] dark:via-[#B77A91] dark:to-[#D4AD76] bg-clip-text text-transparent">
              {displayedSecond}
            </span>
            <span
              className={`inline-block w-[3px] h-[0.85em] bg-[#4B263F] dark:bg-[#D6A0B4] ml-1 align-baseline ${
                isDone ? 'hidden' : 'animate-pulse'
              }`}
            />
          </>
        )}
      </h1>
    </div>
  );
}
