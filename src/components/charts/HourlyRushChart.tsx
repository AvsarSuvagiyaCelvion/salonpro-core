'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface HourlyData {
  hour: string; // '10 AM', '11 AM', ...
  count: number;
}

interface HourlyRushChartProps {
  data?: HourlyData[];
  timeLabel?: string;
}

export default function HourlyRushChart({ data, timeLabel }: HourlyRushChartProps) {
  const [hoveredHour, setHoveredHour] = useState<HourlyData | null>(null);

  // Standard business hours 10:00 - 19:00
  const defaultHours: HourlyData[] = [
    { hour: '10 AM', count: 3 },
    { hour: '11 AM', count: 6 },
    { hour: '12 PM', count: 8 },
    { hour: '1 PM', count: 4 },
    { hour: '2 PM', count: 5 },
    { hour: '3 PM', count: 7 },
    { hour: '4 PM', count: 11 },
    { hour: '5 PM', count: 14 },
    { hour: '6 PM', count: 16 },
    { hour: '7 PM', count: 9 },
  ];

  const hours = data && data.length > 0 ? data : defaultHours;
  const maxCount = Math.max(...hours.map((h) => h.count), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span className="flex items-center gap-1.5 font-bold text-neutral-700">
          <Clock className="w-3.5 h-3.5 text-pink-600" />
          <span>Walk-in & Booking Density ({timeLabel || 'Business Hours'})</span>
        </span>
        {hoveredHour && (
          <span className="font-extrabold text-[#b3135b] animate-fade-in">
            {hoveredHour.hour}: {hoveredHour.count} Clients Peak
          </span>
        )}
      </div>

      <div className="h-28 w-full flex items-end gap-1.5 sm:gap-2.5 pt-4 px-1 border-b border-neutral-100">
        {hours.map((item, idx) => {
          const heightPct = Math.max(12, Math.round((item.count / maxCount) * 100));
          const isPeak = item.count >= maxCount * 0.75;
          const isHovered = hoveredHour?.hour === item.hour;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredHour(item)}
              onMouseLeave={() => setHoveredHour(null)}
              className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
            >
              {/* Tooltip */}
              <div
                className={`absolute -top-7 px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-bold pointer-events-none transition-all ${
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                {item.count}
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  isPeak
                    ? 'bg-gradient-to-t from-pink-600 to-[#b3135b] shadow-xs'
                    : 'bg-neutral-200 group-hover:bg-neutral-300'
                } ${isHovered ? 'brightness-110 scale-105' : ''}`}
              />
            </div>
          );
        })}
      </div>

      {/* X Labels */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 px-1 pt-1 text-[8px] sm:text-[10px] font-bold text-neutral-400 overflow-hidden">
        {hours.map((h, i) => (
          <span key={i} className="flex-1 text-center truncate">
            {h.hour.replace(' ', '')}
          </span>
        ))}
      </div>
    </div>
  );
}

