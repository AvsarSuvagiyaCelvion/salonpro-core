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
  openTime?: string;
  closeTime?: string;
}

export default function HourlyRushChart({ data, timeLabel, openTime, closeTime }: HourlyRushChartProps) {
  const [hoveredHour, setHoveredHour] = useState<HourlyData | null>(null);

  const hours = React.useMemo(() => {
    if (data && data.length > 0) return data;

    const startH = openTime ? parseInt(openTime.slice(0, 2), 10) : 10;
    const endH = closeTime ? parseInt(closeTime.slice(0, 2), 10) : 19;

    const generated: HourlyData[] = [];
    const countPatterns = [3, 5, 8, 4, 6, 9, 14, 16, 11, 7, 4, 2];

    for (let h = startH; h <= endH; h++) {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const countIndex = (h - startH) % countPatterns.length;
      generated.push({
        hour: `${displayHour} ${period}`,
        count: countPatterns[countIndex],
      });
    }

    return generated.length > 0 ? generated : [
      { hour: '10 AM', count: 4 },
      { hour: '12 PM', count: 8 },
      { hour: '2 PM', count: 6 },
      { hour: '4 PM', count: 12 },
      { hour: '6 PM', count: 9 },
    ];
  }, [data, openTime, closeTime]);
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

