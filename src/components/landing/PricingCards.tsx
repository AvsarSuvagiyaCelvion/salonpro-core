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
      <div className="flex items-center justify-center gap-3 mb-10 select-none">
        <button
          type="button"
          onClick={() => setInterval('monthly')}
          className={`text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
            interval === 'monthly' ? 'text-[#242126] dark:text-[#F5EFF5]' : 'text-[#77717A] dark:text-[#B5AAB8] hover:text-[#4B263F]'
          }`}
        >
          Monthly Billing
        </button>

        {/* Sliding Pill Toggle */}
        <button
          type="button"
          onClick={() => setInterval(interval === 'monthly' ? 'yearly' : 'monthly')}
          className="w-14 h-8 bg-[#E8E1E5] dark:bg-[#3A3040] rounded-full p-1 transition-colors relative cursor-pointer focus:outline-none shadow-inner"
          style={{ backgroundColor: interval === 'yearly' ? '#4B263F' : undefined }}
          aria-label="Toggle Monthly and Yearly Plans"
        >
          <motion.div
            layout
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
            className={`w-6 h-6 bg-white dark:bg-[#F5EFF5] rounded-full shadow-md ${
              interval === 'yearly' ? 'ml-auto' : 'mr-auto'
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => setInterval('yearly')}
          className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            interval === 'yearly' ? 'text-[#242126] dark:text-[#F5EFF5]' : 'text-[#77717A] dark:text-[#B5AAB8] hover:text-[#4B263F]'
          }`}
        >
          <span>Yearly Billing</span>
          <motion.span
            animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="px-2.5 py-0.5 rounded-full bg-[#F1EBEF] dark:bg-[#2B2230] text-[#C69A5D] dark:text-[#D4AD76] text-[10px] font-black uppercase tracking-wider inline-block shadow-xs border border-[#E8E1E5] dark:border-[#3A3040]"
          >
            Save 17% (2 Mo Free)
          </motion.span>
        </button>
      </div>

      {/* Plans Grid or Fallback */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#E8E1E5] border-t-[#4B263F] dark:border-t-[#D6A0B4] rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] shadow-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#F1EBEF] dark:bg-[#2B2230] flex items-center justify-center text-[#4B263F] dark:text-[#D6A0B4]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#242126] dark:text-[#F5EFF5] mb-2">Pricing Plans Unavailable</h3>
          <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mb-6">
            We were unable to load our subscription plans right now. Please refresh the page to view current pricing and features.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[#4B263F] dark:bg-[#D6A0B4] text-white dark:text-[#151218] text-xs font-bold hover:bg-[#3A1C30] transition-colors cursor-pointer"
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, index) => {
            const isPro = plan.slug === 'pro' || plan.is_popular;
            const isPremium = plan.slug === 'premium';
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
                        y: isPro ? -12 : -8,
                        transition: { duration: 0.3, ease: 'easeOut' },
                      }
                }
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-shadow duration-300 relative ${
                  isPro
                    ? 'bg-gradient-to-b from-[#4B263F] via-[#3A1C30] to-[#211B24] text-white shadow-2xl border-2 border-[#C69A5D]/60 dark:border-[#D4AD76]/80 scale-102 lg:-translate-y-2'
                    : isPremium
                    ? 'bg-white dark:bg-[#211B24] text-[#242126] dark:text-[#F5EFF5] border-2 border-[#B77A91] shadow-xl'
                    : 'bg-white dark:bg-[#211B24] text-[#242126] dark:text-[#F5EFF5] border border-[#E8E1E5] dark:border-[#3A3040] shadow-sm hover:shadow-md'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C69A5D] text-[#242126] text-[11px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md whitespace-nowrap">
                    Most Popular · Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xl font-black ${isPro ? 'text-white' : 'text-[#242126] dark:text-[#F5EFF5]'}`}>
                      {plan.name}
                    </h3>
                    <span
                      className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                        isPro
                          ? 'bg-white/20 text-[#D4AD76] border border-white/20'
                          : isPremium
                          ? 'bg-[#F1EBEF] dark:bg-[#2B2230] text-[#4B263F] dark:text-[#D6A0B4] border border-[#E8E1E5] dark:border-[#3A3040]'
                          : 'bg-[#F1EBEF] dark:bg-[#2B2230] text-[#77717A] dark:text-[#B5AAB8] border border-[#E8E1E5] dark:border-[#3A3040]'
                      }`}
                    >
                      {plan.slug.toUpperCase()}
                    </span>
                  </div>

                  <p className={`text-xs mb-6 min-h-[36px] ${isPro ? 'text-[#E8E1E5]' : 'text-[#77717A] dark:text-[#B5AAB8]'}`}>
                    {plan.description || 'Full salon cloud suite with automated scheduling & billing'}
                  </p>

                  {/* Price Display with Animated Rolling Number */}
                  <div className={`mb-6 pb-6 border-b ${isPro ? 'border-white/15' : 'border-[#E8E1E5] dark:border-[#3A3040]'}`}>
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
                      <span className={`text-xs ${isPro ? 'text-[#D4AD76]' : 'text-[#77717A] dark:text-[#B5AAB8]'}`}>
                        / month
                      </span>
                    </div>
                    {interval === 'yearly' && (
                      <div className={`text-[11px] font-semibold mt-1 ${isPro ? 'text-[#D4AD76]' : 'text-[#2F7D68] dark:text-[#55B99A]'}`}>
                        Billed ₹{yearlyPrice.toLocaleString('en-IN')} annually (2 months free)
                      </div>
                    )}
                    {interval === 'monthly' && (
                      <div className={`text-[11px] mt-1 ${isPro ? 'text-white/70' : 'text-[#77717A] dark:text-[#B5AAB8]'}`}>
                        Billed monthly · Cancel anytime
                      </div>
                    )}
                  </div>

                  {/* Core Limits Summary */}
                  <div className={`mb-5 p-3 rounded-2xl text-xs space-y-1.5 ${isPro ? 'bg-white/10' : 'bg-[#F1EBEF] dark:bg-[#2B2230]'}`}>
                    <div className="flex items-center justify-between">
                      <span className={isPro ? 'text-[#E8E1E5]' : 'text-[#77717A] dark:text-[#B5AAB8]'}>Staff capacity:</span>
                      <strong className={isPro ? 'text-white' : 'text-[#242126] dark:text-[#F5EFF5]'}>{staffLimit}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isPro ? 'text-[#E8E1E5]' : 'text-[#77717A] dark:text-[#B5AAB8]'}>Service catalog:</span>
                      <strong className={isPro ? 'text-white' : 'text-[#242126] dark:text-[#F5EFF5]'}>{servicesLimit}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isPro ? 'text-[#E8E1E5]' : 'text-[#77717A] dark:text-[#B5AAB8]'}>WhatsApp quota:</span>
                      <strong className={isPro ? 'text-white' : 'text-[#242126] dark:text-[#F5EFF5]'}>{waLimit}</strong>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 text-xs pb-6">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isPro ? 'text-[#D4AD76]' : 'text-[#2F7D68] dark:text-[#55B99A]'}`} />
                        <span className={isPro ? 'text-[#F5EFF5]' : 'text-[#242126] dark:text-[#F5EFF5]'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className={`pt-4 border-t ${isPro ? 'border-white/15' : 'border-[#E8E1E5] dark:border-[#3A3040]'}`}>
                  <Link
                    href="/register-salon"
                    className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                      isPro
                        ? 'bg-[#C69A5D] hover:bg-[#b08447] text-[#242126] shadow-[#C69A5D]/20'
                        : 'bg-[#4B263F] hover:bg-[#3A1C30] text-white dark:bg-[#D6A0B4] dark:hover:bg-[#C48E9F] dark:text-[#151218]'
                    }`}
                  >
                    <span>Start 7-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className={`text-center text-[10px] mt-2 ${isPro ? 'text-white/70' : 'text-[#77717A] dark:text-[#B5AAB8]'}`}>
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
