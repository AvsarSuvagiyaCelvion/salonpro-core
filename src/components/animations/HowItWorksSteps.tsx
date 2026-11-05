'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

interface StepData {
  number: number;
  title: string;
  urlPath: string;
  badge: string;
  badgeIcon: string;
  description: string;
  isPublic?: boolean;
}

const steps: StepData[] = [
  {
    number: 1,
    title: 'Salon Owner Portal',
    urlPath: 'domain.com/salon-owner',
    badge: 'Strictly Private to Salon Staff',
    badgeIcon: '🔒',
    description:
      'Priya Salon logs in daily using their password. They see their private Live Kanban chairs, appointment calendar, billing terminal, and cash drawer.',
  },
  {
    number: 2,
    title: 'Unique Customer Link',
    urlPath: 'salonpro.in/dixa-beauty-salon',
    badge: 'Public Client Booking Page',
    badgeIcon: '🌐',
    description:
      "Priya Salon puts their unique link on their Instagram bio and Google Maps profile. Customers click and see ONLY Priya Salon's brand, services, and available stylists.",
    isPublic: true,
  },
  {
    number: 3,
    title: 'Instant Client Sync',
    urlPath: 'domain.com/portal',
    badge: 'Permanent Client Records',
    badgeIcon: '✨',
    description:
      "When a customer books, it instantly pops up on Priya Salon's Kanban. The client gets a WhatsApp confirmation and can view their digital bill anytime at /portal.",
  },
];

export default function HowItWorksSteps() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div ref={containerRef} className="relative max-w-4xl mx-auto py-6">
      {/* Vertical Animated Progress Line in Plum + Rose + Gold */}
      {!shouldReduceMotion && (
        <div className="hidden sm:block absolute left-8 top-12 bottom-12 w-[3px] bg-[#E8E1E5] dark:bg-[#3A3040]">
          <motion.div
            style={{ scaleY }}
            className="w-full h-full bg-gradient-to-b from-[#4B263F] via-[#B77A91] to-[#C69A5D] dark:from-[#D6A0B4] dark:via-[#B77A91] dark:to-[#D4AD76] origin-top"
          />
        </div>
      )}

      {/* 3 Step Cards */}
      <div className="space-y-8 sm:space-y-12">
        {steps.map((step, idx) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-8 group"
          >
            {/* Step Number Badge */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#4B263F] dark:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] text-white dark:text-[#D6A0B4] font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#4B263F]/15 ring-4 ring-[#F7F5F2] dark:ring-[#151218] z-10">
              {step.number}
            </div>

            {/* Step Card Body with Ultra-Luxurious Warm Ivory & Plum Styling */}
            <div className="flex-1 w-full bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs group-hover:shadow-lg group-hover:border-[#B77A91]/60 dark:group-hover:border-[#D6A0B4]/40 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <h4 className="text-base sm:text-lg font-bold text-[#242126] dark:text-[#F5EFF5]">{step.title}</h4>

                {/* Animated URL Chip */}
                {step.isPublic ? (
                  <Link
                    href="/dixa-beauty-salon"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-[#F1EBEF] dark:bg-[#2B2230] hover:bg-white dark:hover:bg-[#3A3040] border border-[#E8E1E5] dark:border-[#3A3040] text-[#4B263F] dark:text-[#D6A0B4] text-[11px] sm:text-xs font-mono font-bold transition-colors w-fit max-w-full"
                  >
                    <span className="truncate">{step.urlPath}</span>
                    <span className="text-[10px] bg-[#4B263F] dark:bg-[#D6A0B4] text-white dark:text-[#151218] px-1.5 py-0.2 rounded font-sans shrink-0">
                      Open ↗
                    </span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl bg-[#F1EBEF] dark:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] text-[#77717A] dark:text-[#B5AAB8] text-[11px] sm:text-xs font-mono font-bold w-fit max-w-full truncate">
                    {step.urlPath}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#77717A] dark:text-[#B5AAB8] mt-2 leading-relaxed">
                {step.description}
              </p>

              <div className="mt-4 pt-3 border-t border-[#E8E1E5] dark:border-[#3A3040] flex items-center gap-2 text-xs font-semibold text-[#77717A] dark:text-[#B5AAB8]">
                <span>{step.badgeIcon}</span>
                <span>{step.badge}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
