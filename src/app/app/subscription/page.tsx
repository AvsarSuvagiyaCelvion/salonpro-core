'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
  Users,
  Scissors,
  MessageSquare,
  Receipt,
} from 'lucide-react';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SalonSubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [pastPayments, setPastPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [activating, setActivating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [subRes, plansRes, paymentsRes] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/plans'),
        fetch('/api/subscription/payments'),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }

      if (paymentsRes.ok) {
        const payData = await paymentsRes.json();
        setPastPayments(payData.payments || []);
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
    setMessage(null);

    try {
      // 1. Load Razorpay script in browser
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay payment gateway. Please check your internet connection.');
      }

      // 2. Create Razorpay Order on server
      const orderRes = await fetch('/api/subscription/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          interval,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initialize payment.');
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'SalonPro Cloud ERP',
        description: `Plan: ${orderData.planName} (${interval === 'yearly' ? 'Annual Billing' : 'Monthly Billing'})`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.salonName || '',
          contact: orderData.salonPhone || '',
        },
        theme: {
          color: '#b3135b',
        },
        modal: {
          ondismiss: function () {
            setActivating(false);
          },
        },
        handler: async function (response: any) {
          try {
            setActivating(true);
            // 4. Verify signature on server
            const verifyRes = await fetch('/api/subscription/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
                interval,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              setPaymentSuccess(true);
              setMessage({
                type: 'success',
                text: `Payment Successful! Payment ID: ${response.razorpay_payment_id}. Your salon subscription is now active!`,
              });
              setTimeout(() => {
                setPaymentSuccess(false);
                loadData();
              }, 2500);
            } else {
              setMessage({ type: 'error', text: verifyData.error || 'Payment signature verification failed.' });
            }
          } catch (vErr: any) {
            setMessage({ type: 'error', text: vErr.message || 'Payment verification error.' });
          } finally {
            setActivating(false);
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (resp: any) {
        const errMsg = resp.error?.description || resp.error?.reason || 'Transaction could not be completed.';
        setMessage({
          type: 'error',
          text: `Payment Failed: ${errMsg}`,
        });
        alert(`Payment Failed: ${errMsg}`);
        setActivating(false);
      });

      razorpay.open();
    } catch (err: any) {
      console.error('handleActivatePlan error:', err);
      const errMsg = err.message || 'Payment processing error.';
      setMessage({ type: 'error', text: errMsg });
      alert(errMsg);
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

  const waPct = usage.waLimit === 0 ? 0 : Math.min(100, Math.round((usage.waSentThisMonth / usage.waLimit) * 100));

  return (
    <div className="space-y-8 pb-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Top Banner Alert (if any) */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs font-normal underline hover:opacity-75 cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Payment Success Overlay Toast */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-neutral-100">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-neutral-900 mb-2">Payment Successful!</h3>
            <p className="text-xs text-neutral-600 mb-6">
              Your Razorpay transaction was verified. Your salon plan has been upgraded and all premium features are active!
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
              <Sparkles className="w-4 h-4" />
              <span>Features Unlocked Instantly</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header & Active Plan Status Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2a1630] via-[#3d1538] to-[#1a0a1f] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-pink-900/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Salon Workspace
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Razorpay Verified
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Test Mode
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {subscription?.salonName || 'Your Salon'} Subscription
            </h2>

            <p className="text-xs text-pink-100/70 max-w-xl">
              Manage your software subscription tier, real-time usage limits, and seamless UPI / Card renewals powered by Razorpay.
            </p>
          </div>

          {/* Current Status Pill Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-[240px]">
            <div className="text-[10px] uppercase font-bold text-pink-200/80 tracking-wider mb-1">
              Active Tier
            </div>
            <div className="text-2xl font-black text-white flex items-center gap-2">
              <span>{currentPlan?.name || 'Pro Plan'}</span>
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-pink-200/70">Status:</span>
              <span
                className={`font-black uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-full ${
                  subscription?.status === 'active'
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : subscription?.status === 'trial'
                    ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                    : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {subscription?.status === 'trial'
                  ? `Trial (${subscription?.trialDaysRemaining ?? 7}d left)`
                  : subscription?.status === 'active'
                  ? 'Active Paid'
                  : 'Expired'}
              </span>
            </div>

            {subscription?.subscriptionEndsAt && (
              <div className="text-[10px] text-pink-200/60 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                <span>
                  Valid till{' '}
                  {new Date(subscription.subscriptionEndsAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Current Month Resource Usage Gauges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-[#2a1630]">Resource Consumption & Limits</h3>
            <p className="text-xs text-neutral-500">Live tracker for current monthly billing cycle</p>
          </div>
          <span className="text-xs font-bold text-neutral-400">
            Cycle: {usage.period || new Date().toISOString().slice(0, 7)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Staff Limit */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#b3135b] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Stylists & Staff</span>
              </div>
              <span className="text-xs font-black text-slate-900">
                {usage.staffCount} / {staffUnlimited ? '∞' : usage.maxStaff}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 my-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  staffUnlimited ? 'bg-pink-500' : staffPct >= 90 ? 'bg-amber-500' : 'bg-[#b3135b]'
                }`}
                style={{ width: `${staffPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>{staffUnlimited ? 'Unlimited stylists allowed' : `${Math.max(0, usage.maxStaff - usage.staffCount)} slots remaining`}</span>
              <span className="font-bold">{staffUnlimited ? 'Unlimited' : `${staffPct}%`}</span>
            </div>
          </div>

          {/* Services Catalog Limit */}
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
                  servicesUnlimited ? 'bg-purple-500' : servicesPct >= 90 ? 'bg-amber-500' : 'bg-purple-600'
                }`}
                style={{ width: `${servicesPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>{servicesUnlimited ? 'Unlimited catalog size' : `${Math.max(0, usage.maxServices - usage.servicesCount)} services remaining`}</span>
              <span className="font-bold">{servicesUnlimited ? 'Unlimited' : `${servicesPct}%`}</span>
            </div>
          </div>

          {/* WhatsApp Invoices Limit */}
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
              Upgrade anytime with instant Razorpay checkout (UPI, QR Code, Cards & Netbanking).
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
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${interval === 'yearly' ? 'text-[#b3135b]' : 'text-slate-500'}`}>
                Yearly
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Save 2 Months
              </span>
            </div>
          </div>
        </div>

        {/* 3 Plan Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.id === plan.id;
            const price = interval === 'yearly' ? Number(plan.yearly_price) : Number(plan.price);
            const isPopular = plan.is_popular || plan.slug === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl p-6 sm:p-7 border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-emerald-500/80 shadow-md ring-2 ring-emerald-500/20'
                    : isPopular
                    ? 'border-[#b3135b] shadow-xl ring-2 ring-pink-500/20'
                    : 'border-neutral-200 shadow-xs hover:border-neutral-300'
                }`}
              >
                {/* Popular / Current Badges */}
                {isCurrent && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                    Current Plan
                  </div>
                )}
                {!isCurrent && isPopular && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#b3135b] text-white shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {plan.name} Tier
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">{plan.name}</h4>
                  <p className="text-xs text-neutral-500 mt-1 min-h-[32px]">{plan.description}</p>

                  <div className="my-5 pb-5 border-b border-neutral-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">
                        ₹{Number(price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-bold text-neutral-400">
                        /{interval === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {interval === 'yearly' && (
                      <div className="text-[11px] text-emerald-600 font-bold mt-1">
                        Equivalent to ₹{Math.round(price / 12).toLocaleString('en-IN')}/month
                      </div>
                    )}
                  </div>

                  {/* Limits bullets */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Users className="w-4 h-4 text-[#b3135b] shrink-0" />
                      <span>
                        {plan.limits?.max_staff === 0 ? 'Unlimited Staff' : `Up to ${plan.limits?.max_staff || 3} Staff Members`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Scissors className="w-4 h-4 text-[#b3135b] shrink-0" />
                      <span>
                        {plan.limits?.max_services === 0 ? 'Unlimited Services' : `Up to ${plan.limits?.max_services || 30} Services`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <MessageSquare className="w-4 h-4 text-[#b3135b] shrink-0" />
                      <span>
                        {(plan.limits?.wa_per_month || 0) === 0 ? '0 WhatsApp Invoices' : `${plan.limits.wa_per_month} WhatsApp/mo`}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
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
                  className={`w-full mt-6 py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isPopular
                      ? 'bg-[#b3135b] hover:bg-[#9c0f4e] text-white shadow-pink-900/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isCurrent
                      ? 'Active Current Plan'
                      : activating
                      ? 'Opening Razorpay...'
                      : `Pay with Razorpay (₹${Number(price).toLocaleString('en-IN')})`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* 4. Detailed Feature Comparison Matrix */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs mb-8">
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
                  {plans.map((p) => {
                    const price =
                      interval === 'yearly'
                        ? Math.round((Number(p.yearly_price) || Number(p.price) * 10) / 12)
                        : Number(p.price);
                    const isPopular = p.is_popular || p.slug === 'pro';
                    return (
                      <th
                        key={p.id}
                        className={`py-3 px-4 font-black text-center ${
                          isPopular ? 'text-[#b3135b] bg-pink-50/40' : 'text-slate-900'
                        }`}
                      >
                        {p.name} (₹{price.toLocaleString('en-IN')})
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Stylists & Staff Capacity</td>
                  {plans.map((p) => {
                    const lim = p.limits?.max_staff ?? p.max_staff ?? 3;
                    return (
                      <td key={p.id} className="py-3 px-4 text-center font-bold text-slate-700">
                        {lim === 0 ? 'Unlimited' : `Up to ${lim}`}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">Services Catalog Limit</td>
                  {plans.map((p) => {
                    const lim = p.limits?.max_services ?? 30;
                    return (
                      <td key={p.id} className="py-3 px-4 text-center font-bold text-slate-700">
                        {lim === 0 ? 'Unlimited' : `Up to ${lim}`}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">WhatsApp Digital Invoices</td>
                  {plans.map((p) => {
                    const wa = p.limits?.wa_per_month ?? 0;
                    return (
                      <td key={p.id} className="py-3 px-4 text-center font-bold text-slate-700">
                        {wa === 0 ? '0 / month' : `${wa.toLocaleString('en-IN')} / month`}
                      </td>
                    );
                  })}
                </tr>
                {[
                  { label: 'Staff Commission Payroll & Reports', key: 'commission_report' },
                  { label: 'VIP Memberships & Package Passes', key: 'memberships' },
                  { label: 'Calendar View Appointment Grid', key: 'calendar_view' },
                  { label: 'Client Self-Service Reschedule / Cancel', key: 'customer_cancel' },
                  { label: 'Excel / CSV Data Export', key: 'export' },
                  { label: 'Promotional Coupons & Discounts', key: 'coupons' },
                  { label: 'Client Feedback & Google Reviews', key: 'reviews' },
                  { label: 'Loyalty Reward Points', key: 'loyalty' },
                  { label: 'Custom Domain Verification', key: 'custom_domain' },
                  { label: 'Multi-Branch Platform Management', key: 'multi_branch' },
                  { label: 'Dedicated Priority Support', key: 'priority_support' },
                ].map((feat) => (
                  <tr key={feat.key}>
                    <td className="py-3 px-4 font-semibold text-slate-800">{feat.label}</td>
                    {plans.map((p) => {
                      const enabled = Boolean(p.flags?.[feat.key]);
                      return (
                        <td key={p.id} className="py-3 px-4 text-center font-bold">
                          {enabled ? (
                            <span className="text-emerald-600 font-black">✅ Included</span>
                          ) : (
                            <span className="text-slate-400">❌</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Recent Subscription Invoices & Payment Receipts */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#b3135b]" />
                <span>Subscription Payment Invoices & Receipts</span>
              </h4>
              <p className="text-xs text-slate-500">
                Official transaction history with verified Razorpay payment IDs
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {pastPayments.length} Record{pastPayments.length === 1 ? '' : 's'}
            </span>
          </div>

          {pastPayments.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No previous Razorpay subscription payments recorded for this salon yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600">
                    <th className="py-3 px-4 font-bold">Date & Time</th>
                    <th className="py-3 px-4 font-bold">Plan Tier</th>
                    <th className="py-3 px-4 font-bold">Billing Interval</th>
                    <th className="py-3 px-4 font-bold">Amount</th>
                    <th className="py-3 px-4 font-bold">Razorpay Payment ID</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {new Date(pay.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{pay.plan_name}</td>
                      <td className="py-3 px-4 text-slate-600 uppercase font-semibold text-[10px]">
                        {pay.billing_interval}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {pay.razorpay_payment_id || pay.razorpay_order_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            pay.status === 'captured'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pay.status === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pay.status === 'captured' ? 'PAID' : pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
