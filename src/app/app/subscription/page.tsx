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
  Calendar,
  Building2,
  ArrowRight,
} from 'lucide-react';

export default function SalonSubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        alert(data.error || 'Failed to process payment.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-black uppercase tracking-wider text-pink-600">
          Billing & Workspace Plan
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2a1630] tracking-tight">
          Subscription & Free Trial Status
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Manage your cloud workspace tier, 7-day trial, and renewal options
        </p>
      </div>

      {paymentSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Payment verified successfully! Your salon workspace plan is now active.</span>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white flex items-center justify-center shadow-md shadow-pink-900/10">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block mb-0.5">
                Current Plan
              </span>
              <h2 className="text-xl font-black text-[#2a1630]">
                {subscription?.currentPlan?.name || (subscription?.isTrial ? '7-Day Free Trial' : 'Standard Workspace')}
              </h2>
              <span className="text-xs text-neutral-500">
                {subscription?.currentPlan ? `₹${Number(subscription.currentPlan.price).toLocaleString()} / ${subscription.currentPlan.interval}` : 'Free Evaluation Period'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {subscription?.status === 'active' ? (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Subscription Active</span>
              </span>
            ) : subscription?.isTrialExpired ? (
              <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-black flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>7-Day Trial Expired</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-black flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-600 animate-pulse" />
                <span>Trial Active ({subscription?.trialDaysRemaining} days remaining)</span>
              </span>
            )}
          </div>
        </div>

        {/* Trial Days Countdown Banner */}
        {subscription?.isTrial && (
          <div className="mt-5 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-purple-600 shrink-0" />
              <span>
                Your 7-day evaluation period is active until{' '}
                <strong>
                  {subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '7 days'}
                </strong>
                . After 7 days, select a plan below to keep using online bookings and WhatsApp invoices.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Available Plans Section */}
      <div>
        <h3 className="text-lg font-black text-[#2a1630] mb-2">
          Available Subscription Plans
        </h3>
        <p className="text-xs text-neutral-500 mb-6">
          Upgrade or renew your salon plan with 1-click instant UPI or card activation
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`bg-white rounded-3xl border-2 transition-all p-6 flex flex-col justify-between shadow-xs cursor-pointer relative ${
                  isSelected
                    ? 'border-[#b3135b] ring-4 ring-pink-50 shadow-md'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {plan.is_popular && (
                  <span className="absolute -top-3 right-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                    Most Popular
                  </span>
                )}

                <div>
                  <h4 className="font-extrabold text-[#2a1630] text-lg mb-1">{plan.name}</h4>
                  <p className="text-xs text-neutral-500 mb-4 min-h-[32px]">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-black text-[#2a1630]">
                      ₹{Number(plan.price).toLocaleString()}
                    </span>
                    <span className="text-xs text-neutral-500 ml-1">
                      /{plan.billing_interval}
                    </span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivatePlan(plan.id);
                  }}
                  disabled={activating}
                  className={`w-full mt-6 py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                    isSelected
                      ? 'bg-[#b3135b] hover:bg-[#9c0f4e] text-white shadow-pink-900/20'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{activating && isSelected ? 'Activating Plan...' : `Select & Activate (₹${Number(plan.price).toLocaleString()})`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
