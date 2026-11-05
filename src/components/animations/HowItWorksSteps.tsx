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
      {/* Vertical Animated Progress Line in Champagne Gold */}
      {!shouldReduceMotion && (
        <div className="hidden sm:block absolute left-8 top-12 bottom-12 w-[3px] bg-[#E5E7EB] dark:bg-[#2A2F3A]">
          <motion.div
            style={{ scaleY }}
            className="w-full h-full bg-gradient-to-b from-[#D4A77F] via-[#B8905F] to-[#D4A77F] origin-top"
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
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] text-[#D4A77F] font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/15 ring-4 ring-white dark:ring-[#080B12] z-10">
              {step.number}
            </div>

            {/* Step Card Body with Warm Ivory & Gold Styling */}
            <div className="flex-1 w-full bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs group-hover:shadow-lg group-hover:border-[#D4A77F]/60 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <h4 className="text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#FFFFFF]">{step.title}</h4>

                {/* Animated URL Chip */}
                {step.isPublic ? (
                  <Link
                    href="/dixa-beauty-salon"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] hover:bg-white dark:hover:bg-[#2A2F3A] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#D4A77F] text-[11px] sm:text-xs font-mono font-bold transition-colors w-fit max-w-full"
                  >
                    <span className="truncate">{step.urlPath}</span>
                    <span className="text-[10px] bg-[#D4A77F] text-[#080B12] px-1.5 py-0.2 rounded font-sans shrink-0 font-bold">
                      Open ↗
                    </span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#6B7280] dark:text-[#A0A8B8] text-[11px] sm:text-xs font-mono font-bold w-fit max-w-full truncate">
                    {step.urlPath}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] mt-2 leading-relaxed">
                {step.description}
              </p>

              <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center gap-2 text-xs font-semibold text-[#6B7280] dark:text-[#A0A8B8]">
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
