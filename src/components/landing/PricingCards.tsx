'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

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
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-xs sm:text-sm font-bold ${interval === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
          Monthly Billing
        </span>
        <button
          type="button"
          onClick={() => setInterval(interval === 'monthly' ? 'yearly' : 'monthly')}
          className="w-14 h-8 bg-slate-200 rounded-full p-1 transition-colors relative cursor-pointer focus:outline-none"
          style={{ backgroundColor: interval === 'yearly' ? '#b3135b' : '#cbd5e1' }}
          aria-label="Toggle Monthly and Yearly Plans"
        >
          <div
            className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
              interval === 'yearly' ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${interval === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
          <span>Yearly Billing</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
            Save 17% (2 Mo Free)
          </span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
        {plans.map((plan) => {
          const isPro = plan.slug === 'pro' || plan.is_popular;
          const isPremium = plan.slug === 'premium';
          const monthlyPrice = Number(plan.price);
          const yearlyPrice = plan.yearly_price ? Number(plan.yearly_price) : monthlyPrice * 10;
          const displayPrice = interval === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice;
          const staffLimit = plan.limits?.max_staff === 0 ? 'Unlimited' : `${plan.limits?.max_staff || plan.max_staff || 3} Staff members`;
          const servicesLimit = plan.limits?.max_services === 0 ? 'Unlimited' : `${plan.limits?.max_services || 30} Services`;
          const waLimit = plan.limits?.wa_per_month === 0 ? '0 WhatsApp bills/mo' : `${plan.limits?.wa_per_month || 200} WhatsApp bills/mo`;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                isPro
                  ? 'bg-gradient-to-b from-[#2a1630] to-[#1a0c1e] text-white shadow-2xl border-2 border-pink-500/50 scale-102 lg:-translate-y-2'
                  : isPremium
                  ? 'bg-white text-slate-900 border-2 border-purple-300 shadow-xl'
                  : 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md">
                  Most Popular · Recommended
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-xl font-black ${isPro ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                      isPro
                        ? 'bg-pink-500/30 text-pink-200 border border-pink-400/30'
                        : isPremium
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {plan.slug.toUpperCase()}
                  </span>
                </div>

                <p className={`text-xs mb-6 min-h-[36px] ${isPro ? 'text-pink-100/80' : 'text-slate-500'}`}>
                  {plan.description || 'Full salon cloud suite with automated scheduling & billing'}
                </p>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-100/20">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight">
                      ₹{displayPrice.toLocaleString('en-IN')}
                    </span>
                    <span className={`text-xs ${isPro ? 'text-pink-200' : 'text-slate-500'}`}>
                      / month
                    </span>
                  </div>
                  {interval === 'yearly' && (
                    <div className={`text-[11px] font-semibold mt-1 ${isPro ? 'text-emerald-300' : 'text-emerald-600'}`}>
                      Billed ₹{yearlyPrice.toLocaleString('en-IN')} annually (2 months free)
                    </div>
                  )}
                  {interval === 'monthly' && (
                    <div className={`text-[11px] mt-1 ${isPro ? 'text-pink-200/70' : 'text-slate-400'}`}>
                      Billed monthly · Cancel anytime
                    </div>
                  )}
                </div>

                {/* Core Limits Summary */}
                <div className={`mb-5 p-3 rounded-2xl text-xs space-y-1.5 ${isPro ? 'bg-white/10' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={isPro ? 'text-pink-200' : 'text-slate-500'}>Staff capacity:</span>
                    <strong className={isPro ? 'text-white' : 'text-slate-900'}>{staffLimit}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isPro ? 'text-pink-200' : 'text-slate-500'}>Service catalog:</span>
                    <strong className={isPro ? 'text-white' : 'text-slate-900'}>{servicesLimit}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isPro ? 'text-pink-200' : 'text-slate-500'}>WhatsApp quota:</span>
                    <strong className={isPro ? 'text-white' : 'text-slate-900'}>{waLimit}</strong>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 text-xs pb-6">
                  {(Array.isArray(plan.features) ? plan.features : []).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isPro ? 'text-pink-400' : 'text-emerald-600'}`} />
                      <span className={isPro ? 'text-pink-50' : 'text-slate-700'}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100/20">
                <Link
                  href="/register-salon"
                  className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                    isPro
                      ? 'bg-gradient-to-r from-pink-500 to-[#d62475] hover:from-pink-600 hover:to-[#b3135b] text-white shadow-pink-900/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>Start 7-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className={`text-center text-[10px] mt-2 ${isPro ? 'text-pink-200/70' : 'text-slate-400'}`}>
                  Includes 7 days of full Pro evaluation with ₹0 charged today.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

