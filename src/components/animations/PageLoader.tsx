'use client';

import React, { useEffect, useState } from 'react';

interface PageLoaderProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export default function PageLoader({
  onComplete,
  minDurationMs = 1200,
}: PageLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Run the branded introduction for minDurationMs, then trigger smooth fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      onComplete?.();

      // Completely remove loader DOM after fade transition finishes (450ms)
      const removeTimer = setTimeout(() => {
        setRemoved(true);
      }, 450);

      return () => clearTimeout(removeTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onComplete]);

  if (removed) return null;

  return (
    <div
      aria-hidden={fadeOut}
      className={`fixed inset-0 z-[999999] bg-[#080B12] flex flex-col items-center justify-center select-none pointer-events-none transition-opacity duration-450 ease-out ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        willChange: 'opacity',
      }}
    >
      {/* Subtle Ambient Radial Glow (0 blur filter overhead for silky 60fps) */}
      <div
        className="absolute w-[360px] h-[360px] rounded-full pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(212, 167, 127, 0.28) 0%, rgba(16, 20, 31, 0) 70%)',
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* Outer Champagne Rotating Orbit Ring */}
        <div className="relative mb-5 flex items-center justify-center">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border border-[#D4A77F]/30"
            style={{
              animation: 'orbitSpin 3s linear infinite',
              willChange: 'transform',
            }}
          />

          {/* Centered Brand Text Box */}
          <div className="absolute inset-0 m-auto w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#10141F] border border-[#D4A77F]/60 flex items-center justify-center shadow-2xl shadow-black/80 ring-4 ring-[#D4A77F]/15">
            <span className="text-xl sm:text-2xl text-[#D4A77F] font-black select-none">
              SD
            </span>
          </div>
        </div>

        {/* Brand Title */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>Studio</span>
            <span className="text-[#D4A77F]">Desk</span>
          </h2>
          <p className="text-[10px] text-[#A0A8B8] font-bold uppercase tracking-[0.22em] mt-1">
            Modern Salon &amp; Studio Operating System
          </p>
        </div>

        {/* Elegant Gold Progress Line */}
        <div className="w-40 sm:w-48 h-[3px] bg-[#1C2230] rounded-full overflow-hidden mt-5 relative">
          <div
            className="h-full bg-gradient-to-r from-[#D4A77F] via-[#F3F4F6] to-[#D4A77F] rounded-full"
            style={{
              animation: `loaderProgress ${minDurationMs}ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
              willChange: 'width',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes orbitSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes smoothScissorsSpin {
          0% {
            transform: rotate(0deg) scale(0.95);
          }
          50% {
            transform: rotate(180deg) scale(1.08);
          }
          100% {
            transform: rotate(360deg) scale(0.95);
          }
        }
        @keyframes loaderProgress {
          0% {
            width: 0%;
          }
          40% {
            width: 60%;
          }
          85% {
            width: 90%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
