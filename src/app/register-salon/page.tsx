'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function RegisterSalonPage() {
  const router = useRouter();

  const [salonName, setSalonName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSalon, setRegisteredSalon] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Computed slug preview
  const slugPreview = salonName
    ? salonName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : 'your-salon';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setRegisteredSalon(data.salon);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during salon registration.');
    } finally {
      setLoading(false);
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-[#b3135b] text-xs font-semibold mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#b3135b]" />
            <span>Launch Your Salon Operating System in 2 Minutes</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
            Register Your Salon Business
          </h1>
          <p className="text-xs sm:text-base text-slate-600 mt-3 leading-relaxed">
            Get instant access to automated online bookings, live chair tracking, GST POS billing, and staff commissions.
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white font-extrabold text-sm shadow-xl shadow-pink-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-98"
              >
                {loading ? (
                  <span>Registering Salon & Creating ERP Workspace...</span>
                ) : (
                  <>
                    <span>Create Salon Account & Launch ERP ➔</span>
                  </>
                )}
              </button>
            </form>
          </div>

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
