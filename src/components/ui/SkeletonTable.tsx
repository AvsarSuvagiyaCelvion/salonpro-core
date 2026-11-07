'use client';

import React from 'react';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export default function SkeletonTable({ rows = 5, columns = 5 }: SkeletonTableProps) {
  return (
    <div className="w-full bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200/80 dark:border-[#2A2F3A] shadow-xs overflow-hidden animate-pulse">
      {/* Table Header Skeleton */}
      <div className="bg-neutral-50/80 dark:bg-[#10141F] px-6 py-4 border-b border-neutral-100 dark:border-[#2A2F3A] flex items-center justify-between gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 bg-neutral-200/70 dark:bg-[#1C2230] rounded-md"
            style={{ width: `${Math.max(12, 100 / columns - 5)}%` }}
          />
        ))}
      </div>

      {/* Rows Skeleton */}
      <div className="divide-y divide-neutral-100 dark:divide-[#2A2F3A] p-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-1/4">
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-[#1C2230] shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3 bg-neutral-200 dark:bg-[#1C2230] rounded-md w-3/4" />
                <div className="h-2 bg-neutral-100 dark:bg-[#1A202C] rounded-md w-1/2" />
              </div>
            </div>

            {Array.from({ length: columns - 1 }).map((_, c) => (
              <div
                key={c}
                className="h-3 bg-neutral-200/60 dark:bg-[#1C2230] rounded-md"
                style={{ width: `${Math.max(10, 80 / (columns - 1))}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

