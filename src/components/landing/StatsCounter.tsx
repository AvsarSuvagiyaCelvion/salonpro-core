'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Zap, MessageSquare, Clock } from 'lucide-react';

interface StatItem {
  id: string;
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  subtext: string;
  icon: any;
}

const stats: StatItem[] = [
  {
    id: 'double-bookings',
    target: 0,
    suffix: '%',
    label: 'Double-Booking Rate',
    subtext: 'Conflict-free slot protection',
    icon: ShieldCheck,
  },
  {
    id: 'pos-checkout',
    target: 10,
    suffix: ' Sec',
    label: 'GST POS Checkout',
    subtext: 'Instant itemized billing with UPI',
    icon: Zap,
  },
  {
    id: 'whatsapp-confirmations',
    target: 100,
    suffix: '%',
    label: 'WhatsApp Delivery',
    subtext: 'Instant booking & digital bill alerts',
    icon: MessageSquare,
  },
  {
    id: 'online-booking',
    target: 24,
    suffix: '/7',
    label: 'Online Self-Booking',
    subtext: 'Accept clients even when closed',
    icon: Clock,
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
      className="group relative p-3 xs:p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs hover:border-[#D4A77F]/60 transition-all duration-300 flex flex-col justify-between"
    >
      {/* Top micro badge */}
      <div className="flex items-center justify-between mb-1.5 sm:mb-3">
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#8C5E2E] dark:text-[#D4A77F] flex items-center justify-center transition-transform group-hover:scale-110">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8C5E2E] dark:text-[#D4A77F]" />
        </span>
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
      </div>

      {/* Counter value */}
      <div className="my-0.5 sm:my-1">
        <div className="text-xl xs:text-2xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-[#1F2937] dark:text-[#FFFFFF] flex items-baseline justify-center sm:justify-start gap-0.5">
          <span>{item.prefix || ''}</span>
          <span className="tabular-nums">{count}</span>
          <span className="text-base sm:text-2xl lg:text-3xl font-extrabold text-[#8C5E2E] dark:text-[#D4A77F]">{item.suffix || ''}</span>
        </div>
      </div>

      {/* Label & Description */}
      <div className="mt-1.5 sm:mt-2 text-center sm:text-left">
        <div className="text-[11px] sm:text-sm font-bold text-[#1F2937] dark:text-[#FFFFFF] group-hover:text-[#D4A77F] transition-colors leading-snug">
          {item.label}
        </div>
        <div className="text-[10px] sm:text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-0.5 hidden xs:block font-medium">
          {item.subtext}
        </div>
      </div>
    </div>
  );
}

export default function StatsCounter() {
  return (
    <div className="mt-12 sm:mt-16 pt-8 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((item) => (
          <CounterCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
