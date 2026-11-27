'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  yearly_price?: number;
  billing_interval: string;
  features: string[];
  max_staff: number;
  limits?: {
    max_staff?: number;
    max_services?: number;
    wa_per_month?: number;
  };
  flags?: Record<string, boolean>;
  is_popular?: boolean;
}

export default function PricingCards() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.plans) && data.plans.length > 0) {
            setPlans(data.plans);
          }
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  return (
    <div className="w-full">
      {/* Monthly / Yearly Billing Toggle */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 select-none px-2">
        <button
          type="button"
          onClick={() => setInterval('monthly')}
          className={`text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            interval === 'monthly' ? 'text-[#1F2937] dark:text-[#FFFFFF]' : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
          }`}
        >
          Monthly Billing
        </button>

        {/* Sliding Pill Toggle */}
        <button
          type="button"
          onClick={() => setInterval(interval === 'monthly' ? 'yearly' : 'monthly')}
          className="w-12 sm:w-14 h-7 sm:h-8 bg-[#E5E7EB] dark:bg-[#2A2F3A] rounded-full p-1 transition-colors relative cursor-pointer focus:outline-none shadow-inner shrink-0"
          style={{ backgroundColor: interval === 'yearly' ? '#D4A77F' : undefined }}
          aria-label="Toggle Monthly and Yearly Plans"
        >
          <motion.div
            layout
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
            className={`w-5 sm:w-6 h-5 sm:h-6 bg-white dark:bg-[#FFFFFF] rounded-full shadow-md ${
              interval === 'yearly' ? 'ml-auto' : 'mr-auto'
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => setInterval('yearly')}
          className={`text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer ${
            interval === 'yearly' ? 'text-[#1F2937] dark:text-[#FFFFFF]' : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
          }`}
        >
          <span>Yearly Billing</span>
          <motion.span
            animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="px-2 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] text-[9px] sm:text-[10px] font-black uppercase tracking-wider inline-block shadow-xs border border-[#E5E7EB] dark:border-[#2A2F3A]"
          >
            Save 17%
          </motion.span>
        </button>
      </div>

      {/* Plans Grid or Fallback */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#D4A77F] rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] flex items-center justify-center text-[#D4A77F]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-2">Pricing Plans</h3>
          <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mb-6">
            Explore our subscription tiers or launch your 7-day free trial.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[#D4A77F] text-[#080B12] text-xs font-bold hover:bg-[#B8905F] transition-colors cursor-pointer"
          >
            Refresh Plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, index) => {
            const isPro = plan.slug === 'pro' || plan.is_popular;
            const monthlyPrice = Number(plan.price);
            const yearlyPrice = plan.yearly_price ? Number(plan.yearly_price) : monthlyPrice * 10;
            const displayPrice = interval === 'yearly' ? yearlyPrice : monthlyPrice;
            const staffLimit = plan.limits?.max_staff === 0 ? 'Unlimited' : `${plan.limits?.max_staff || plan.max_staff || 3} Staff members`;
            const servicesLimit = plan.limits?.max_services === 0 ? 'Unlimited' : `${plan.limits?.max_services || 30} Services`;
            const waLimit = plan.limits?.wa_per_month === 0 ? '0 WhatsApp bills/mo' : `${plan.limits?.wa_per_month || 200} WhatsApp bills/mo`;

            return (
              <motion.div
                key={plan.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: shouldReduceMotion ? 0 : index * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                        y: isPro ? -5 : -3,
                        transition: { duration: 0.2, ease: 'easeOut' },
                      }
                }
                className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 relative ${
                  isPro
                    ? 'bg-[#10141F] text-white shadow-xl border-2 border-[#D4A77F] md:scale-[1.02] md:-translate-y-1.5'
                    : 'bg-white dark:bg-[#141926] text-[#1F2937] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs hover:shadow-md'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4A77F] text-[#080B12] text-[10px] sm:text-[11px] font-bold tracking-wide py-0.5 sm:py-1 px-3 sm:px-3.5 rounded-full shadow-xs whitespace-nowrap flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#080B12] shrink-0" />
                    <span>Most Recommended</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isPro ? 'text-white' : 'text-[#1F2937] dark:text-[#FFFFFF]'}`}>
                      {plan.name}
                    </h3>
                    <span
                      className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        isPro
                          ? 'bg-[#D4A77F]/20 text-[#D4A77F] border border-[#D4A77F]/40'
                          : 'bg-[#F3F4F6] dark:bg-[#1C2230] text-[#6B7280] dark:text-[#A0A8B8] border border-[#E5E7EB] dark:border-[#2A2F3A]'
                      }`}
                    >
                      {plan.slug.toUpperCase()}
                    </span>
                  </div>

                  <p className={`text-xs mb-5 min-h-[32px] leading-relaxed ${isPro ? 'text-[#A0A8B8]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`}>
                    {plan.description || 'Full salon cloud suite with automated scheduling & billing'}
                  </p>

                  {/* Price Display with Animated Rolling Number */}
                  <div className={`mb-5 pb-5 border-b ${isPro ? 'border-[#2A2F3A]' : 'border-[#E5E7EB] dark:border-[#2A2F3A]'}`}>
                    <div className="flex items-baseline gap-1 overflow-hidden">
                      <span className="text-xl sm:text-2xl font-bold">₹</span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`${displayPrice}-${interval}`}
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? {} : { opacity: 0, y: -12 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums inline-block"
                        >
                          {displayPrice.toLocaleString('en-IN')}
                        </motion.span>
                      </AnimatePresence>
                      <span className={`text-xs font-medium ${isPro ? 'text-[#D4A77F]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`}>
                        / {interval === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {interval === 'yearly' && (
                      <div className={`text-[10px] sm:text-[11px] font-semibold mt-1 ${isPro ? 'text-[#D4A77F]' : 'text-[#10B981]'}`}>
                        Equal to ₹{Math.round(yearlyPrice / 12).toLocaleString('en-IN')}/mo · 2 Months Free!
                      </div>
                    )}
                    {interval === 'monthly' && (
                      <div className={`text-[10px] sm:text-[11px] mt-1 ${isPro ? 'text-[#A0A8B8]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`}>
                        Billed monthly · Cancel anytime
                      </div>
                    )}
                  </div>

                  {/* Core Limits Summary */}
                  <div className={`mb-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs space-y-1.5 ${isPro ? 'bg-[#141926] border border-[#2A2F3A]' : 'bg-[#F3F4F6] dark:bg-[#1C2230]'}`}>
                    <div className="flex items-center justify-between">
                      <span className={isPro ? 'text-[#A0A8B8]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}>Staff capacity:</span>
                      <strong className={isPro ? 'text-white' : 'text-[#1F2937] dark:text-[#FFFFFF]'}>{staffLimit}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isPro ? 'text-[#A0A8B8]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}>Service catalog:</span>
                      <strong className={isPro ? 'text-white' : 'text-[#1F2937] dark:text-[#FFFFFF]'}>{servicesLimit}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isPro ? 'text-[#A0A8B8]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}>WhatsApp quota:</span>
                      <strong className={isPro ? 'text-white' : 'text-[#1F2937] dark:text-[#FFFFFF]'}>{waLimit}</strong>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 text-xs pb-5">
                    {(Array.isArray(plan.features) ? plan.features : [])
                      .filter((feat) => !feat.toLowerCase().includes('custom domain'))
                      .map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isPro ? 'text-[#D4A77F]' : 'text-[#10B981]'}`} />
                        <span className={`text-[11px] sm:text-xs leading-normal ${isPro ? 'text-[#E5E7EB]' : 'text-[#1F2937] dark:text-[#FFFFFF]'}`}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className={`pt-3.5 border-t ${isPro ? 'border-[#2A2F3A]' : 'border-[#E5E7EB] dark:border-[#2A2F3A]'}`}>
                  <Link
                    href={`/register-salon?plan=${plan.slug}&interval=${interval}`}
                    className={`w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                      isPro
                        ? 'bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] shadow-[#D4A77F]/20'
                        : 'bg-[#F3F4F6] dark:bg-[#1C2230] hover:bg-[#E5E7EB] dark:hover:bg-[#2A2F3A] text-[#1F2937] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2F3A]'
                    }`}
                  >
                    <span>Start 7-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className={`text-center text-[10px] sm:text-[11px] mt-2 ${isPro ? 'text-[#A0A8B8]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`}>
                    Includes 7 days of full Pro evaluation with ₹0 charged today.
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
