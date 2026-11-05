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
        <div className="absolute inset-0 rounded-3xl bg-[#D4A77F]/20 animate-ping opacity-75" />
        {/* Glow backdrop */}
        <div className={`${boxSize} rounded-3xl bg-[#D4A77F] text-[#080B12] flex items-center justify-center shadow-xl shadow-[#D4A77F]/20 ring-4 ring-[#D4A77F]/20`}>
          <Sparkles className={`${iconSize} animate-pulse`} />
        </div>
      </div>

      <h4 className="text-sm font-black text-[#1F2937] dark:text-white tracking-tight">{message}</h4>
      {submessage && (
        <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1 max-w-xs">{submessage}</p>
      )}

      {/* Modern gradient loading bar */}
      <div className="w-36 h-1 bg-[#E5E7EB] dark:bg-[#2A2F3A] rounded-full overflow-hidden mt-4">
        <div className="h-full bg-gradient-to-r from-[#D4A77F] via-[#B8905F] to-[#D4A77F] rounded-full animate-loading-bar" />
      </div>
    </div>
  );
}
