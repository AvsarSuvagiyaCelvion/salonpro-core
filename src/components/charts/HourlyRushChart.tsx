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
      <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#A0A8B8]">
        <span className="flex items-center gap-1.5 font-bold text-[#1F2937] dark:text-[#FFFFFF]">
          <Clock className="w-3.5 h-3.5 text-[#D4A77F]" />
          <span>Walk-in & Booking Density ({timeLabel || 'Business Hours'})</span>
        </span>
        {hoveredHour && (
          <span className="font-extrabold text-[#D4A77F] animate-fade-in">
            {hoveredHour.hour}: {hoveredHour.count} Clients Peak
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5 items-end h-28 pt-4 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
        {hours.map((h, i) => {
          const heightPct = Math.min(100, Math.max(12, Math.round((h.count / maxCount) * 100)));
          const isRush = h.count >= maxCount * 0.75;
          const isHovered = hoveredHour?.hour === h.hour;

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredHour(h)}
              onMouseLeave={() => setHoveredHour(null)}
              className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
            >
              <div className="w-full flex justify-center items-end h-full">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[20px] rounded-t-lg transition-all duration-300 ${
                    isHovered
                      ? 'bg-[#B8905F] scale-x-110 shadow-md'
                      : isRush
                      ? 'bg-[#D4A77F]'
                      : 'bg-[#D4A77F]/40 hover:bg-[#D4A77F]/60'
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-mono leading-none truncate max-w-[28px] ${
                  isHovered ? 'text-[#D4A77F] font-bold' : 'text-[#9CA3AF]'
                }`}
              >
                {h.hour.replace(' ', '')}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-[#6B7280] dark:text-[#A0A8B8] pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D4A77F]" />
          <span>Peak Salon Rush Hours</span>
        </span>
        <span>Automatic staff roster balancing</span>
      </div>
    </div>
  );
}
