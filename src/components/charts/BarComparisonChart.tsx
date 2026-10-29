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
  color = '#b3135b',
  maxCustomValue,
  currencySymbol = '₹',
}: BarComparisonChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-neutral-400">
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
                <span className="w-5 h-5 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                  #{idx + 1}
                </span>
                <span className="font-extrabold text-neutral-800 truncate">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[10px] text-neutral-400 truncate hidden sm:inline">
                    · {item.sublabel}
                  </span>
                )}
              </div>

              <div className="font-mono text-xs font-black text-neutral-900 shrink-0">
                {item.formattedValue ||
                  `${currencySymbol}${item.value.toLocaleString('en-IN')}`}
              </div>
            </div>

            {/* Bar Track & Progress */}
            <div className="h-3.5 w-full bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200/50">
              <div
                style={{ width: `${pct}%`, backgroundColor: barColor }}
                className="h-full rounded-full transition-all duration-500 ease-out shadow-xs group-hover:brightness-110"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

