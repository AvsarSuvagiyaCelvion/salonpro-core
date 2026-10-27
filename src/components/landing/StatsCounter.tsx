'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Zap, MessageSquare, TrendingUp } from 'lucide-react';

interface StatItem {
  id: string;
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  subtext: string;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
  icon: any;
}

const stats: StatItem[] = [
  {
    id: 'double-bookings',
    target: 0,
    suffix: '%',
    label: 'Double-Bookings',
    subtext: 'Guaranteed 0 Overlaps',
    colorClass: 'text-slate-900',
    bgLightClass: 'bg-slate-50',
    borderClass: 'border-slate-200/80',
    icon: ShieldCheck,
  },
  {
    id: 'pos-checkout',
    target: 10,
    suffix: ' Sec',
    label: 'GST POS Checkout',
    subtext: 'Instant UPI & WhatsApp',
    colorClass: 'text-[#b3135b]',
    bgLightClass: 'bg-pink-50/70',
    borderClass: 'border-pink-200/60',
    icon: Zap,
  },
  {
    id: 'whatsapp-confirmations',
    target: 100,
    suffix: '%',
    label: 'WhatsApp Confirmations',
    subtext: 'Auto Booking Alerts',
    colorClass: 'text-purple-600',
    bgLightClass: 'bg-purple-50/70',
    borderClass: 'border-purple-200/60',
    icon: MessageSquare,
  },
  {
    id: 'repeat-visits',
    target: 35,
    suffix: '%+',
    label: 'Repeat Visits with VIP Plans',
    subtext: 'Higher Client Retention',
    colorClass: 'text-emerald-600',
    bgLightClass: 'bg-emerald-50/70',
    borderClass: 'border-emerald-200/60',
    icon: TrendingUp,
  },
];

function CounterCard({ item }: { item: StatItem }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);

            if (item.target === 0) {
              setCount(0);
              return;
            }

            const duration = 1800; // 1.8 seconds animation
            const startTime = performance.now();

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);

              // Ease out quart: 1 - pow(1 - x, 4)
              const easeOut = 1 - Math.pow(1 - progress, 4);
              const currentVal = Math.floor(easeOut * item.target);

              setCount(currentVal);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCount(item.target);
              }
            };

            requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, item.target]);

  return (
    <div
      ref={cardRef}
      className={`group relative p-3 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm border ${item.borderClass} shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}
    >
      {/* Top micro badge */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${item.bgLightClass} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${item.colorClass}`} />
        </span>
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500/80 animate-ping" />
      </div>

      {/* Counter value */}
      <div className="my-0.5 sm:my-1">
        <div className={`text-2xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight ${item.colorClass} flex items-baseline justify-center sm:justify-start gap-0.5`}>
          <span>{item.prefix || ''}</span>
          <span className="tabular-nums">{count}</span>
          <span className="text-lg sm:text-2xl lg:text-3xl font-extrabold">{item.suffix || ''}</span>
        </div>
      </div>

      {/* Label & Description */}
      <div className="mt-1.5 sm:mt-2 text-center sm:text-left">
        <div className="text-[11px] sm:text-sm font-bold text-slate-900 group-hover:text-[#b3135b] transition-colors leading-snug">
          {item.label}
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 hidden xs:block font-medium">
          {item.subtext}
        </div>
      </div>
    </div>
  );
}

export default function StatsCounter() {
  return (
    <div className="mt-12 sm:mt-16 pt-8 border-t border-slate-200/80">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((item) => (
          <CounterCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
