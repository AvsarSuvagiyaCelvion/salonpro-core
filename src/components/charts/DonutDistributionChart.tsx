'use client';

import React, { useState } from 'react';

export interface SliceData {
  label: string;
  value: number;
  color: string;
  sublabel?: string;
}

interface DonutDistributionChartProps {
  data: SliceData[];
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
  thickness?: number;
}

export default function DonutDistributionChart({
  data,
  centerLabel = 'Total',
  centerValue,
  size = 180,
  thickness = 24,
}: DonutDistributionChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0 || data.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full border-4 border-dashed border-neutral-200 flex flex-col items-center justify-center text-center p-4 mx-auto"
      >
        <span className="text-[11px] font-bold text-neutral-400">No data available</span>
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      {/* SVG Ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
          {data.map((slice, i) => {
            const percentage = slice.value / total;
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedAngle * circumference;
            accumulatedAngle += percentage;
            const isHovered = hoveredIdx === i;

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? thickness + 4 : thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            {hoveredIdx !== null ? data[hoveredIdx].label : centerLabel}
          </span>
          <span className="text-xl font-black text-neutral-900 leading-tight">
            {hoveredIdx !== null
              ? `${Math.round((data[hoveredIdx].value / total) * 100)}%`
              : centerValue !== undefined
              ? centerValue
              : total}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 flex-1 w-full max-w-xs">
        {data.map((slice, i) => {
          const pct = Math.round((slice.value / total) * 100);
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                isHovered ? 'bg-neutral-100/80 scale-102 font-bold' : 'hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-xs text-neutral-700 truncate">{slice.label}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                <span className="font-bold text-neutral-900">
                  {typeof slice.value === 'number' && slice.value > 1000
                    ? `₹${slice.value.toLocaleString('en-IN')}`
                    : slice.value}
                </span>
                <span className="text-[10px] text-neutral-400 font-semibold w-8 text-right">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

