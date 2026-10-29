'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
  X,
  Users,
  Scissors,
  MessageSquare,
  Lock,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

export default function SalonSubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [subRes, plansRes] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/plans'),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
        if (plansData.plans?.length > 0) {
          setSelectedPlanId(plansData.plans[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleActivatePlan(planId: string) {
    setActivating(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          interval,
          paymentMethod: 'Instant UPI / Card Payment',
          transactionId: `TXN-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentSuccess(true);
        setTimeout(() => {
          setPaymentSuccess(false);
          loadData();
        }, 1500);
      } else {
        alert(data.error || 'Failed to process plan subscription.');
      }
    } catch (err: any) {
      alert(err.message || 'Payment processing error.');
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#b3135b] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-neutral-500">Loading your subscription status...</p>
      </div>
    );
  }

  const currentPlan = subscription?.currentPlan;
  const usage = subscription?.usage || {
    staffCount: 0,
    maxStaff: 3,
    servicesCount: 0,
    maxServices: 30,
    waSentThisMonth: 0,
    waLimit: 0,
  };

  const staffUnlimited = usage.maxStaff === 0;
  const staffPct = staffUnlimited ? 10 : Math.min(100, Math.round((usage.staffCount / (usage.maxStaff || 1)) * 100));

  const servicesUnlimited = usage.maxServices === 0;
  const servicesPct = servicesUnlimited ? 10 : Math.min(100, Math.round((usage.servicesCount / (usage.maxServices || 1)) * 100));

  const waUnlimited = usage.waLimit === 0 && currentPlan?.slug === 'premium';
  const waPct = usage.waLimit === 0 ? 0 : Math.min(100, Math.round((usage.waSentThisMonth / usage.waLimit) * 100));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <span className="text-[11px] font-black uppercase tracking-wider text-pink-600">
          Billing & Workspace Tiers
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2a1630] tracking-tight">
          SaaS Subscription & Feature Limits
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Monitor your salon resource usage, evaluate plan tiers, and manage automatic renewals
        </p>
      </div>

      {paymentSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-bold animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Payment verified successfully! Your salon workspace plan has been updated and activated.</span>
        </div>
      )}

      {/* 1. Current Plan & Expiry Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white flex items-center justify-center shadow-md shadow-pink-900/10">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block mb-0.5">
                Active Plan Tier
              </span>
              <h2 className="text-xl font-black text-[#2a1630]">
                {currentPlan?.name || (subscription?.isTrial ? '7-Day Free Trial (Pro Tier)' : 'Standard Plan')}
              </h2>
              <span className="text-xs text-neutral-500">
                {currentPlan
                  ? `₹${Number(currentPlan.price).toLocaleString()} / ${currentPlan.interval}`
                  : 'Free Evaluation Period'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {subscription?.status === 'active' ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Paid Active Subscription</span>
              </span>
            ) : subscription?.isTrialExpired ? (
              <span className="px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-black flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Trial Expired - Reactivation Required</span>
              </span>
            ) : (
              <span className="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-black flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-600 animate-pulse" />
                <span>Trial Active ({subscription?.trialDaysRemaining} days remaining)</span>
              </span>
            )}
          </div>
        </div>

        {/* Trial Days Countdown Banner */}
        {subscription?.isTrial && !subscription?.isTrialExpired && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-xs text-purple-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-purple-600 shrink-0" />
              <span>
                Your 7-day evaluation period is active until{' '}
                <strong>
                  {subscription.trialEndsAt
                    ? new Date(subscription.trialEndsAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '7 days'}
                </strong>
                . You are currently granted full <strong>Pro Plan</strong> limits & features.
              </span>
            </div>
          </div>
        )}

        {subscription?.subscriptionEndsAt && subscription?.status === 'active' && (
          <div className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Renewal / Expiry Date:{' '}
              <strong className="text-slate-800">
                {new Date(subscription.subscriptionEndsAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* 2. Usage vs Limits Gauges */}
      <div>
        <h3 className="text-base font-black text-[#2a1630] mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#b3135b]" />
          <span>Live Workspace Usage vs Plan Limits</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Staff Gauge */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#b3135b] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Staff Members</span>
              </div>
              <span className="text-xs font-black text-slate-900">
                {usage.staffCount} / {staffUnlimited ? '∞' : usage.maxStaff}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 my-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  staffPct >= 100 && !staffUnlimited ? 'bg-red-500' : 'bg-[#b3135b]'
                }`}
                style={{ width: `${staffUnlimited ? 25 : staffPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>
                {staffUnlimited
                  ? 'Unlimited stylists allowed'
                  : `${Math.max(0, usage.maxStaff - usage.staffCount)} slot${usage.maxStaff - usage.staffCount === 1 ? '' : 's'} remaining`}
              </span>
              <span className="font-bold">{staffUnlimited ? 'Unlimited' : `${staffPct}%`}</span>
            </div>
          </div>

          {/* Services Gauge */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Services Catalog</span>
              </div>
              <span className="text-xs font-black text-slate-900">
                {usage.servicesCount} / {servicesUnlimited ? '∞' : usage.maxServices}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 my-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  servicesPct >= 100 && !servicesUnlimited ? 'bg-red-500' : 'bg-purple-600'
                }`}
                style={{ width: `${servicesUnlimited ? 25 : servicesPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>
                {servicesUnlimited
                  ? 'Unlimited services allowed'
                  : `${Math.max(0, usage.maxServices - usage.servicesCount)} service slots remaining`}
              </span>
              <span className="font-bold">{servicesUnlimited ? 'Unlimited' : `${servicesPct}%`}</span>
            </div>
          </div>

          {/* WhatsApp Gauge */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">WhatsApp This Month</span>
              </div>
              <span className="text-xs font-black text-slate-900">
                {usage.waSentThisMonth} / {usage.waLimit === 0 ? '0' : usage.waLimit}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 my-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  usage.waLimit === 0 ? 'bg-slate-300' : waPct >= 90 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${usage.waLimit === 0 ? 0 : waPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>
                {usage.waLimit === 0
                  ? 'No WhatsApp included (Upgrade to Pro)'
                  : `${Math.max(0, usage.waLimit - usage.waSentThisMonth)} messages remaining`}
              </span>
              <span className="font-bold">{usage.waLimit === 0 ? '0%' : `${waPct}%`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Three SaaS Plans & Comparison Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-[#2a1630]">
              Explore Subscription Plans
            </h3>
            <p className="text-xs text-neutral-500">
              Upgrade anytime with instant UPI / card activation. No data is ever lost upon plan changes.
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
            <span className={`text-xs font-bold ${interval === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setInterval(interval === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 bg-slate-200 rounded-full p-0.5 transition-colors relative cursor-pointer"
              style={{ backgroundColor: interval === 'yearly' ? '#b3135b' : '#cbd5e1' }}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  interval === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1 ${interval === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
              <span>Yearly</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                Save 17%
              </span>
            </span>
          </div>
        </div>

        {/* 3 Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.slug === plan.slug;
            const isPopular = plan.slug === 'pro' || plan.is_popular;
            const monthlyPrice = Number(plan.price);
            const yearlyPrice = plan.yearly_price ? Number(plan.yearly_price) : monthlyPrice * 10;
            const price = interval === 'yearly' ? yearlyPrice : monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl border-2 transition-all p-6 flex flex-col justify-between shadow-xs relative ${
                  isCurrent
                    ? 'border-[#b3135b] ring-4 ring-pink-50'
                    : isPopular
                    ? 'border-purple-300 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 right-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-extrabold text-[#2a1630] text-lg">{plan.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Current Tier
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 mb-4 min-h-[32px]">{plan.description}</p>

                  <div className="mb-4">
                    <span className="text-3xl font-black text-[#2a1630]">
                      ₹{Number(price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-neutral-500 ml-1">
                      /{interval === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>

                  {/* Limits Badge */}
                  <div className="bg-slate-50 rounded-2xl p-3 mb-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Stylists Limit:</span>
                      <strong className="text-slate-900">
                        {plan.limits?.max_staff === 0 ? 'Unlimited' : `${plan.limits?.max_staff || 3} Staff`}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Services Limit:</span>
                      <strong className="text-slate-900">
                        {plan.limits?.max_services === 0 ? 'Unlimited' : `${plan.limits?.max_services || 30} Services`}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>WhatsApp Quota:</span>
                      <strong className="text-slate-900">
                        {plan.limits?.wa_per_month === 0 ? 'None (0)' : `${plan.limits?.wa_per_month || 200}/month`}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-neutral-100 pt-4">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feat: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-neutral-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleActivatePlan(plan.id)}
                  disabled={activating || isCurrent}
                  className={`w-full mt-6 py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isPopular
                      ? 'bg-[#b3135b] hover:bg-[#9c0f4e] text-white shadow-pink-900/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    {isCurrent
                      ? 'Active Current Plan'
                      : activating
                      ? 'Activating Plan...'
                      : `Activate ${plan.name} (₹${Number(price).toLocaleString('en-IN')})`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Comprehensive Feature Comparison Matrix */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs">
          <div className="p-5 bg-slate-50 border-b border-slate-200">
            <h4 className="font-extrabold text-sm text-slate-900">
              Detailed Plan Feature Matrix
            </h4>
            <p className="text-xs text-slate-500">
              Side-by-side comparison of limits and server-side feature access
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3 px-4 font-bold text-slate-700">Capabilities</th>
                  <th className="py-3 px-4 font-black text-slate-900 text-center">Basic (₹499)</th>
                  <th className="py-3 px-4 font-black text-[#b3135b] text-center bg-pink-50/40">Pro (₹999)</th>
                  <th className="py-3 px-4 font-black text-purple-900 text-center">Premium (₹1,999)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Stylists & Staff Capacity</td>
                  <td className="py-3 px-4 text-center text-slate-600 font-bold">Up to 3</td>
                  <td className="py-3 px-4 text-center font-bold text-[#b3135b] bg-pink-50/20">Up to 10</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Services Catalog Limit</td>
                  <td className="py-3 px-4 text-center text-slate-600 font-bold">Up to 30</td>
                  <td className="py-3 px-4 text-center font-bold text-[#b3135b] bg-pink-50/20">Up to 100</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">WhatsApp Digital Invoices</td>
                  <td className="py-3 px-4 text-center text-slate-400">0 / month</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 bg-pink-50/20">200 / month</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">1,000 / month</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Staff Commission Payroll & Reports</td>
                  <td className="py-3 px-4 text-center text-slate-400">❌</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-pink-50/20">✅ Included</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✅ Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">VIP Memberships & Package Passes</td>
                  <td className="py-3 px-4 text-center text-slate-400">❌</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-pink-50/20">✅ Included</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✅ Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Calendar View Appointment Grid</td>
                  <td className="py-3 px-4 text-center text-slate-400">❌</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-pink-50/20">✅ Included</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✅ Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Client Self-Service Reschedule / Cancel</td>
                  <td className="py-3 px-4 text-center text-slate-400">❌</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-pink-50/20">✅ Included</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✅ Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Excel / CSV Data Export</td>
                  <td className="py-3 px-4 text-center text-slate-400">❌</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-pink-50/20">✅ Included</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✅ Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Custom Domain Verification</td>
                  <td className="py-3 px-4 text-center text-slate-400">❌</td>
                  <td className="py-3 px-4 text-center text-slate-400 bg-pink-50/20">❌</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✅ Verified Domain</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Multi-Branch Platform Management</td>
                  <td className="py-3 px-4 text-center text-slate-400">❌</td>
                  <td className="py-3 px-4 text-center text-slate-400 bg-pink-50/20">❌</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✅ Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Dedicated Priority Support</td>
                  <td className="py-3 px-4 text-center text-slate-600">Standard Email</td>
                  <td className="py-3 px-4 text-center text-slate-600 bg-pink-50/20">Standard Email + WhatsApp</td>
                  <td className="py-3 px-4 text-center font-bold text-purple-700">24/7 Dedicated Manager</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
