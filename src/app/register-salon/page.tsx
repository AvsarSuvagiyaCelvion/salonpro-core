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

import ThemeToggle from '@/components/landing/ThemeToggle';

export default function RegisterSalonPage() {
  const router = useRouter();

  const [salonName, setSalonName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
          confirmPassword,
          planId: planIdToSubmit,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Database / server error. Please verify database connection or try again.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setRegisteredSalon(data.salon);
      if (planIdToSubmit) {
        const chosen = plans.find((p) => p.id === planIdToSubmit);
        setRegisteredPlanName(chosen?.name || 'Pro Plan');
      } else {
        setRegisteredPlanName('7-Day Free Trial');
      }
      setShowPaymentModal(false);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
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

    if (selectedPlanId === 'trial') {
      await handleCompleteRegistration(null);
    } else {
      setShowPaymentModal(true);
    }
  }

  // ================= SUCCESS STATE =================
  if (registeredSalon) {
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
            <strong className="text-[#1F2937] dark:text-white">{registeredSalon.name}</strong> is now live on SalonPro Cloud. Your cloud POS, staff scheduler, and online booking engine are ready.
          </p>

          <div className="mt-4 p-3 rounded-2xl bg-[#D4A77F]/10 border border-[#D4A77F]/30 text-xs font-bold text-[#8C5E35] dark:text-[#D4A77F] flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4A77F]" />
            <span>
              {registeredPlanName === '7-Day Free Trial'
                ? '🎁 7-Day Free Trial Active (Full access until 7 days)'
                : `👑 ${registeredPlanName} Subscription Active`}
            </span>
          </div>

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
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] flex items-center justify-center font-black text-sm sm:text-base text-[#D4A77F] shadow-xs group-hover:rotate-12 transition-transform">
              ✂
            </div>
            <span className="font-extrabold text-base sm:text-xl text-[#1F2937] dark:text-white tracking-tight">
              Salon<span className="text-[#D4A77F]">Pro</span>
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all text-[#1F2937] dark:text-white bg-[#F9FAFB] dark:bg-[#10141F] focus:bg-white dark:focus:bg-[#10141F] placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider mb-1.5">
                    Confirm Password <span className="text-[#D4A77F]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] focus:border-[#D4A77F] focus:ring-2 focus:ring-[#D4A77F]/20 outline-none text-sm transition-all text-[#1F2937] dark:text-white bg-[#F9FAFB] dark:bg-[#10141F] focus:bg-white dark:focus:bg-[#10141F] placeholder-[#9CA3AF] dark:placeholder-[#5A6275]"
                    />
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

          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080B12]/80 backdrop-blur-xs animate-fade-in">
              <div className="bg-white dark:bg-[#141926] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A] mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#D4A77F]" />
                    <h3 className="font-black text-[#1F2937] dark:text-white text-base">Payment &amp; Plan Activation</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="p-1 rounded-lg text-[#9CA3AF] dark:text-[#747D8D] hover:text-[#1F2937] dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {(() => {
                  const currentSelectedPlan = plans.find((p) => p.id === selectedPlanId);
                  return (
                    <div>
                      <div className="p-4 rounded-2xl bg-[#D4A77F]/10 border border-[#D4A77F]/30 mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-sm text-[#1F2937] dark:text-white">{currentSelectedPlan?.name}</span>
                          <span className="text-lg font-black text-[#D4A77F] font-variant-numeric tabular-nums">
                            ₹{Number(currentSelectedPlan?.price || 0).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                          {currentSelectedPlan?.billing_interval === 'yearly' ? 'Billed annually · 2 months free' : 'Billed monthly · Cancel anytime'}
                        </p>
                      </div>

                      <div className="space-y-3 mb-6">
                        <label className="block text-xs font-bold text-[#1F2937] dark:text-white uppercase tracking-wider">
                          Select Payment Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('upi')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              paymentMethod === 'upi'
                                ? 'border-[#D4A77F] bg-[#D4A77F]/15 text-[#D4A77F]'
                                : 'border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F9FAFB] dark:bg-[#10141F] text-[#1F2937] dark:text-white'
                            }`}
                          >
                            <span>⚡ Instant UPI / QR</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              paymentMethod === 'card'
                                ? 'border-[#D4A77F] bg-[#D4A77F]/15 text-[#D4A77F]'
                                : 'border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F9FAFB] dark:bg-[#10141F] text-[#1F2937] dark:text-white'
                            }`}
                          >
                            <span>💳 Card / NetBanking</span>
                          </button>
                        </div>

                        {paymentMethod === 'upi' ? (
                          <div className="p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] text-center text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                            <span className="font-bold text-[#1F2937] dark:text-white block mb-1">Fast UPI QR Simulation</span>
                            <span>Scan with GPay, PhonePe, or Paytm for instant salon onboarding.</span>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] text-center text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                            <span className="font-bold text-[#1F2937] dark:text-white block mb-1">Card / NetBanking Gateway</span>
                            <span>Supports Visa, Mastercard, RuPay &amp; all Indian Banks.</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCompleteRegistration(selectedPlanId)}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
                domain.com/{slugPreview}
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
