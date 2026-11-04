'use client';

import React, { useEffect, useRef } from 'react';

export default function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only track cursor on desktop fine-pointer devices
    const isDesktop = window.matchMedia('(pointer: fine)').matches;
    if (!isDesktop) return;

    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    // Smooth lerp loop using requestAnimationFrame directly on DOM (0 React re-renders)
    const update = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `${currentX}px`);
        containerRef.current.style.setProperty('--mouse-y', `${currentY}px`);
      }

      rafId.current = requestAnimationFrame(update);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none transition-colors duration-500"
      style={
        {
          '--mouse-x': '-500px',
          '--mouse-y': '-500px',
        } as React.CSSProperties
      }
    >
      {/* Aurora Ambient Blobs with GPU hardware acceleration (will-change: transform) */}
      <div className="absolute inset-0 opacity-70 dark:opacity-40 transition-opacity duration-500">
        {/* Blob 1: Pink Luxury Radiance */}
        <div
          className="absolute -top-32 left-1/4 w-[500px] sm:w-[650px] h-[400px] sm:h-[500px] rounded-full bg-gradient-to-br from-pink-400/25 via-rose-300/15 to-transparent blur-[70px] dark:from-pink-600/30 dark:via-rose-500/15"
          style={{
            animation: 'floatBlob1 16s ease-in-out infinite alternate',
            willChange: 'transform',
          }}
        />

        {/* Blob 2: Deep Purple Studio Ambiance */}
        <div
          className="absolute top-20 right-1/6 w-[450px] sm:w-[550px] h-[380px] sm:h-[450px] rounded-full bg-gradient-to-bl from-purple-400/20 via-indigo-300/10 to-transparent blur-[75px] dark:from-purple-600/25 dark:via-indigo-500/15"
          style={{
            animation: 'floatBlob2 20s ease-in-out infinite alternate',
            willChange: 'transform',
          }}
        />

        {/* Blob 3: Warm Gold Accent */}
        <div
          className="absolute top-72 left-1/3 w-[400px] sm:w-[500px] h-[350px] rounded-full bg-gradient-to-tr from-amber-300/15 via-yellow-200/10 to-transparent blur-[80px] dark:from-amber-500/15 dark:via-rose-900/10"
          style={{
            animation: 'floatBlob3 22s ease-in-out infinite alternate',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Zero-Lag Hardware Accelerated Cursor Spotlight */}
      <div
        className="hidden md:block absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl opacity-35 dark:opacity-25 transition-opacity"
        style={{
          transform: 'translate3d(calc(var(--mouse-x) - 250px), calc(var(--mouse-y) - 250px), 0)',
          background: 'radial-gradient(circle, rgba(225, 29, 72, 0.22) 0%, rgba(147, 51, 234, 0.12) 50%, transparent 70%)',
          willChange: 'transform',
        }}
      />

      <style jsx>{`
        @keyframes floatBlob1 {
          0% {
            transform: translate3d(-5%, -5%, 0) scale(1);
          }
          100% {
            transform: translate3d(8%, 6%, 0) scale(1.08);
          }
        }
        @keyframes floatBlob2 {
          0% {
            transform: translate3d(6%, -6%, 0) scale(1.05);
          }
          100% {
            transform: translate3d(-6%, 8%, 0) scale(0.95);
          }
        }
        @keyframes floatBlob3 {
          0% {
            transform: translate3d(-4%, 6%, 0) scale(0.96);
          }
          100% {
            transform: translate3d(5%, -5%, 0) scale(1.06);
          }
        }
      `}</style>
    </div>
  );
}
