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
} from 'lucide-react';

export default function RegisterSalonPage() {
  const router = useRouter();

  const [salonName, setSalonName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');

  // Plans & Trial State
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('trial'); // 'trial' or plan.id
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [registeredPlanName, setRegisteredPlanName] = useState<string>('7-Day Free Trial');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSalon, setRegisteredSalon] = useState<{ id: string; name: string; slug: string } | null>(null);

  useEffect(() => {
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

  async function handleCompleteRegistration(planIdToSubmit: string | null) {
    setError(null);
    setLoading(true);

    try {
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
          planId: planIdToSubmit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      if (planIdToSubmit) {
        const found = plans.find((p) => p.id === planIdToSubmit);
        setRegisteredPlanName(found ? found.name : 'Paid Plan');
      } else {
        setRegisteredPlanName('7-Day Free Trial');
      }

      setShowPaymentModal(false);
      setRegisteredSalon(data.salon);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during salon registration.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!salonName.trim() || !ownerName.trim() || !mobile.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (selectedPlanId === 'trial') {
      await handleCompleteRegistration(null);
    } else {
      setShowPaymentModal(true);
    }
  }

  // ================= SUCCESS STATE =================
  if (registeredSalon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf6f8] via-[#f7eef3] to-[#f4e4ed] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white border border-pink-200/80 rounded-3xl p-8 sm:p-10 shadow-2xl text-center animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-3">
            Salon Registered Successfully!
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#2a1630]">
            Welcome, {ownerName}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2 max-w-md mx-auto">
            <strong>{registeredSalon.name}</strong> is now live on SalonPro Cloud. Your cloud POS, staff scheduler, and online booking engine are ready.
          </p>

          <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-xs font-bold text-[#b3135b] flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>
              {registeredPlanName === '7-Day Free Trial'
                ? '🎁 7-Day Free Trial Active (Full access until 7 days)'
                : `👑 ${registeredPlanName} Subscription Active`}
            </span>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-pink-50 border border-pink-200 text-left">
            <div className="text-[11px] font-bold text-[#b3135b] uppercase tracking-wider mb-1">
              Your Public Booking Link:
            </div>
            <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-pink-200 text-xs font-mono font-bold text-[#2a1630] break-all">
              <span>/{registeredSalon.slug}</span>
              <Link
                href={`/${registeredSalon.slug}`}
                target="_blank"
                className="text-[#b3135b] hover:text-[#960f4c] shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="text-[11px] text-neutral-500 mt-1.5">
              Put this link in your Instagram bio and Google Maps profile for 24/7 client appointments.
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/app')}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#b3135b] hover:bg-[#960f4c] text-white font-bold text-sm shadow-lg shadow-pink-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Open My Salon ERP Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href={`/${registeredSalon.slug}`}
              target="_blank"
              className="py-3.5 px-5 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-sm border border-neutral-300 transition-all flex items-center justify-center gap-1.5"
            >
              <span>View Booking Page</span>
              <ExternalLink className="w-4 h-4 text-neutral-500" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ================= REGISTRATION FORM =================
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-pink-500 selection:text-white pb-16">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] flex items-center justify-center font-black text-lg text-white shadow-md shadow-pink-900/10">
              ✂
            </div>
            <span className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">
              SalonPro
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="text-slate-500 hidden sm:inline">Already registered?</span>
            <Link
              href="/salon-owner"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all border border-slate-200"
            >
              Sign In to ERP ➔
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-[#b3135b] text-xs font-bold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#b3135b]" />
            <span>🎁 7-Day Free Trial Demo · No Credit Card Required · ₹0 Today</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
            Create Salon Account & Start 7-Day Demo
          </h1>
          <p className="text-xs sm:text-base text-slate-600 mt-3 leading-relaxed">
            Fill in your details below to launch your private cloud ERP in 60 seconds. You can log in anytime with your registered email & password.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Box */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              Salon & Owner Details
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter your salon information to setup your private ERP workspace.
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-slide-up">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Salon Business Name <span className="text-[#b3135b]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder="e.g. Bella Hair Studio & Spa"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#b3135b] focus:ring-2 focus:ring-[#b3135b]/20 outline-none text-sm transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Owner / Manager Name <span className="text-[#b3135b]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Diya Patel"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#b3135b] focus:ring-2 focus:ring-[#b3135b]/20 outline-none text-sm transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp / Mobile <span className="text-[#b3135b]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9898012345"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#b3135b] focus:ring-2 focus:ring-[#b3135b]/20 outline-none text-sm transition-all text-slate-900 bg-slate-50/50 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / Area
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Ahmedabad, Surat"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#b3135b] focus:ring-2 focus:ring-[#b3135b]/20 outline-none text-sm transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-[#b3135b]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#b3135b] focus:ring-2 focus:ring-[#b3135b]/20 outline-none text-sm transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Create Password <span className="text-[#b3135b]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#b3135b] focus:ring-2 focus:ring-[#b3135b]/20 outline-none text-sm transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Selection Tier */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Your Plan or Trial <span className="text-[#b3135b]">*</span>
                  </label>
                  <span className="text-[11px] text-pink-600 font-bold">Instant activation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  {/* 7-Day Free Trial Option */}
                  <div
                    onClick={() => setSelectedPlanId('trial')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
                      selectedPlanId === 'trial'
                        ? 'border-[#b3135b] bg-pink-50/40 ring-2 ring-pink-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlanId === 'trial' ? 'border-[#b3135b]' : 'border-slate-300'}`}>
                          {selectedPlanId === 'trial' && <div className="w-2 h-2 rounded-full bg-[#b3135b]" />}
                        </div>
                        <span className="font-extrabold text-xs text-slate-900">7-Day Free Trial</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600">₹0 Free</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-6">
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
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer bg-white relative ${
                          isSelected
                            ? 'border-[#b3135b] bg-pink-50/40 ring-2 ring-pink-200'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {p.is_popular && (
                          <span className="absolute -top-2.5 right-3 bg-[#b3135b] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#b3135b]' : 'border-slate-300'}`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-[#b3135b]" />}
                            </div>
                            <span className="font-extrabold text-xs text-slate-900">{p.name}</span>
                          </div>
                          <span className="text-xs font-black text-slate-900">₹{Number(p.price).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 pl-6 truncate">
                          {p.description || `${p.billing_interval} subscription`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white font-extrabold text-sm shadow-xl shadow-pink-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-98"
              >
                {loading ? (
                  <span>Setting up your salon ERP...</span>
                ) : selectedPlanId === 'trial' ? (
                  <span>Start 7-Day Free Trial & Launch ERP ➔</span>
                ) : (
                  <span>Proceed to Payment & Activate Plan ➔</span>
                )}
              </button>

              <div className="text-center pt-3">
                <p className="text-xs text-slate-500">
                  Already have an existing salon account?{' '}
                  <Link href="/salon-owner" className="font-bold text-[#b3135b] hover:underline">
                    Sign in to your dashboard ➔
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#b3135b]" />
                    <h3 className="font-black text-slate-900 text-base">Payment & Plan Activation</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {(() => {
                  const currentSelectedPlan = plans.find((p) => p.id === selectedPlanId);
                  return (
                    <div>
                      <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200 mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-sm text-slate-900">{currentSelectedPlan?.name}</span>
                          <span className="text-lg font-black text-[#b3135b]">₹{Number(currentSelectedPlan?.price || 0).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {currentSelectedPlan?.billing_interval === 'yearly' ? 'Billed annually · 2 months free' : 'Billed monthly · Cancel anytime'}
                        </p>
                      </div>

                      <div className="space-y-3 mb-6">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select Payment Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('upi')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              paymentMethod === 'upi'
                                ? 'border-[#b3135b] bg-pink-50 text-[#b3135b]'
                                : 'border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>⚡ Instant UPI / QR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              paymentMethod === 'card'
                                ? 'border-[#b3135b] bg-pink-50 text-[#b3135b]'
                                : 'border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>💳 Card / NetBanking</span>
                          </button>
                        </div>

                        {paymentMethod === 'upi' ? (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                            <span className="font-bold text-slate-800 block mb-1">Fast UPI QR Simulation</span>
                            <span>Scan with GPay, PhonePe, or Paytm for instant salon onboarding.</span>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                            <span className="font-bold text-slate-800 block mb-1">Card / NetBanking Gateway</span>
                            <span>Supports Visa, Mastercard, RuPay & all Indian Banks.</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCompleteRegistration(selectedPlanId)}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-[#b3135b] hover:bg-[#9c0f4e] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{loading ? 'Processing Activation...' : `Authorize & Pay ₹${Number(currentSelectedPlan?.price || 0).toLocaleString()}`}</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Right Column: Benefits & Preview */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Slug Preview Card */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 border border-white/20 inline-block mb-3">
                Live URL Preview
              </span>
              <h3 className="text-xl font-black">
                {salonName || 'Your Salon Name'}
              </h3>
              <p className="text-xs text-pink-100 mt-1">
                Your customers will book appointments directly at:
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 text-xs font-mono font-bold break-all">
                domain.com/{slugPreview}
              </div>
            </div>

            {/* Included in Your Account */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
              <h4 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#b3135b]" />
                <span>Everything Included in Your Salon Setup:</span>
              </h4>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Overlapping Bookings:</strong> Smart conflict engine prevents double-bookings.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>POS Billing with GST:</strong> 10-second checkout with split UPI + cash & instant receipts.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Live Kanban Chairs:</strong> Real-time waiting queue and stylist chair occupancy.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Staff Commission Tracker:</strong> Automated commission calculation on services & products.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
