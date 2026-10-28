'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface BrandLoaderProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BrandLoader({
  message = 'Loading live salon data...',
  submessage = 'Connecting to real-time cloud database',
  size = 'md',
}: BrandLoaderProps) {
  const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  const boxSize = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';

  return (
    <div className="py-14 flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="relative mb-4">
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-3xl bg-pink-500/20 animate-ping opacity-75" />
        {/* Glow backdrop */}
        <div className={`${boxSize} rounded-3xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white flex items-center justify-center shadow-xl shadow-pink-900/20 ring-4 ring-pink-100`}>
          <Sparkles className={`${iconSize} animate-pulse`} />
        </div>
      </div>

      <h4 className="text-sm font-black text-[#2a1630] tracking-tight">{message}</h4>
      {submessage && (
        <p className="text-xs text-neutral-400 mt-1 max-w-xs">{submessage}</p>
      )}

      {/* Modern gradient loading bar */}
      <div className="w-36 h-1 bg-neutral-100 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-gradient-to-r from-[#b3135b] via-pink-400 to-[#b3135b] rounded-full animate-loading-bar" />
      </div>
    </div>
  );
}

