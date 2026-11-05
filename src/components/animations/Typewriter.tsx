'use client';

import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TypewriterProps {
  firstLine: string;
  secondLine: string;
  onComplete?: () => void;
  speedMs?: number;
  loop?: boolean;
}

export default function Typewriter({
  firstLine,
  secondLine,
  onComplete,
  speedMs = 50,
  loop = true,
}: TypewriterProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayedCount, setDisplayedCount] = useState<number>(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedCount(secondLine.length);
      onComplete?.();
      return;
    }

    let isCancelled = false;
    let timerId: NodeJS.Timeout;

    let count = 0;
    let isDeleting = false;
    let hasTriggeredOnComplete = false;

    // Check if previously completed in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('salonpro_typewriter_done') === 'true') {
      hasTriggeredOnComplete = true;
      onComplete?.();
    }

    const tick = () => {
      if (isCancelled) return;

      if (!isDeleting) {
        // Typing forward
        count += 1;
        setDisplayedCount(count);

        if (count >= secondLine.length) {
          // Finished typing forward
          if (!hasTriggeredOnComplete) {
            hasTriggeredOnComplete = true;
            try {
              sessionStorage.setItem('salonpro_typewriter_done', 'true');
            } catch {}
            onComplete?.();
          }

          if (!loop) return;

          // Pause at full text for 2.4s so user can read it clearly
          isDeleting = true;
          timerId = setTimeout(tick, 2400);
          return;
        }

        timerId = setTimeout(tick, speedMs);
      } else {
        // Deleting backward
        count -= 1;
        setDisplayedCount(count);

        if (count <= 0) {
          // Finished deleting
          isDeleting = false;
          // Pause at blank for 500ms before re-typing
          timerId = setTimeout(tick, 500);
          return;
        }

        // Deleting speed is smooth and slightly faster than typing
        timerId = setTimeout(tick, Math.max(22, Math.floor(speedMs * 0.6)));
      }
    };

    // Initial short pause before first letter starts
    timerId = setTimeout(tick, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [secondLine, speedMs, loop, shouldReduceMotion, onComplete]);

  const displayedSecond = secondLine.slice(0, displayedCount);

  return (
    <div className="relative max-w-4xl mx-auto px-1 sm:px-2">
      <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#242126] dark:text-[#F5EFF5] tracking-tight leading-[1.25] sm:leading-[1.15]">
        {/* Static First Line - Always immediately visible without lag */}
        <span className="block mb-1 sm:mb-2">{firstLine}</span>

        {/* Dynamic Continuous Infinite Typewriter Second Line with Zero Layout Shift (CLS 0) */}
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
            <span className="inline-block w-[2.5px] sm:w-[3.5px] h-[0.85em] bg-[#4B263F] dark:bg-[#D6A0B4] ml-1 align-baseline animate-pulse" />
          </span>
        </span>
      </h1>
    </div>
  );
}
