'use client';

import React, { useState } from 'react';

export interface BarItem {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  formattedValue?: string;
}

interface BarComparisonChartProps {
  items: BarItem[];
  color?: string;
  maxCustomValue?: number;
  currencySymbol?: string;
}

export default function BarComparisonChart({
  items,
  color = '#D4A77F',
  maxCustomValue,
  currencySymbol = '₹',
}: BarComparisonChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#9CA3AF]">
        No ranking data available
      </div>
    );
  }

  const highest = maxCustomValue || Math.max(...items.map((it) => it.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const pct = Math.min(100, Math.max(8, Math.round((item.value / highest) * 100)));
        const isHovered = hoveredId === item.id;
        const barColor = item.color || color;

        return (
          <div
            key={item.id || idx}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-5 h-5 rounded-lg bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] flex items-center justify-center font-bold text-[10px] shrink-0">
                  #{idx + 1}
                </span>
                <span className="font-extrabold text-[#1F2937] dark:text-[#FFFFFF] truncate">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] truncate hidden sm:inline">
                    · {item.sublabel}
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-[#1F2937] dark:text-[#FFFFFF] text-xs shrink-0">
                {item.formattedValue || `${currencySymbol}${item.value.toLocaleString('en-IN')}`}
              </span>
            </div>

            {/* Horizontal Track & Animated Fill Bar */}
            <div className="w-full h-2 rounded-full bg-[#F3F4F6] dark:bg-[#1C2230] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: barColor,
                  filter: isHovered ? 'brightness(1.15)' : 'none',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
