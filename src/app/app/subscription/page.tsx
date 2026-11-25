'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { showToast } from '@/lib/toast';
import { generateUpiQrDataUrl, buildGPayUrl, buildPhonePeUrl, buildPaytmUrl, buildUpiPayUrl } from '@/lib/upi';
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
  Loader2,
  Calendar,
  Award,
  ArrowRight,
  ChevronRight,
  QrCode,
  Building,
  Smartphone,
  Copy,
  ExternalLink,
} from 'lucide-react';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
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
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Direct Bank & UPI Payment State
  const [showDirectPayModal, setShowDirectPayModal] = useState<{ plan: any; price: number } | null>(null);
  const [platformPaymentDetails, setPlatformPaymentDetails] = useState<Record<string, string>>({
    platform_upi_id: '8320653782@okaxis',
    platform_upi_number: '8320653782',
    platform_account_name: 'Avsar Suvagiya',
    platform_bank_name: 'State Bank of India',
    platform_account_number: 'XXXXXX1234',
    platform_ifsc_code: 'SBIN0001234',
    platform_support_whatsapp: '918320653782',
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dynamicPlatformQrUrl, setDynamicPlatformQrUrl] = useState<string | null>(null);

  // Auto-generate dynamic amount-locked QR for the selected subscription plan
  useEffect(() => {
    async function updatePlanQr() {
      if (showDirectPayModal && platformPaymentDetails.platform_upi_id) {
        try {
          const qrUrl = await generateUpiQrDataUrl({
            upiId: platformPaymentDetails.platform_upi_id,
            name: platformPaymentDetails.platform_account_name || 'StudioDesk Platform',
            amount: showDirectPayModal.price,
            note: `${showDirectPayModal.plan.name} Plan`,
          });
          setDynamicPlatformQrUrl(qrUrl);
        } catch {
          setDynamicPlatformQrUrl(null);
        }
      } else {
        setDynamicPlatformQrUrl(null);
      }
    }
    updatePlanQr();
  }, [showDirectPayModal, platformPaymentDetails]);

  // Auto-dismiss top notifications after 3 seconds and trigger global toast
  useEffect(() => {
    if (message) {
      showToast(message.text, message.type);
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Preload Razorpay checkout script on mount so first click opens instantly
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [subRes, plansRes, paymentsRes, bankRes] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/plans'),
        fetch('/api/subscription/payments'),
        fetch('/api/subscription/bank-details'),
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

      if (bankRes.ok) {
        const bankData = await bankRes.json();
        if (bankData.paymentDetails) {
          setPlatformPaymentDetails(bankData.paymentDetails);
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
    if (activatingPlanId) return; // Prevent double clicks
    setActivatingPlanId(planId);
    setMessage(null);

    try {
      /* =========================================================================
       * [RAZORPAY_TEMPORARILY_COMMENTED_OUT - 1 MONTH PAUSE]
       * Razorpay subscription activation is paused for 1 month per owner request.
       * Salons can use the "Direct UPI / Bank Transfer (0% Fee)" button.
       * To re-activate Razorpay checkout:
       *   1. Remove the notice and early return below
       *   2. Uncomment the Razorpay block below
       * ========================================================================= */
      setMessage({
        type: 'error',
        text: 'Online payment via Razorpay is temporarily paused. Please use "Direct UPI / Bank Transfer (0% Fee)" to upgrade your plan.',
      });
      setActivatingPlanId(null);
      return;

      /* [UNCOMMENT AFTER 1 MONTH TO RE-ENABLE RAZORPAY CHECKOUT]
      // 1. Ensure Razorpay script is ready
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
        name: 'StudioDesk Cloud ERP',
        description: `Plan: ${orderData.planName} (${interval === 'yearly' ? 'Annual Billing' : 'Monthly Billing'})`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.salonName || '',
          contact: orderData.salonPhone || '',
          email: orderData.salonEmail || '',
        },
        theme: {
          color: '#D4A77F',
        },
        modal: {
          ondismiss: function () {
            setActivatingPlanId(null);
          },
        },
        handler: async function (response: any) {
          // Immediately show verification loading state so user knows work is in progress
          setVerifyingPayment(true);
          setActivatingPlanId(null);

          try {
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
              setCelebrationData(verifyData);
              // Refresh subscription status immediately in background
              loadData();
            } else {
              setMessage({ type: 'error', text: verifyData.error || 'Payment signature verification failed.' });
              alert(verifyData.error || 'Payment verification failed.');
            }
          } catch (vErr: any) {
            setMessage({ type: 'error', text: vErr.message || 'Payment verification error.' });
            alert(vErr.message || 'Payment verification error.');
          } finally {
            setVerifyingPayment(false);
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
        setActivatingPlanId(null);
      });

      razorpay.open();
      [END OF RAZORPAY UNCOMMENT BLOCK] */
    } catch (err: any) {
      console.error('handleActivatePlan error:', err);
      const errMsg = err.message || 'Payment processing error.';
      setMessage({ type: 'error', text: errMsg });
      alert(errMsg);
      setActivatingPlanId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#D4A77F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-neutral-500">Loading your subscription status...</p>
      </div>
    );
  }

  const currentPlan = subscription?.currentPlan;
  const isTrial = subscription?.status === 'trial';
  const isActivePaid = subscription?.status === 'active' && !isTrial;
  const daysLeft = subscription?.daysRemaining ?? subscription?.subscriptionDaysRemaining ?? subscription?.trialDaysRemaining ?? 30;

  const validTillDate = isTrial
    ? (subscription?.trialEndsAt || subscription?.validTill)
    : (subscription?.subscriptionEndsAt || subscription?.validTill);

  const usage = subscription?.usage || {
    staffCount: 0,
    maxStaff: 3,
    servicesCount: 0,
    maxServices: 30,
    waMessagesCount: 0,
    maxWaMessages: 0,
    waSentThisMonth: 0,
    waLimit: 0,
  };

  const staffUnlimited = usage.maxStaff === 0;
  const staffPct = staffUnlimited ? 10 : Math.min(100, Math.round((Number(usage.staffCount || 0) / (usage.maxStaff || 1)) * 100));

  const servicesUnlimited = usage.maxServices === 0;
  const servicesPct = servicesUnlimited ? 10 : Math.min(100, Math.round((Number(usage.servicesCount || 0) / (usage.maxServices || 1)) * 100));

  const waCount = Number(usage.waMessagesCount ?? usage.waSentThisMonth ?? 0);
  const waLimit = Number(usage.maxWaMessages ?? usage.waLimit ?? 0);
  const waUnlimited = waLimit === 0 && currentPlan?.slug === 'premium';
  const waPct = waLimit === 0 ? 0 : Math.min(100, Math.round((waCount / waLimit) * 100));

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

      {/* Verifying Payment Fullscreen Spinner */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141926] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-neutral-100 dark:border-[#2A2F3A]">
            <div className="w-16 h-16 border-4 border-[#D4A77F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-1">Verifying Payment...</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Confirming transaction with Razorpay and unlocking all your plan facilities.
            </p>
            <div className="text-[11px] font-bold text-[#8C5E2E] dark:text-[#D4A77F] bg-[#D4A77F]/10 py-1 px-3 rounded-full inline-block">
              Please do not refresh this window
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Celebration Modal with Unlocked Facilities & 30-Day Validity */}
      {celebrationData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#141926] rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl border border-neutral-100 dark:border-[#2A2F3A] relative overflow-hidden">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              Payment Successful
            </span>

            <h3 className="text-2xl font-black text-neutral-900 dark:text-white mt-2">
              Welcome to {celebrationData.plan?.name || 'Pro'} Plan!
            </h3>

            {/* Exact Validity Date Badge */}
            <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50 via-pink-50 to-purple-50 dark:from-emerald-950/40 dark:via-pink-950/20 dark:to-purple-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <Calendar className="w-4 h-4" />
                  <span>Subscription Validity:</span>
                </span>
                <span className="text-emerald-900 dark:text-emerald-200 font-black">
                  {celebrationData.plan?.billingInterval === 'yearly' ? 'Full 365 Days Access' : 'Full 30 Days Access'}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                Active & valid till:{' '}
                <strong className="text-slate-900 dark:text-white font-bold">
                  {new Date(celebrationData.subscriptionEndsAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>
              {celebrationData.paymentId && (
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Razorpay Payment ID: {celebrationData.paymentId}
                </div>
              )}
            </div>

            {/* Unlocked Facilities Section */}
            <div className="mt-5 text-left">
              <div className="text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A77F]" />
                <span>Your Unlocked Facilities & Capacity</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#10141F] border border-slate-100 dark:border-[#2A2F3A] text-xs">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 font-black" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Stylists Capacity: {celebrationData.plan?.limits?.max_staff === 0 ? 'Unlimited Staff' : `Up to ${celebrationData.plan?.limits?.max_staff || 10} Staff Members`}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                  <span className="font-bold text-slate-800">
                    Services Catalog: {celebrationData.plan?.limits?.max_services === 0 ? 'Unlimited Services' : `Up to ${celebrationData.plan?.limits?.max_services || 100} Services`}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                  <span className="font-bold text-slate-800">
                    WhatsApp Invoices: {celebrationData.plan?.limits?.wa_per_month ? `${celebrationData.plan.limits.wa_per_month} Messages / Month` : 'Instant Digital Receipt Links'}
                  </span>
                </div>

                {(Array.isArray(celebrationData.plan?.features) ? celebrationData.plan.features : []).map((feat: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-1.5 text-xs text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCelebrationData(null);
                loadData();
              }}
              className="w-full mt-6 py-3.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold font-extrabold text-xs shadow-lg shadow-[#D4A77F]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Continue to Salon Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header & Active Plan Status Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1F2937] via-[#3d1538] to-[#1a0a1f] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-pink-900/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A77F]/100/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D4A77F]/100/20 text-pink-300 border border-pink-500/30">
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
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-[260px]">
            <div className="text-[10px] uppercase font-bold text-pink-200/80 tracking-wider mb-1">
              Active Tier
            </div>
            <div className="text-2xl font-black text-white flex items-center gap-2">
              <span>{currentPlan?.name || (isActivePaid ? 'Pro Plan' : 'Pro (7-Day Trial)')}</span>
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-pink-200/70">Status:</span>
              <span
                className={`font-black uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded-full ${
                  isActivePaid
                    ? 'bg-emerald-400/25 text-emerald-300 border border-emerald-400/40'
                    : isTrial
                    ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                    : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {isActivePaid
                  ? `ACTIVE (${daysLeft}D LEFT)`
                  : isTrial
                  ? `TRIAL (${subscription?.trialDaysRemaining ?? 7}D LEFT)`
                  : 'EXPIRED'}
              </span>
            </div>

            {validTillDate && (
              <div className="text-[10px] text-pink-200/80 mt-2 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                <span>
                  {isTrial ? 'Trial ends on ' : 'Valid till '}
                  <strong className="text-white font-bold">
                    {new Date(validTillDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>
                  {isActivePaid && ` (${daysLeft} days remaining)`}
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
            <h3 className="text-lg font-black text-[#1F2937] dark:text-white">Resource Consumption & Limits</h3>
            <p className="text-xs text-neutral-500">Live tracker for current monthly billing cycle</p>
          </div>
          <span className="text-xs font-bold text-neutral-400">
            Cycle: {usage.period || new Date().toISOString().slice(0, 7)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Staff Limit */}
          <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200/90 dark:border-[#2A2F3A] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D4A77F]/10 text-[#8C5E2E] dark:text-[#D4A77F] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Stylists & Staff</span>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {usage.staffCount} / {staffUnlimited ? '∞' : usage.maxStaff}
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 my-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  staffUnlimited ? 'bg-[#D4A77F]/100' : staffPct >= 90 ? 'bg-amber-500' : 'bg-[#D4A77F]'
                }`}
                style={{ width: `${staffPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{staffUnlimited ? 'Unlimited stylists allowed' : `${Math.max(0, usage.maxStaff - usage.staffCount)} slots remaining`}</span>
              <span className="font-bold">{staffUnlimited ? 'Unlimited' : `${staffPct}%`}</span>
            </div>
          </div>

          {/* Services Catalog Limit */}
          <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200/90 dark:border-[#2A2F3A] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Services Catalog</span>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {usage.servicesCount} / {servicesUnlimited ? '∞' : usage.maxServices}
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 my-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  servicesUnlimited ? 'bg-purple-500' : servicesPct >= 90 ? 'bg-amber-500' : 'bg-purple-600'
                }`}
                style={{ width: `${servicesPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>{servicesUnlimited ? 'Unlimited catalog size' : `${Math.max(0, usage.maxServices - usage.servicesCount)} services remaining`}</span>
              <span className="font-bold">{servicesUnlimited ? 'Unlimited' : `${servicesPct}%`}</span>
            </div>
          </div>

          {/* WhatsApp Invoices Limit */}
          <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200/90 dark:border-[#2A2F3A] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">WhatsApp This Month</span>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {waCount} / {waUnlimited ? '∞' : waLimit}
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 my-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  waUnlimited ? 'bg-emerald-500' : waLimit === 0 ? 'bg-slate-300' : waPct >= 90 ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${waUnlimited ? 10 : waLimit === 0 ? 0 : waPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>
                {waLimit === 0 && !waUnlimited
                  ? 'No WhatsApp included (Upgrade to Pro)'
                  : waUnlimited
                  ? 'Unlimited WhatsApp messages'
                  : `${Math.max(0, waLimit - waCount)} messages remaining`}
              </span>
              <span className="font-bold">{waLimit === 0 ? '0%' : `${waPct}%`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Three SaaS Plans & Comparison Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-[#1F2937] dark:text-white">
              Explore Subscription Plans
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Upgrade anytime with instant Razorpay checkout (UPI, QR Code, Cards & Netbanking).
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center gap-3 bg-white dark:bg-[#141926] px-4 py-2 rounded-2xl border border-slate-200 dark:border-[#2A2F3A] shadow-xs self-start sm:self-auto">
            <span className={`text-xs font-bold ${interval === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setInterval(interval === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full p-0.5 transition-colors relative cursor-pointer"
              style={{ backgroundColor: interval === 'yearly' ? '#D4A77F' : undefined }}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  interval === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${interval === 'yearly' ? 'text-[#8C5E2E] dark:text-[#D4A77F]' : 'text-slate-500 dark:text-slate-400'}`}>
                Yearly
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
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
            const isThisActivating = activatingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-[#141926] rounded-3xl p-6 sm:p-7 border transition-all flex flex-col justify-between ${
                  isCurrent && isActivePaid
                    ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : isPopular
                    ? 'border-[#D4A77F] shadow-xl ring-2 ring-pink-500/20'
                    : 'border-neutral-200 dark:border-[#2A2F3A] shadow-xs hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                {/* Popular / Current Badges */}
                {isCurrent && isActivePaid && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                    Current Active Plan
                  </div>
                )}
                {!isCurrent && isPopular && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D4A77F] text-[#080B12] font-bold shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {plan.name} Tier
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{plan.name}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 min-h-[32px]">{plan.description}</p>

                  <div className="my-5 pb-5 border-b border-neutral-100 dark:border-[#2A2F3A]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        ₹{Number(price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-bold text-neutral-400">
                        /{interval === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {interval === 'yearly' && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                        Equivalent to ₹{Math.round(price / 12).toLocaleString('en-IN')}/month
                      </div>
                    )}
                  </div>

                  {/* Limits bullets */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Users className="w-4 h-4 text-[#8C5E2E] dark:text-[#D4A77F] shrink-0" />
                      <span>
                        {plan.limits?.max_staff === 0 ? 'Unlimited Staff' : `Up to ${plan.limits?.max_staff || 3} Staff Members`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Scissors className="w-4 h-4 text-[#8C5E2E] dark:text-[#D4A77F] shrink-0" />
                      <span>
                        {plan.limits?.max_services === 0 ? 'Unlimited Services' : `Up to ${plan.limits?.max_services || 30} Services`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <MessageSquare className="w-4 h-4 text-[#8C5E2E] dark:text-[#D4A77F] shrink-0" />
                      <span>
                        {(plan.limits?.wa_per_month || 0) === 0 ? '0 WhatsApp Invoices' : `${plan.limits.wa_per_month} WhatsApp/mo`}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 border-t border-neutral-100 dark:border-[#2A2F3A] pt-4">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feat: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {/* Option A: Direct Bank / UPI (0% Fee) */}
                  <button
                    type="button"
                    onClick={() => setShowDirectPayModal({ plan, price })}
                    disabled={isCurrent && isActivePaid}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 ${
                      isCurrent && isActivePaid
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                        : 'bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12]'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Direct UPI / Bank Transfer (0% Fee)</span>
                  </button>

                  {/* Option B: Razorpay (Cards / NetBanking) - COMMENTED OUT FOR 1 MONTH */}
                  {/* To re-activate Razorpay checkout button after 1 month, uncomment the block below:
                  <button
                    type="button"
                    onClick={() => handleActivatePlan(plan.id)}
                    disabled={Boolean(activatingPlanId) || (isCurrent && isActivePaid)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border shadow-xs cursor-pointer active:scale-95 ${
                      isCurrent && isActivePaid
                        ? 'border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed'
                        : isThisActivating
                        ? 'bg-neutral-800 text-white cursor-wait opacity-80'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10141F] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1C2230]'
                    }`}
                  >
                    {isThisActivating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
                        <span>Opening Gateway...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Pay via Razorpay / Card</span>
                      </>
                    )}
                  </button>
                  */}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Detailed Feature Comparison Matrix */}
        <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200/90 dark:border-[#2A2F3A] overflow-hidden shadow-xs mb-8">
          <div className="p-5 bg-slate-50 dark:bg-[#10141F] border-b border-slate-200 dark:border-[#2A2F3A]">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Detailed Plan Feature Matrix
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Side-by-side comparison of limits and server-side feature access
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#2A2F3A] bg-slate-50/50 dark:bg-[#10141F]">
                  <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Capabilities</th>
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
                          isPopular ? 'text-[#8C5E2E] dark:text-[#D4A77F] bg-[#D4A77F]/15' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {p.name} (₹{price.toLocaleString('en-IN')})
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2A2F3A]">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Stylists & Staff Capacity</td>
                  {plans.map((p) => {
                    const lim = p.limits?.max_staff ?? p.max_staff ?? 3;
                    return (
                      <td key={p.id} className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {lim === 0 ? 'Unlimited' : `Up to ${lim}`}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Services Catalog Limit</td>
                  {plans.map((p) => {
                    const lim = p.limits?.max_services ?? 30;
                    return (
                      <td key={p.id} className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {lim === 0 ? 'Unlimited' : `Up to ${lim}`}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">WhatsApp Digital Invoices</td>
                  {plans.map((p) => {
                    const wa = p.limits?.wa_per_month ?? 0;
                    return (
                      <td key={p.id} className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
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
                  { label: 'Loyalty Reward Points', key: 'loyalty' },
                  { label: 'Custom Salon Branding & Logo', key: 'logo_upload' },
                  { label: 'Multi-Branch Platform Management', key: 'multi_branch' },
                  { label: 'Dedicated Priority Support', key: 'priority_support' },
                ].map((feat) => (
                  <tr key={feat.key}>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{feat.label}</td>
                    {plans.map((p) => {
                      const enabled = Boolean(p.flags?.[feat.key]);
                      return (
                        <td key={p.id} className="py-3 px-4 text-center font-bold">
                          {enabled ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">✅ Included</span>
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
        <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200/90 dark:border-[#2A2F3A] overflow-hidden shadow-xs">
          <div className="p-5 bg-slate-50 dark:bg-[#10141F] border-b border-slate-200 dark:border-[#2A2F3A] flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#8C5E2E] dark:text-[#D4A77F]" />
                <span>Subscription Payment Invoices & Receipts</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
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
                  <tr className="border-b border-slate-200 dark:border-[#2A2F3A] bg-slate-50/50 dark:bg-[#10141F] text-slate-600 dark:text-slate-400">
                    <th className="py-3 px-4 font-bold">Date & Time</th>
                    <th className="py-3 px-4 font-bold">Plan Tier</th>
                    <th className="py-3 px-4 font-bold">Billing Interval</th>
                    <th className="py-3 px-4 font-bold">Amount</th>
                    <th className="py-3 px-4 font-bold">Razorpay Payment ID</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2A2F3A]">
                  {pastPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C2230]">
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {new Date(pay.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{pay.plan_name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[10px]">
                        {pay.billing_interval}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {pay.razorpay_payment_id || pay.razorpay_order_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            pay.status === 'captured'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                              : pay.status === 'failed'
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
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

      {/* ================= DIRECT BANK / UPI PAYMENT MODAL ================= */}
      {showDirectPayModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50">
          <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-lg w-full my-auto overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-[#2A2F3A] flex items-center justify-between bg-neutral-50/50 dark:bg-[#10141F]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C5E2E] dark:text-[#D4A77F] px-2 py-0.5 rounded-full bg-[#D4A77F]/10 border border-[#D4A77F]/30">
                  Zero Fee Payment
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Pay via Direct UPI or Bank Transfer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectPayModal(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto touch-scroll text-xs">
              {/* Plan Summary Card */}
              <div className="p-3.5 rounded-2xl bg-[#D4A77F]/10 border border-[#D4A77F]/30 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Selected Plan:</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {showDirectPayModal.plan.name} ({interval === 'yearly' ? 'Annual Billing' : 'Monthly Billing'})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Payable Amount:</p>
                  <p className="text-lg font-black text-[#8C5E2E] dark:text-[#D4A77F]">
                    ₹{Number(showDirectPayModal.price).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* UPI Option */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Smartphone className="w-4 h-4 text-[#8C5E2E] dark:text-[#D4A77F]" />
                  <span>Option 1: Scan &amp; Pay with Any UPI App</span>
                </div>

                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] bg-neutral-50/50 dark:bg-[#10141F] flex flex-col sm:flex-row items-center gap-4">
                  {dynamicPlatformQrUrl || platformPaymentDetails.platform_upi_qr_url ? (
                    <div className="w-36 h-36 bg-white p-2 rounded-2xl border-2 border-emerald-500/40 shrink-0 shadow-sm flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dynamicPlatformQrUrl || platformPaymentDetails.platform_upi_qr_url || ''}
                        alt="Platform Admin UPI QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#141926] flex flex-col items-center justify-center text-center p-2 shrink-0">
                      <QrCode className="w-10 h-10 text-[#D4A77F] mb-1" />
                      <span className="text-[10px] text-neutral-400">UPI Instant</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 inline-block mb-1">
                      Auto-Locked Amount: ₹{Number(showDirectPayModal.price).toLocaleString('en-IN')}
                    </span>
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Platform UPI ID:</span>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                        <span className="font-mono font-black text-sm text-[#8C5E2E] dark:text-[#D4A77F] bg-[#D4A77F]/10 px-2 py-0.5 rounded-lg">
                          {platformPaymentDetails.platform_upi_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(platformPaymentDetails.platform_upi_id);
                            setCopiedKey('upi');
                            setTimeout(() => setCopiedKey(null), 2000);
                          }}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md cursor-pointer transition-colors"
                          title="Copy UPI ID"
                        >
                          {copiedKey === 'upi' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-neutral-500" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block">PhonePe / GPay Number:</span>
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {platformPaymentDetails.platform_upi_number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-Tap App Deep Link Buttons for Mobile/Tablet */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#10141F] border border-neutral-200 dark:border-[#2A2F3A] space-y-2">
                  <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200 block">
                    ⚡ 1-Tap Open Payment App on Your Phone:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <a
                      href={buildGPayUrl({
                        upiId: platformPaymentDetails.platform_upi_id,
                        name: platformPaymentDetails.platform_account_name || 'StudioDesk Platform',
                        amount: showDirectPayModal.price,
                        note: `${showDirectPayModal.plan.name} Plan`,
                      })}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-[#1C2230] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:border-[#D4A77F] transition-all shadow-2xs cursor-pointer"
                    >
                      <span className="text-blue-500 font-black">G</span>Pay
                    </a>
                    <a
                      href={buildPhonePeUrl({
                        upiId: platformPaymentDetails.platform_upi_id,
                        name: platformPaymentDetails.platform_account_name || 'StudioDesk Platform',
                        amount: showDirectPayModal.price,
                        note: `${showDirectPayModal.plan.name} Plan`,
                      })}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-[#1C2230] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:border-[#D4A77F] transition-all shadow-2xs cursor-pointer"
                    >
                      <span className="text-purple-600 font-black">पे</span> PhonePe
                    </a>
                    <a
                      href={buildPaytmUrl({
                        upiId: platformPaymentDetails.platform_upi_id,
                        name: platformPaymentDetails.platform_account_name || 'StudioDesk Platform',
                        amount: showDirectPayModal.price,
                        note: `${showDirectPayModal.plan.name} Plan`,
                      })}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-[#1C2230] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:border-[#D4A77F] transition-all shadow-2xs cursor-pointer"
                    >
                      <span className="text-sky-500 font-black">Pay</span>tm
                    </a>
                    <a
                      href={buildUpiPayUrl({
                        upiId: platformPaymentDetails.platform_upi_id,
                        name: platformPaymentDetails.platform_account_name || 'StudioDesk Platform',
                        amount: showDirectPayModal.price,
                        note: `${showDirectPayModal.plan.name} Plan`,
                      })}
                      className="px-3 py-2 rounded-xl bg-[#D4A77F]/15 border border-[#D4A77F]/40 text-[#8C5E2E] dark:text-[#D4A77F] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#D4A77F]/25 transition-all shadow-2xs cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Any UPI</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Bank Transfer Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Building className="w-4 h-4 text-[#8C5E2E] dark:text-[#D4A77F]" />
                  <span>Option 2: Direct IMPS / NEFT Bank Transfer</span>
                </div>

                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] bg-neutral-50/50 dark:bg-[#10141F] space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-[#2A2F3A]">
                    <span className="text-neutral-500">Account Holder Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {platformPaymentDetails.platform_account_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-[#2A2F3A]">
                    <span className="text-neutral-500">Bank Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {platformPaymentDetails.platform_bank_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-[#2A2F3A]">
                    <span className="text-neutral-500">Account Number:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {platformPaymentDetails.platform_account_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(platformPaymentDetails.platform_account_number);
                          setCopiedKey('acc');
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedKey === 'acc' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-neutral-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">IFSC Code:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {platformPaymentDetails.platform_ifsc_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(platformPaymentDetails.platform_ifsc_code);
                          setCopiedKey('ifsc');
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md cursor-pointer"
                        title="Copy IFSC Code"
                      >
                        {copiedKey === 'ifsc' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-neutral-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action: Send WhatsApp Confirmation */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/${platformPaymentDetails.platform_support_whatsapp || '918320653782'}?text=${encodeURIComponent(
                    `Hi, I have completed direct payment of ₹${showDirectPayModal.price} for the ${showDirectPayModal.plan.name} (${interval}) on StudioDesk. Please verify and activate my subscription!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>I Have Paid — Send Screenshot on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[11px] text-center text-neutral-400 mt-2">
                  Once our team confirms your transaction screenshot, your plan will be active within minutes!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
