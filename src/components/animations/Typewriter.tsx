'use client';

import React, { useState, useEffect } from 'react';
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
  speedMs = 38,
}: TypewriterProps) {
  const shouldReduceMotion = useReducedMotion();
  const fullText = `${firstLine}\n${secondLine}`;
  const [displayedCount, setDisplayedCount] = useState(shouldReduceMotion ? fullText.length : 0);
  const [isDone, setIsDone] = useState(shouldReduceMotion);

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete?.();
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex += 1;
      setDisplayedCount(currentIndex);

      if (currentIndex >= fullText.length) {
        clearInterval(interval);
        setIsDone(true);
        onComplete?.();
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [fullText, speedMs, shouldReduceMotion, onComplete]);

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
        <span className="bg-gradient-to-r from-[#b3135b] via-[#d62475] to-purple-600 bg-clip-text text-transparent">
          {secondLine}
        </span>
      </h1>

      {/* Actual Live Animated Typewriter Element */}
      <h1 className="absolute inset-0 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.22] sm:leading-[1.15] break-normal">
        <span>{displayedFirst}</span>
        {displayedCount <= firstLine.length && (
          <span className="inline-block w-[3px] h-[0.85em] bg-[#b3135b] ml-1 align-baseline animate-pulse" />
        )}

        {displayedCount > firstLine.length && (
          <>
            <br className="hidden sm:block" />{' '}
            <span className="bg-gradient-to-r from-[#b3135b] via-[#d62475] to-purple-600 bg-clip-text text-transparent">
              {displayedSecond}
            </span>
            <span
              className={`inline-block w-[3px] h-[0.85em] bg-[#b3135b] ml-1 align-baseline ${
                isDone ? 'animate-ping' : 'animate-pulse'
              }`}
            />
          </>
        )}
      </h1>
    </div>
  );
}
