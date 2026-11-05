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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, index) => {
            const isPro = plan.slug === 'pro' || plan.is_popular;
            const monthlyPrice = Number(plan.price);
            const yearlyPrice = plan.yearly_price ? Number(plan.yearly_price) : monthlyPrice * 10;
            const displayPrice = interval === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice;
            const staffLimit = plan.limits?.max_staff === 0 ? 'Unlimited' : `${plan.limits?.max_staff || plan.max_staff || 3} Staff members`;
            const servicesLimit = plan.limits?.max_services === 0 ? 'Unlimited' : `${plan.limits?.max_services || 30} Services`;
            const waLimit = plan.limits?.wa_per_month === 0 ? '0 WhatsApp bills/mo' : `${plan.limits?.wa_per_month || 200} WhatsApp bills/mo`;

            return (
              <motion.div
                key={plan.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
                whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.6,
                  delay: shouldReduceMotion ? 0 : index * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                        y: isPro ? -10 : -6,
                        transition: { duration: 0.25, ease: 'easeOut' },
                      }
                }
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  isPro
                    ? 'bg-[#10141F] text-white shadow-2xl border-2 border-[#D4A77F] scale-102 lg:-translate-y-2'
                    : 'bg-white dark:bg-[#141926] text-[#1F2937] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-sm hover:shadow-md'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D4A77F] text-[#080B12] text-[11px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md whitespace-nowrap">
                    Most Popular · Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xl font-black ${isPro ? 'text-white' : 'text-[#1F2937] dark:text-[#FFFFFF]'}`}>
                      {plan.name}
                    </h3>
                    <span
                      className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                        isPro
                          ? 'bg-[#D4A77F]/20 text-[#D4A77F] border border-[#D4A77F]/40'
                          : 'bg-[#F3F4F6] dark:bg-[#1C2230] text-[#6B7280] dark:text-[#A0A8B8] border border-[#E5E7EB] dark:border-[#2A2F3A]'
                      }`}
                    >
                      {plan.slug.toUpperCase()}
                    </span>
                  </div>

                  <p className={`text-xs mb-6 min-h-[36px] ${isPro ? 'text-[#A0A8B8]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`}>
                    {plan.description || 'Full salon cloud suite with automated scheduling & billing'}
                  </p>

                  {/* Price Display with Animated Rolling Number */}
                  <div className={`mb-6 pb-6 border-b ${isPro ? 'border-[#2A2F3A]' : 'border-[#E5E7EB] dark:border-[#2A2F3A]'}`}>
                    <div className="flex items-baseline gap-1 overflow-hidden">
                      <span className="text-2xl font-bold">₹</span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`${displayPrice}-${interval}`}
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? {} : { opacity: 0, y: -15 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="text-4xl font-black tracking-tight tabular-nums inline-block"
                        >
                          {displayPrice.toLocaleString('en-IN')}
                        </motion.span>
                      </AnimatePresence>
                      <span className={`text-xs ${isPro ? 'text-[#D4A77F]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`}>
                        / month
                      </span>
                    </div>
                    {interval === 'yearly' && (
                      <div className={`text-[11px] font-semibold mt-1 ${isPro ? 'text-[#D4A77F]' : 'text-[#10B981]'}`}>
                        Billed ₹{yearlyPrice.toLocaleString('en-IN')} annually (2 months free)
                      </div>
                    )}
                    {interval === 'monthly' && (
                      <div className={`text-[11px] mt-1 ${isPro ? 'text-[#A0A8B8]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`}>
                        Billed monthly · Cancel anytime
                      </div>
                    )}
                  </div>

                  {/* Core Limits Summary */}
                  <div className={`mb-5 p-3 rounded-2xl text-xs space-y-1.5 ${isPro ? 'bg-[#141926] border border-[#2A2F3A]' : 'bg-[#F3F4F6] dark:bg-[#1C2230]'}`}>
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
                  <div className="space-y-2.5 text-xs pb-6">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isPro ? 'text-[#D4A77F]' : 'text-[#10B981]'}`} />
                        <span className={isPro ? 'text-[#E5E7EB]' : 'text-[#1F2937] dark:text-[#FFFFFF]'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className={`pt-4 border-t ${isPro ? 'border-[#2A2F3A]' : 'border-[#E5E7EB] dark:border-[#2A2F3A]'}`}>
                  <Link
                    href="/register-salon"
                    className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                      isPro
                        ? 'bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] shadow-[#D4A77F]/20'
                        : 'bg-[#F3F4F6] dark:bg-[#1C2230] hover:bg-[#E5E7EB] dark:hover:bg-[#2A2F3A] text-[#1F2937] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2F3A]'
                    }`}
                  >
                    <span>Start 7-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className={`text-center text-[10px] mt-2 ${isPro ? 'text-[#A0A8B8]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`}>
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
