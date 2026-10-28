'use client';

import React, { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface AreaTrendChartProps {
  data: DataPoint[];
  color?: string;
  gradientId?: string;
  currencySymbol?: string;
  height?: number;
  showLabels?: boolean;
}

export default function AreaTrendChart({
  data,
  color = '#b3135b',
  gradientId = 'trendGradient',
  currencySymbol = '₹',
  height = 200,
  showLabels = true,
}: AreaTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center text-xs text-neutral-400 bg-neutral-50/50 rounded-2xl border border-neutral-100"
      >
        No trend records available for this period
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 100);
  const paddingX = 40;
  const paddingY = 24;
  const svgWidth = 800;
  const svgHeight = height;

  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * innerWidth;
    const y = svgHeight - paddingY - (d.value / maxValue) * innerHeight;
    return { x, y, ...d };
  });

  // Construct SVG Area & Line Path using smooth bezier curves
  const linePath = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative w-full">
      {/* Active Hover Floating Tooltip */}
      {activePoint && (
        <div
          className="absolute -top-3 z-20 pointer-events-none transform -translate-x-1/2 px-3 py-1.5 rounded-xl bg-neutral-900 text-white shadow-xl text-xs font-bold transition-all duration-150 animate-fade-in flex items-center gap-1.5 border border-neutral-700"
          style={{ left: `${(activePoint.x / svgWidth) * 100}%` }}
        >
          <span className="text-pink-400">{activePoint.label}:</span>
          <span>
            {currencySymbol}
            {activePoint.value.toLocaleString('en-IN')}
          </span>
        </div>
      )}

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="80%" stopColor={color} stopOpacity="0.05" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={svgWidth - paddingX}
            y2={paddingY}
            stroke="#f1f5f9"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={paddingY + innerHeight / 2}
            x2={svgWidth - paddingX}
            y2={paddingY + innerHeight / 2}
            stroke="#f1f5f9"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={svgHeight - paddingY}
            x2={svgWidth - paddingX}
            y2={svgHeight - paddingY}
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Filled Area */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Smooth Trend Curve */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Interactive Data Nodes */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Touch / Hover Target invisible hit area */}
                <rect
                  x={pt.x - 20}
                  y={0}
                  width="40"
                  height={svgHeight}
                  fill="transparent"
                />

                {/* Vertical Guide on hover */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={svgHeight - paddingY}
                    stroke={color}
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                )}

                {/* Node Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 4}
                  fill={isHovered ? color : '#ffffff'}
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2.5}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* X-Axis Labels */}
      {showLabels && (
        <div className="flex justify-between items-center px-4 pt-2 text-[10px] sm:text-xs font-semibold text-neutral-400">
          {data.map((d, i) => (
            <span
              key={i}
              className={`transition-colors truncate max-w-[65px] text-center ${
                hoveredIdx === i ? 'text-neutral-900 font-extrabold' : ''
              }`}
            >
              {d.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
