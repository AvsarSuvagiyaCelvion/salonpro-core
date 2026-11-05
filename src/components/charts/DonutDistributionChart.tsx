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
  size = 140,
  thickness = 20,
}: DonutDistributionChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0 || data.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full border-4 border-dashed border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col items-center justify-center text-center p-4 mx-auto"
      >
        <span className="text-[11px] font-bold text-[#9CA3AF]">No data available</span>
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  return (
    <div className="flex flex-col items-center gap-4 justify-center w-full">
      {/* SVG Ring with bulletproof center rotation */}
      <div className="relative shrink-0 mx-auto" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Subtle Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-[#F3F4F6] dark:text-[#1C2230]"
            strokeWidth={thickness}
          />

          {/* Slices */}
          {data.map((item, idx) => {
            const fraction = item.value / total;
            const strokeDasharray = `${fraction * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedAngle;
            accumulatedAngle += fraction * circumference;
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? thickness + 4 : thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-base sm:text-lg font-black text-[#1F2937] dark:text-[#FFFFFF] font-mono leading-none">
            {centerValue ?? total}
          </span>
          <span className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] uppercase font-bold mt-1">
            {hoveredIdx !== null ? data[hoveredIdx].label : centerLabel}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-xs">
        {data.map((item, idx) => {
          const pct = Math.round((item.value / total) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-1.5 rounded-xl transition-all cursor-pointer ${
                isHovered ? 'bg-[#F3F4F6] dark:bg-[#1C2230] scale-102' : 'hover:bg-[#F3F4F6]/50 dark:hover:bg-[#1C2230]/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-[#1F2937] dark:text-[#FFFFFF] truncate">{item.label}</span>
              </div>
              <span className="font-mono text-[#6B7280] dark:text-[#A0A8B8] font-bold text-[11px] shrink-0">
                {item.value} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
