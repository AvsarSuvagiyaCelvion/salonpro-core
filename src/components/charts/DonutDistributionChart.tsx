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
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />

          {/* Slices group rotated around center (size/2, size/2) */}
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {data.map((slice, i) => {
              const percentage = slice.value / total;
              const isSingleItem = data.length === 1;
              const strokeDasharray = isSingleItem
                ? undefined
                : `${Math.max(1, percentage * circumference)} ${circumference}`;
              const strokeDashoffset = isSingleItem ? undefined : -accumulatedAngle * circumference;
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
          </g>
        </svg>

        {/* Center Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider truncate max-w-[85px]">
            {hoveredIdx !== null ? data[hoveredIdx].label : centerLabel}
          </span>
          <span className="text-lg font-black text-neutral-900 leading-tight">
            {hoveredIdx !== null
              ? `${Math.round((data[hoveredIdx].value / total) * 100)}%`
              : centerValue !== undefined
              ? centerValue
              : total}
          </span>
        </div>
      </div>

      {/* Legend - Clean stacked full width list */}
      <div className="space-y-1.5 w-full min-w-0">
        {data.map((slice, i) => {
          const pct = Math.round((slice.value / total) * 100);
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer gap-2 ${
                isHovered ? 'bg-slate-100/80 scale-101 font-bold' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-xs text-slate-700 truncate font-semibold" title={slice.label}>
                  {slice.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                <span className="font-bold text-slate-900">
                  {typeof slice.value === 'number' && slice.value > 1000
                    ? `₹${slice.value.toLocaleString('en-IN')}`
                    : slice.value}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold min-w-[32px] text-right">
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

