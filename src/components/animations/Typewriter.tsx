'use client';

import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TypewriterProps {
  firstLine?: string;
  secondLine?: string;
  words?: string[];
  onComplete?: () => void;
  speedMs?: number;
  loop?: boolean;
}

const DEFAULT_WORDS = [
  'Paper Registers',
  'Double-Bookings',
  'Missed Appointments',
  'No-Show Clients',
];

export default function Typewriter({
  firstLine = 'Stop Losing Revenue to',
  secondLine,
  words = DEFAULT_WORDS,
  onComplete,
  speedMs = 45,
  loop = true,
}: TypewriterProps) {
  const activeWords = words && words.length > 0 ? words : [secondLine || 'Double-Bookings'];
  const shouldReduceMotion = useReducedMotion();

  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [displayedCount, setDisplayedCount] = useState<number>(0);

  // Find longest word to reserve exact CLS box
  const longestWord = activeWords.reduce((a, b) => (a.length > b.length ? a : b), '');

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedCount(activeWords[0].length);
      onComplete?.();
      return;
    }

    let isCancelled = false;
    let timerId: NodeJS.Timeout;

    let wordIdx = 0;
    let count = 0;
    let isDeleting = false;
    let hasTriggeredOnComplete = false;

    // Check if previously completed in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('studiodesk_typewriter_done') === 'true') {
      hasTriggeredOnComplete = true;
      onComplete?.();
    }

    const tick = () => {
      if (isCancelled) return;
      const targetWord = activeWords[wordIdx];

      if (!isDeleting) {
        // Typing forward
        count += 1;
        setDisplayedCount(count);

        if (count >= targetWord.length) {
          if (!hasTriggeredOnComplete) {
            hasTriggeredOnComplete = true;
            try {
              sessionStorage.setItem('studiodesk_typewriter_done', 'true');
            } catch {}
            onComplete?.();
          }

          if (!loop && wordIdx === activeWords.length - 1) return;

          // Pause at full word for 2.2s so user can comfortably read it
          isDeleting = true;
          timerId = setTimeout(tick, 2200);
          return;
        }

        timerId = setTimeout(tick, speedMs);
      } else {
        // Deleting backward
        count -= 1;
        setDisplayedCount(count);

        if (count <= 0) {
          isDeleting = false;
          wordIdx = (wordIdx + 1) % activeWords.length;
          setCurrentWordIdx(wordIdx);
          // Pause slightly before typing next word
          timerId = setTimeout(tick, 350);
          return;
        }

        // Fast deletion for snappy feel
        timerId = setTimeout(tick, Math.max(20, Math.floor(speedMs * 0.5)));
      }
    };

    timerId = setTimeout(tick, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [activeWords, speedMs, loop, shouldReduceMotion, onComplete]);

  const currentWord = activeWords[currentWordIdx] || '';
  const displayedWord = currentWord.slice(0, displayedCount);

  return (
    <div className="relative max-w-5xl mx-auto px-2 sm:px-4">
      <h1 className="landing-h1 font-heading font-semibold text-[#1F2937] dark:text-[#FFFFFF] tracking-tight sm:tracking-[-0.015em] leading-[1.15] sm:leading-[1.12] text-[clamp(1.75rem,4.5vw,3.75rem)]">
        {/* Static First Line - with exactly ONE gold word in Playfair italic 500 */}
        <span className="block mb-2 sm:mb-3">
          Stop Losing{' '}
          <span className="hero-italic-gold text-[#D4A77F] font-heading font-medium italic">
            Revenue
          </span>{' '}
          to
        </span>

        {/* Dynamic Continuous Infinite Typewriter Second Line with Zero Layout Shift (CLS 0) */}
        <span className="relative inline-block whitespace-nowrap min-h-[1.25em]">
          {/* Invisible Clone reserving exact bounding box for the longest word */}
          <span
            aria-hidden="true"
            className="opacity-0 select-none pointer-events-none not-italic invisible"
          >
            {longestWord}
          </span>

          {/* Real-time Character-by-Character Typed Text with Champagne Gold Gradient */}
          <span className="absolute inset-0 left-0 top-0 flex items-center justify-center bg-gradient-to-r from-[#D4A77F] via-[#E8C59A] to-[#D4A77F] bg-clip-text text-transparent not-italic whitespace-nowrap">
            {displayedWord}
            <span className="inline-block w-[2.5px] sm:w-[3.5px] h-[0.85em] bg-[#D4A77F] ml-1.5 align-baseline animate-pulse not-italic" />
          </span>
        </span>
      </h1>
    </div>
  );
}
