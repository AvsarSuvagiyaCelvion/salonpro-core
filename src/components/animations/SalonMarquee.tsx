'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Star, Scissors, Sparkles, Building2 } from 'lucide-react';

interface MarqueeSalon {
  name: string;
  city: string;
  rating: string;
  quote: string;
}

const salons: MarqueeSalon[] = [
  {
    name: 'Glow Studio & Bridal Lounge',
    city: 'Bandra West, Mumbai',
    rating: '5.0',
    quote: 'Zero double-bookings since Day 1. WhatsApp bills are amazing.',
  },
  {
    name: 'The Crown Unisex Hair Studio',
    city: 'Greater Kailash, Delhi',
    rating: '4.9',
    quote: 'Saved 2 hours daily on end-of-day stylist commissions.',
  },
  {
    name: 'Bella Luxury Aesthetics & Spa',
    city: 'Bodakdev, Ahmedabad',
    rating: '5.0',
    quote: 'Our clients love the instant online booking link on Instagram.',
  },
  {
    name: 'Urban Mane Hair Bar',
    city: 'Koramangala, Bangalore',
    rating: '4.9',
    quote: 'Fastest POS billing we have ever used. 10 seconds flat.',
  },
  {
    name: 'Dixa Beauty Lounge',
    city: 'Vesu, Surat',
    rating: '5.0',
    quote: 'Staff loves the Live Chair Kanban. Complete game changer.',
  },
];

export default function SalonMarquee() {
  const shouldReduceMotion = useReducedMotion();

  // Duplicate list to create seamless infinite marquee loop
  const duplicatedList = [...salons, ...salons];

  return (
    <section className="relative py-12 bg-slate-900 border-t border-b border-slate-800 text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Trusted by Salons Across India</span>
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Modern Studios Run Smoother with SalonPro
        </h3>
      </div>

      {/* Marquee Track */}
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
            duration: 26,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="flex gap-4 sm:gap-6 w-max cursor-default hover:[animation-play-state:paused]"
        >
          {duplicatedList.map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="w-[280px] sm:w-[320px] p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md shrink-0 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-pink-600/30 text-pink-400 flex items-center justify-center text-xs font-black">
                      ✂
                    </div>
                    <span className="font-bold text-xs text-white truncate max-w-[170px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 italic leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
                {item.city}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

