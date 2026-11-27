'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Scissors,
  Receipt,
  Calendar,
  CreditCard,
  Clock,
  Zap,
  Check,
  X,
  Eye,
  EyeOff,
  QrCode,
  Smartphone,
  Building,
  Copy,
  MessageSquare,
} from 'lucide-react';

import ThemeToggle from '@/components/landing/ThemeToggle';
import { generateUpiQrDataUrl, buildGPayUrl, buildPhonePeUrl, buildPaytmUrl, buildUpiPayUrl } from '@/lib/upi';

const PLATFORM_PAYMENT_DETAILS = {
  platform_upi_id: '8320653782@okaxis',
  platform_upi_number: '8320653782',
  platform_account_name: 'Avsar Suvagiya',
  platform_bank_name: 'State Bank of India',
  platform_account_number: 'XXXXXX1234',
  platform_ifsc_code: 'SBIN0001234',
  platform_support_whatsapp: '918320653782',
};

export default function RegisterSalonPage() {
  const router = useRouter();

  const [salonName, setSalonName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Plans & Trial State
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('trial'); // 'trial' or plan.id
  const [registeredPlanName, setRegisteredPlanName] = useState<string>('7-Day Free Trial');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSalon, setRegisteredSalon] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Direct UPI & Google Pay Payment State
  const [showPaymentModal, setShowPaymentModal] = useState<{
    salon: { id: string; name: string; slug: string };
    plan: any;
    price: number;
  } | null>(null);
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function makeQr() {
      if (showPaymentModal && showPaymentModal.price > 0) {
        try {
          const qr = await generateUpiQrDataUrl({
            upiId: PLATFORM_PAYMENT_DETAILS.platform_upi_id,
            name: PLATFORM_PAYMENT_DETAILS.platform_account_name || 'StudioDesk Platform',
            amount: showPaymentModal.price,
            note: `${showPaymentModal.plan?.name || 'StudioDesk'} Plan`,
          });
          setDynamicQrUrl(qr);
        } catch {
          setDynamicQrUrl(null);
        }
      }
    }
    makeQr();
  }, [showPaymentModal]);

  useEffect(() => {
    // 1. Fetch available plans from DB
    async function loadPlans() {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        }
      } catch {}
    }
    loadPlans();

    // 2. Preload Razorpay Checkout SDK for instant gateway launch
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Computed slug preview
  const slugPreview = salonName
    ? salonName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : 'your-salon';

  async function handleRegisterAndPay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!salonName.trim() || !ownerName.trim() || !mobile.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to register.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create account & salon workspace
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonName,
          ownerName,
          email,
          mobile,
          city,
          password,
          confirmPassword,
          planId: selectedPlanId === 'trial' ? null : selectedPlanId,
        }),
      });

      let regData: any = {};
      try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          regData = await res.json();
        } else {
          const text = await res.text();
          regData = { error: text || 'Server returned an invalid response' };
        }
      } catch {
        regData = { error: 'Database / server error. Please try again.' };
      }

      if (!res.ok) {
        throw new Error(regData.error || 'Registration failed. Please try again.');
      }

      // If user selected Free Trial, complete immediately!
      if (selectedPlanId === 'trial') {
        setRegisteredSalon(regData.salon);
        setRegisteredPlanName('7-Day Free Trial');
        setShowPaymentModal(null);
        setLoading(false);
        return;
      }

      // 2. Paid Plan selected: Trigger Direct UPI / Google Pay Payment Step!
      const chosenPlan = plans.find((p) => p.id === selectedPlanId);
      const chosenPlanName = chosenPlan?.name || 'Selected Plan';
      const chosenPrice = Number(chosenPlan?.price || 0);

      setRegisteredSalon(regData.salon);
      setRegisteredPlanName(chosenPlanName);
      setShowPaymentModal({
        salon: regData.salon,
        plan: chosenPlan,
        price: chosenPrice,
      });
      setLoading(false);
      return;

      /* =========================================================================
       * [RAZORPAY_TEMPORARILY_COMMENTED_OUT - 1 MONTH PAUSE]
       * Razorpay subscription payment during registration is paused for 1 month.
       * New salons pay via Direct UPI / Google Pay or get immediate access.
       * To re-activate Razorpay checkout after 1 month:
       *   1. Remove the Direct UPI trigger above
       *   2. Uncomment the Razorpay block below
       * ========================================================================= */

      /* [UNCOMMENT AFTER 1 MONTH TO RE-ENABLE RAZORPAY CHECKOUT]
      const orderRes = await fetch('/api/subscription/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          interval: 'monthly',
        }),
      });

      let orderData: any = {};
      try {
        orderData = await orderRes.json();
      } catch {}

      if (!orderRes.ok || !orderData.orderId) {
        // If gateway order creation failed, salon is still safely created on trial
        console.warn('Could not initiate gateway order:', orderData?.error);
        setRegisteredSalon(regData.salon);
        setRegisteredPlanName('7-Day Free Trial');
        setError('Salon registered! Online payment gateway is currently updating. You can explore your dashboard on a 7-day trial and complete payment in Settings.');
        setLoading(false);
        return;
      }

      // 3. Open native Razorpay modal
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        setRegisteredSalon(regData.salon);
        setRegisteredPlanName('7-Day Free Trial');
        setLoading(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'StudioDesk Cloud ERP',
        description: `${chosenPlanName} Subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: ownerName,
          email: email,
          contact: mobile,
        },
        theme: {
          color: '#D4A77F',
        },
        handler: async function (response: any) {
          setLoading(true);
          try {
            const verifyRes = await fetch('/api/subscription/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setRegisteredPlanName(chosenPlanName);
              setRegisteredSalon(regData.salon);
            } else {
              setError(verifyData.error || 'Payment received. System is verifying your invoice.');
              setRegisteredPlanName(chosenPlanName);
              setRegisteredSalon(regData.salon);
            }
          } catch {
            setRegisteredPlanName(chosenPlanName);
            setRegisteredSalon(regData.salon);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            // Salon created safely, trial active
            setRegisteredPlanName('7-Day Free Trial (Upgrade anytime)');
            setRegisteredSalon(regData.salon);
            setLoading(false);
          },
        },
      });

      rzp.on('payment.failed', function (resp: any) {
        console.error('Payment failed:', resp.error);
        setError(resp.error?.description || 'Payment was declined. You can retry inside your salon settings.');
        setRegisteredSalon(regData.salon);
        setRegisteredPlanName('7-Day Free Trial (Upgrade anytime)');
        setLoading(false);
      });

      rzp.open();
      [END OF RAZORPAY UNCOMMENT BLOCK] */
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your details.');
      setLoading(false);
    }
  }

  // ================= SUCCESS / PAYMENT STATE =================
  if (registeredSalon) {
    if (showPaymentModal) {
      return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] flex items-center justify-center p-3 sm:p-6 py-10 transition-colors">
          <div className="w-full max-w-xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-in space-y-5">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D4A77F] to-amber-300 text-[#080B12] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#D4A77F]/20">
                <QrCode className="w-8 h-8" />
              </div>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] border border-[#D4A77F]/30 inline-block mb-1">
                Zero Gateway Fee · Instant Activation
              </span>
              <h1 className="text-2xl font-black text-[#1F2937] dark:text-white">
                Complete Payment via UPI / Google Pay
              </h1>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">
                Welcome, <strong className="text-[#1F2937] dark:text-white">{ownerName}</strong>! Your salon <strong className="text-[#1F2937] dark:text-white">{registeredSalon.name}</strong> is created. Pay below to activate your plan.
              </p>
            </div>

            {/* Plan Summary Card */}
            <div className="p-4 rounded-2xl bg-[#D4A77F]/10 border border-[#D4A77F]/30 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Selected Plan:</p>
                <p className="text-sm font-black text-[#1F2937] dark:text-white">
                  👑 {showPaymentModal.plan?.name || registeredPlanName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Payable Amount:</p>
                <p className="text-xl font-black text-[#8C5E2E] dark:text-[#D4A77F]">
                  ₹{Number(showPaymentModal.price).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Option 1: Dynamic QR Code & UPI details */}
            <div className="p-4 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F9FAFB] dark:bg-[#10141F] space-y-4">
              <div className="flex items-center gap-2 font-bold text-xs text-[#1F2937] dark:text-white">
                <Smartphone className="w-4 h-4 text-[#D4A77F]" />
                <span>Option 1: Scan &amp; Pay with Any UPI App</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {dynamicQrUrl ? (
                  <div className="w-36 h-36 bg-white p-2 rounded-2xl border-2 border-emerald-500/40 shrink-0 shadow-sm flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dynamicQrUrl}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#141926] flex flex-col items-center justify-center text-center p-2 shrink-0">
                    <QrCode className="w-8 h-8 text-[#D4A77F] mb-1 animate-pulse" />
                    <span className="text-[10px] text-neutral-400">Loading QR...</span>
                  </div>
                )}

                <div className="space-y-2 flex-1 w-full text-center sm:text-left text-xs">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 inline-block mb-0.5">
                    Amount Locked: ₹{Number(showPaymentModal.price).toLocaleString('en-IN')}
                  </span>
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Platform UPI ID:</span>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                      <span className="font-mono font-black text-xs text-[#8C5E2E] dark:text-[#D4A77F] bg-[#D4A77F]/10 px-2 py-0.5 rounded-lg">
                        {PLATFORM_PAYMENT_DETAILS.platform_upi_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(PLATFORM_PAYMENT_DETAILS.platform_upi_id);
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
                    <span className="font-mono font-bold text-xs text-[#1F2937] dark:text-white">
                      {PLATFORM_PAYMENT_DETAILS.platform_upi_number}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1-Tap Deep Link Buttons for Mobile */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block">
                  ⚡ 1-Tap Open Payment App on Your Phone:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={buildGPayUrl({
                      upiId: PLATFORM_PAYMENT_DETAILS.platform_upi_id,
                      name: PLATFORM_PAYMENT_DETAILS.platform_account_name,
                      amount: showPaymentModal.price,
                      note: `${showPaymentModal.plan?.name || 'StudioDesk'} Plan`,
                    })}
                    className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#141926] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:border-[#D4A77F] transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <span className="text-blue-500 font-black">G</span>Pay
                  </a>
                  <a
                    href={buildPhonePeUrl({
                      upiId: PLATFORM_PAYMENT_DETAILS.platform_upi_id,
                      name: PLATFORM_PAYMENT_DETAILS.platform_account_name,
                      amount: showPaymentModal.price,
                      note: `${showPaymentModal.plan?.name || 'StudioDesk'} Plan`,
                    })}
                    className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#141926] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:border-[#D4A77F] transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <span className="text-purple-600 font-black">पे</span> PhonePe
                  </a>
                  <a
                    href={buildPaytmUrl({
                      upiId: PLATFORM_PAYMENT_DETAILS.platform_upi_id,
                      name: PLATFORM_PAYMENT_DETAILS.platform_account_name,
                      amount: showPaymentModal.price,
                      note: `${showPaymentModal.plan?.name || 'StudioDesk'} Plan`,
                    })}
                    className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#141926] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:border-[#D4A77F] transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <span className="text-sky-500 font-black">Pay</span>tm
                  </a>
                  <a
                    href={buildUpiPayUrl({
                      upiId: PLATFORM_PAYMENT_DETAILS.platform_upi_id,
                      name: PLATFORM_PAYMENT_DETAILS.platform_account_name,
                      amount: showPaymentModal.price,
                      note: `${showPaymentModal.plan?.name || 'StudioDesk'} Plan`,
                    })}
                    className="px-2.5 py-2 rounded-xl bg-[#D4A77F]/15 border border-[#D4A77F]/40 text-[#8C5E2E] dark:text-[#D4A77F] font-extrabold text-xs flex items-center justify-center gap-1 hover:bg-[#D4A77F]/25 transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Any UPI</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Option 2: Bank NEFT / IMPS Transfer Details */}
            <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] bg-neutral-50/50 dark:bg-[#10141F] space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-300">
                <Building className="w-3.5 h-3.5 text-[#D4A77F]" />
                <span>Option 2: Direct IMPS / NEFT Bank Transfer</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-300 pt-1">
                <div>
                  <span className="text-neutral-400 block text-[10px]">Account Name:</span>
                  <span className="font-bold">{PLATFORM_PAYMENT_DETAILS.platform_account_name}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Bank:</span>
                  <span className="font-bold">{PLATFORM_PAYMENT_DETAILS.platform_bank_name}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Account Number:</span>
                  <span className="font-mono font-bold">{PLATFORM_PAYMENT_DETAILS.platform_account_number}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">IFSC Code:</span>
                  <span className="font-mono font-bold">{PLATFORM_PAYMENT_DETAILS.platform_ifsc_code}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <a
                href={`https://wa.me/${PLATFORM_PAYMENT_DETAILS.platform_support_whatsapp || '918320653782'}?text=${encodeURIComponent(
                  `Hi, I have registered my salon "${salonName || registeredSalon.name}" and completed payment of ₹${showPaymentModal.price} for the ${showPaymentModal.plan?.name || registeredPlanName} plan on StudioDesk. Please verify and activate my subscription!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>I Have Paid — Send Screenshot on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push('/app')}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  <span>Launch Salon Dashboard ➔</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="py-3 px-4 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#1F2937] dark:text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  <span>View Booking Details</span>
                </button>
              </div>

              <p className="text-[10px] text-center text-neutral-400">
                Your salon workspace is already provisioned. You can explore your dashboard immediately while payment verification completes!
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-8 sm:p-10 shadow-2xl text-center animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-block mb-3">
            Salon Registered Successfully!
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#1F2937] dark:text-white">
            Welcome, {ownerName}!
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] mt-2 max-w-md mx-auto">
            <strong className="text-[#1F2937] dark:text-white">{registeredSalon.name}</strong> is now live on StudioDesk Cloud. Your cloud POS, staff scheduler, and online booking engine are ready.
          </p>

          <div className="mt-4 p-3 rounded-2xl bg-[#D4A77F]/10 border border-[#D4A77F]/30 text-xs font-bold text-[#8C5E35] dark:text-[#D4A77F] flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4A77F]" />
            <span>
              {registeredPlanName === '7-Day Free Trial'
                ? '🎁 7-Day Free Trial Active (Full access until 7 days)'
                : `👑 ${registeredPlanName} Subscription`}
            </span>
          </div>

          {registeredPlanName !== '7-Day Free Trial' && (
            <button
              type="button"
              onClick={() => {
                const chosenPlan = plans.find((p) => p.id === selectedPlanId);
                setShowPaymentModal({
                  salon: registeredSalon,
                  plan: chosenPlan,
                  price: Number(chosenPlan?.price || 0),
                });
              }}
              className="mt-3 w-full py-2.5 rounded-xl bg-[#D4A77F]/15 border border-[#D4A77F]/40 text-[#8C5E2E] dark:text-[#D4A77F] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-[#D4A77F]/25 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Pay via UPI / Google Pay (Scan QR)</span>
            </button>
          )}

          <div className="mt-6 p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] text-left">
            <div className="text-[11px] font-bold text-[#D4A77F] uppercase tracking-wider mb-1">
              Your Public Booking Link:
            </div>
            <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#141926] px-3 py-2 rounded-xl border border-[#D4A77F]/30 text-xs font-mono font-bold text-[#1F2937] dark:text-white break-all">
              <span>/{registeredSalon.slug}</span>
              <Link
                href={`/${registeredSalon.slug}`}
                target="_blank"
                className="text-[#D4A77F] hover:text-[#B8905F] shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-1.5">
              Put this link in your Instagram bio and Google Maps profile for 24/7 client appointments.
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/app')}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-sm shadow-lg shadow-[#D4A77F]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Open My Salon ERP Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href={`/${registeredSalon.slug}`}
              target="_blank"
              className="py-3.5 px-5 rounded-2xl bg-white dark:bg-[#10141F] hover:bg-neutral-50 dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-white font-bold text-sm border border-[#E5E7EB] dark:border-[#2A2F3A] transition-all flex items-center justify-center gap-1.5"
            >
              <span>View Booking Page</span>
              <ExternalLink className="w-4 h-4 text-[#6B7280] dark:text-[#A0A8B8]" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ================= REGISTRATION FORM =================
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] font-sans selection:bg-[#D4A77F] selection:text-[#080B12] pb-16 transition-colors duration-300">
      {/* Top Navbar - Fully Adaptive to Light and Dark Mode & 320px Responsive */}
      <nav className="border-b border-[#E5E7EB] dark:border-[#2A2F3A] bg-white/95 dark:bg-[#080B12]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="inline-flex items-center shrink-0 group">
            <span className="font-black text-xl sm:text-2xl text-[#1F2937] dark:text-white tracking-tight">
              Studio<span className="text-[#D4A77F]">Desk</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 text-xs shrink-0">
            <div className="scale-90 sm:scale-100 origin-right shrink-0">
              <ThemeToggle />
            </div>
            <span className="text-[#6B7280] dark:text-[#A0A8B8] hidden md:inline">Already registered?</span>
            <Link
              href="/salon-owner"
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] dark:bg-[#141926] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-white font-semibold text-[11px] sm:text-xs transition-all border border-[#E5E7EB] dark:border-[#2A2F3A] cursor-pointer whitespace-nowrap inline-flex items-center gap-1 shrink-0"
            >
              <span className="hidden sm:inline">Sign In to ERP</span>
              <span className="sm:hidden">Sign In</span>
              <span className="shrink-0 font-bold">➔</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#8C5E35] dark:text-[#D4A77F] text-xs font-bold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A77F]" />
            <span>🎁 7-Day Free Trial · No Credit Card Required · ₹0 Today</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#1F2937] dark:text-white tracking-tight leading-[1.18]">
            Create Salon Account &amp; Start 7-Day Free Trial
          </h1>
          <p className="text-xs sm:text-base text-[#6B7280] dark:text-[#A0A8B8] mt-3 leading-relaxed">
            Fill in your details below to launch your private cloud ERP in 60 seconds. You can log in anytime with your registered email &amp; password.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Box */}
          <div className="lg:col-span-7 bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 transition-colors">
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-1">
              Salon &amp; Owner Details
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mb-6">
              Enter your salon information to setup your private ERP workspace.
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-slide-up">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegisterAndPay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider mb-1.5">
                  Salon Business Name <span className="text-[#D4A77F]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder="e.g. Bella Hair Studio & Spa"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all text-[#1F2937] dark:text-white bg-[#F9FAFB] dark:bg-[#10141F] focus:bg-white dark:focus:bg-[#10141F] placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider mb-1.5">
                  Owner / Manager Name <span className="text-[#D4A77F]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Diya Patel"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all text-[#1F2937] dark:text-white bg-[#F9FAFB] dark:bg-[#10141F] focus:bg-white dark:focus:bg-[#10141F] placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider mb-1.5">
                    WhatsApp / Mobile <span className="text-[#D4A77F]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9898012345"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all text-[#1F2937] dark:text-white bg-[#F9FAFB] dark:bg-[#10141F] focus:bg-white dark:focus:bg-[#10141F] placeholder-[#9CA3AF] dark:placeholder-[#5A6275] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider mb-1.5">
                    City / Area
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Ahmedabad, Surat"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all text-[#1F2937] dark:text-white bg-[#F9FAFB] dark:bg-[#10141F] focus:bg-white dark:focus:bg-[#10141F] placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-[#D4A77F]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all text-[#1F2937] dark:text-white bg-[#F9FAFB] dark:bg-[#10141F] focus:bg-white dark:focus:bg-[#10141F] placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider mb-1.5">
                    Create Password <span className="text-[#D4A77F]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all text-[#1F2937] dark:text-white bg-[#F9FAFB] dark:bg-[#10141F] focus:bg-white dark:focus:bg-[#10141F] placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#747D8D] hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors p-1 cursor-pointer focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider mb-1.5">
                    Confirm Password <span className="text-[#D4A77F]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all text-[#1F2937] dark:text-white bg-[#F9FAFB] dark:bg-[#10141F] focus:bg-white dark:focus:bg-[#10141F] placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#747D8D] hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors p-1 cursor-pointer focus:outline-none"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan Selection Tier */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider">
                    Select Your Plan or Trial <span className="text-[#8C5E2E] dark:text-[#D4A77F]">*</span>
                  </label>
                  <span className="text-[11px] text-[#8C5E2E] dark:text-[#D4A77F] font-bold">Instant activation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  {/* 7-Day Free Trial Option */}
                  <div
                    onClick={() => setSelectedPlanId('trial')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedPlanId === 'trial'
                        ? 'border-[#D4A77F] bg-[#D4A77F]/10 dark:bg-[#D4A77F]/15 ring-2 ring-[#D4A77F]/30'
                        : 'border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F9FAFB] dark:bg-[#10141F] hover:border-[#D4A77F]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlanId === 'trial' ? 'border-[#D4A77F]' : 'border-[#9CA3AF] dark:border-[#5A6275]'}`}>
                          {selectedPlanId === 'trial' && <div className="w-2 h-2 rounded-full bg-[#D4A77F]" />}
                        </div>
                        <span className="font-extrabold text-xs text-[#1F2937] dark:text-white">7-Day Free Trial</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">₹0 Free</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-1 pl-6">
                      7 days of full ERP access. Auto-locks after day 7 unless subscribed.
                    </p>
                  </div>

                  {/* Dynamic Plans from Database */}
                  {plans.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-[#D4A77F] bg-[#D4A77F]/10 dark:bg-[#D4A77F]/15 ring-2 ring-[#D4A77F]/30'
                            : 'border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F9FAFB] dark:bg-[#10141F] hover:border-[#D4A77F]/50'
                        }`}
                      >
                        {p.is_popular && (
                          <span className="absolute -top-2.5 right-3 bg-[#D4A77F] text-[#080B12] text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                            Popular
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#D4A77F]' : 'border-[#9CA3AF] dark:border-[#5A6275]'}`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-[#D4A77F]" />}
                            </div>
                            <span className="font-extrabold text-xs text-[#1F2937] dark:text-white">{p.name}</span>
                          </div>
                          <span className="text-xs font-black text-[#1F2937] dark:text-white font-variant-numeric tabular-nums">
                            ₹{Number(p.price).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-1 pl-6 truncate">
                          {p.description || `${p.billing_interval} subscription`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Terms & Privacy Agreement Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#E5E7EB] dark:border-[#2A2F3A] text-[#D4A77F] focus:ring-[#D4A77F] cursor-pointer"
                />
                <label htmlFor="terms-checkbox" className="text-xs text-[#6B7280] dark:text-[#A0A8B8] leading-tight cursor-pointer">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-4 px-6 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-sans font-bold text-sm shadow-xl shadow-[#D4A77F]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-98"
              >
                {loading ? (
                  <span>Setting up your salon ERP...</span>
                ) : selectedPlanId === 'trial' ? (
                  <span>Start 7-Day Free Trial &amp; Launch ERP ➔</span>
                ) : (
                  <span>Proceed to Payment &amp; Activate Plan ➔</span>
                )}
              </button>

              <div className="text-center pt-3">
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] block">
                  Already have an existing salon account?
                </p>
                <Link
                  href="/salon-owner"
                  className="block mt-1 font-bold text-[#8C5E2E] dark:text-[#D4A77F] hover:underline text-xs"
                >
                  Sign in to your dashboard ➔
                </Link>
              </div>
            </form>
          </div>

          {/* Right Column: Benefits & Preview */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Slug Preview Card */}
            <div className="bg-[#10141F] border border-[#D4A77F]/40 rounded-3xl p-6 text-white shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#D4A77F]/20 text-[#D4A77F] border border-[#D4A77F]/30 inline-block mb-3">
                Live URL Preview
              </span>
              <h3 className="text-xl font-black text-white">
                {salonName || 'Your Salon Name'}
              </h3>
              <p className="text-xs text-[#A0A8B8] mt-1">
                Your customers will book appointments directly at:
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-[#D4A77F]/30 text-xs font-mono font-bold text-[#D4A77F] break-all">
                salonpro-core.vercel.app/{slugPreview}
              </div>
            </div>

            {/* Included in Your Account */}
            <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-xs transition-colors">
              <h4 className="font-extrabold text-sm text-[#1F2937] dark:text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4A77F]" />
                <span>Everything Included in Your Salon Setup:</span>
              </h4>

              <div className="space-y-3 text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-[#1F2937] dark:text-white">Zero Overlapping Bookings:</strong> Smart conflict engine prevents double-bookings.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-[#1F2937] dark:text-white">POS Billing with GST:</strong> 10-second checkout with split UPI + cash &amp; instant receipts.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-[#1F2937] dark:text-white">Live Kanban Chairs:</strong> Real-time waiting queue and stylist chair occupancy.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-[#1F2937] dark:text-white">Staff Commission Tracker:</strong> Automated commission calculation on services &amp; products.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
