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
      {/* Vertical Animated Progress Line (Desktop and Tablet) */}
      {!shouldReduceMotion && (
        <div className="hidden sm:block absolute left-8 top-12 bottom-12 w-[3px] bg-slate-200 dark:bg-slate-800">
          <motion.div
            style={{ scaleY }}
            className="w-full h-full bg-gradient-to-b from-[#b3135b] via-[#e63985] to-emerald-500 origin-top"
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
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-pink-900/20 ring-4 ring-white dark:ring-[#0c0610] z-10">
              {step.number}
            </div>

            {/* Step Card Body with Ultra-Luxurious Styling */}
            <div className="flex-1 w-full bg-white dark:bg-[#180e1c] border border-slate-200/90 dark:border-pink-500/20 rounded-2xl sm:rounded-3xl p-6 shadow-xs group-hover:shadow-lg dark:group-hover:shadow-pink-950/20 group-hover:border-pink-300 dark:group-hover:border-pink-500/40 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{step.title}</h4>

                {/* Animated URL Chip */}
                {step.isPublic ? (
                  <Link
                    href="/dixa-beauty-salon"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 dark:hover:bg-pink-900/50 border border-pink-200 dark:border-pink-800/40 text-[#b3135b] dark:text-pink-300 text-xs font-mono font-bold transition-colors w-fit"
                  >
                    <span>{step.urlPath}</span>
                    <span className="text-[10px] bg-[#b3135b] text-white px-1.5 py-0.2 rounded font-sans">
                      Open ↗
                    </span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold w-fit">
                    {step.urlPath}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {step.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
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
