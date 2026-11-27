'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SalonFormat {
  icon: string;
  title: string;
  description: string;
}

const formats: SalonFormat[] = [
  {
    icon: '💇',
    title: 'Luxury Hair & Color Studios',
    description: 'Multi-chair live tracking, stylist commission splits & inventory control.',
  },
  {
    icon: '🧖‍♀️',
    title: 'Aesthetic & Skin Spas',
    description: 'Advance appointment deposits, client treatment history & custom slot durations.',
  },
  {
    icon: '💅',
    title: 'Nail Bars & Lash Lounges',
    description: 'Fast 15-minute slot turnover, express POS & instant WhatsApp bills.',
  },
  {
    icon: '👰',
    title: 'Bridal & Makeup Artists',
    description: 'Custom packages and date-locking with double-booking prevention.',
  },
  {
    icon: '✂️',
    title: 'Unisex Studios & Salons',
    description: 'Walk-in queue management, multi-stylist rosters & 10-second GST billing.',
  },
  {
    icon: '💈',
    title: 'Barbershops & Grooming Clubs',
    description: 'Fast chair rotation, membership loyalty points & instant UPI QR checkout.',
  },
];

export default function SalonMarquee() {
  const shouldReduceMotion = useReducedMotion();

  // Duplicate list to create seamless infinite marquee loop
  const duplicatedList = [...formats, ...formats];

  return (
    <section className="relative py-12 sm:py-16 bg-[#F8F9FA] dark:bg-[#10141F] border-t border-b border-[#E5E7EB] dark:border-[#2A2F3A] text-[#1F2937] dark:text-[#FFFFFF] overflow-hidden transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 mb-8 sm:mb-10 text-center">
        {/* Accessible Champagne Gold Badge (Contrast >= 4.5:1 on light mode with #8C5E35 and #D4A77F on dark) */}
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#8C5E35] dark:text-[#D4A77F] font-sans font-semibold text-xs sm:text-[13px] tracking-[0.08em] uppercase mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#8C5E35] dark:text-[#D4A77F]" />
          <span>BUILT FOR MODERN BEAUTY BUSINESSES</span>
        </span>

        <h3 className="landing-h2 font-heading font-semibold text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
          Engineered for Salons, Spas &amp; Studios of Every Scale
        </h3>

        <p className="font-sans font-normal text-base text-[#6B7280] dark:text-[#A0A8B8] mt-2.5 max-w-[60ch] mx-auto leading-[1.6]">
          From single-chair boutique studios to multi-chair luxury lounges, SalonPro adapts to your workflow.
        </p>
      </div>

      {/* Marquee Track with Zero-Flicker Gradient Fade on Margins */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  x: ['0%', '-50%'],
                }
          }
          transition={{
            duration: 32,
            repeat: Infinity,
            ease: 'linear',
          }}
          className={`flex gap-4 sm:gap-6 ${
            shouldReduceMotion
              ? 'w-full overflow-x-auto pb-4 px-4 justify-start sm:justify-center flex-wrap no-scrollbar'
              : 'w-max cursor-default'
          }`}
        >
          {duplicatedList.map((format, idx) => (
            <div
              key={`${format.title}-${idx}`}
              className="w-[280px] xs:w-[310px] sm:w-[350px] min-h-[140px] p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs shrink-0 flex flex-col justify-between transition-all duration-300 hover:border-[#B8905F]/50 dark:hover:border-[#D4A77F]/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-center text-base sm:text-lg shrink-0">
                    <span role="img" aria-label={format.title}>
                      {format.icon}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
                    {format.title}
                  </h4>
                </div>

                <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] leading-relaxed">
                  {format.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
