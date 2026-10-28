import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Receipt,
  Users,
  CreditCard,
  Scissors,
  Clock,
  ShieldCheck,
  TrendingUp,
  Building2,
  Award,
  Check,
  Zap,
  Lock,
  Gift,
} from 'lucide-react';
import StatsCounter from '@/components/landing/StatsCounter';

import LandingNavbar from '@/components/landing/LandingNavbar';

export const metadata = {
  title: 'SalonPro - The Modern Operating System for Salons & Spas',
  description: 'Transform your salon with zero double-bookings, 10-second GST billing, live chair kanban, and automated WhatsApp confirmations.',
};

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-pink-500 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Background Soft Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[90vw] max-w-[650px] h-[400px] sm:h-[550px] bg-gradient-to-b from-pink-100/70 via-purple-50/50 to-transparent rounded-full blur-[100px]" />
      </div>

      {/* Top Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 pt-10 sm:pt-18 lg:pt-22 pb-10 sm:pb-16 text-center w-full">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-[#b3135b] text-[11px] sm:text-xs font-bold mb-5 sm:mb-6 shadow-xs max-w-full">
          <Gift className="w-3.5 h-3.5 text-[#b3135b] shrink-0" />
          <span>🎁 Special Offer: 7-Day Free Trial Demo · Zero Upfront Cost · Instant Setup</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.22] sm:leading-[1.15] max-w-4xl mx-auto break-normal">
          Stop Losing Revenue to <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-[#b3135b] via-[#d62475] to-purple-600 bg-clip-text text-transparent">
            Paper Registers & Double-Bookings
          </span>
        </h1>

        <p className="text-xs sm:text-base lg:text-lg text-slate-600 mt-3 sm:mt-5 max-w-2xl mx-auto leading-relaxed px-1">
          Upgrade your salon with <strong>automated online client bookings</strong>, live chair status, 10-second GST billing, staff commission tracking, and instant WhatsApp receipts.
        </p>

        {/* Hero CTAs */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
          <Link
            href="/register-salon"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-pink-900/25 transition-all active:scale-95 flex items-center justify-center gap-2 group"
          >
            <span>🎁 Start 7-Day Free Trial Demo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/salon-owner"
            className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
          >
            <Lock className="w-4 h-4 text-slate-500" />
            <span>🔐 Salon Owner Sign In</span>
          </Link>
        </div>

        {/* Quick Micro-Trust badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>No credit card required</span>
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Setup in 60 seconds</span>
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Full ERP access for 7 days</span>
          </span>
        </div>

        {/* Animated Social Proof Stats Counter */}
        <StatsCounter />
      </section>

      {/* ================= SECTION: PROBLEMS VS SALONPRO SOLUTION ================= */}
      <section id="problems" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">Common Salon Headaches</h2>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Running a Salon Shouldn&apos;t Feel Like Chaos
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Traditional salons waste hours on manual registers and lose clients due to poor booking coordination. Here is how SalonPro solves every pain point:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Pain Point 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">The Headache: Double-Bookings & Angry Walk-Ins</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Two clients show up for the same hair stylist at 4:00 PM. Stylists are stressed, waiting areas are packed, and clients leave bad reviews.
                </p>
                <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>SalonPro Solution:</strong> Automated exclusion engine guarantees zero overlapping slots. Stylist buffers are computed automatically.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">The Headache: Messy Paper Books & Lost Bills</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  When a client asks for their previous treatment shade or invoice history, staff scrambles through stacks of handwritten paper diaries.
                </p>
                <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>SalonPro Solution:</strong> Instant client profile lookup showing past visits, used treatments, and complete invoice receipts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">The Headache: End-of-Day Cash & Commission Confusion</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Calculating how much each hair stylist earned in commissions and reconciling UPI vs Cash payments takes the salon owner hours every night.
                </p>
                <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>SalonPro Solution:</strong> Automated daily reports showing cash collected, UPI payments, and exact staff commission amounts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 4 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">The Headache: Clients Forget Appointments</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Over 25% of verbal phone appointments result in no-shows because clients simply forget their booked time slot.
                </p>
                <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>SalonPro Solution:</strong> Instant WhatsApp Cloud confirmation sent to client with date, time, stylist, and salon location.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: HOW IT WORKS (THE PRIYA SALON EXAMPLE) ================= */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-slate-200/80">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#b3135b] mb-2">Simple Multi-Tenant Workflow</h2>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            How SalonPro Works in Your Salon (Example: &quot;Priya Salon&quot;)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Clean segregation between your internal salon operations and what your customers see.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-black text-xl mb-4">
                1
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">Salon Owner Portal</h4>
              <div className="text-xs font-mono text-amber-700 font-semibold mt-0.5">domain.com/salon-owner</div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Priya Salon logs in daily using their password. They see their private Live Kanban chairs, appointment calendar, billing terminal, and cash drawer.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-amber-800 font-semibold flex items-center gap-1.5">
              <span>🔒</span>
              <span>Strictly Private to Salon Staff</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-pink-300 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ring-2 ring-pink-100">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 text-[#b3135b] flex items-center justify-center font-black text-xl mb-4">
                2
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">Unique Customer Link</h4>
              <div className="text-xs font-mono text-[#b3135b] font-semibold mt-0.5">domain.com/priya-salon</div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Priya Salon puts their unique link on their Instagram bio and Google Maps profile. Customers click and see ONLY Priya Salon&apos;s brand, services, and available stylists.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-pink-100 text-[11px] text-[#b3135b] font-semibold flex items-center gap-1.5">
              <span>🌐</span>
              <span>Public Client Booking Page</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-xl mb-4">
                3
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">Instant Client Sync</h4>
              <div className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">domain.com/portal</div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                When a customer books, it instantly pops up on Priya Salon&apos;s Kanban. The client gets a WhatsApp confirmation and can view their digital bill anytime at /portal.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
              <span>✨</span>
              <span>Permanent Client Records</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: CORE FEATURES & CAPABILITIES ================= */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-slate-200/80">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Everything Included</h2>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built from Ground Up for Beauty & Wellness Studios
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <Calendar className="w-8 h-8 text-[#b3135b] mb-4" />
            <h4 className="font-bold text-sm sm:text-base text-slate-900">Smart Appointments Calendar</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Day, week, and list views. Filter by stylist, mark customer arrivals with 1-click, and reschedule effortlessly.
            </p>
          </div>

          <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <Scissors className="w-8 h-8 text-purple-600 mb-4" />
            <h4 className="font-bold text-sm sm:text-base text-slate-900">Live Studio Kanban</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Track walk-in waiting queues, currently seated chairs, and completed sessions ready for POS billing.
            </p>
          </div>

          <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <Receipt className="w-8 h-8 text-emerald-600 mb-4" />
            <h4 className="font-bold text-sm sm:text-base text-slate-900">POS Billing with GST</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Itemized service and product checkout. Handles CGST (9%) + SGST (9%), discounts, and split payments (Cash + UPI).
            </p>
          </div>

          <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <Users className="w-8 h-8 text-amber-600 mb-4" />
            <h4 className="font-bold text-sm sm:text-base text-slate-900">Staff Commission Automation</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Set separate commission percentages for services and retail products. Export transparent payroll reports.
            </p>
          </div>

          <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <Award className="w-8 h-8 text-[#b3135b] mb-4" />
            <h4 className="font-bold text-sm sm:text-base text-slate-900">VIP Memberships & Discounts</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Sell Gold or Platinum annual memberships. Member discounts are automatically pre-filled during billing checkout.
            </p>
          </div>

          <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <TrendingUp className="w-8 h-8 text-teal-600 mb-4" />
            <h4 className="font-bold text-sm sm:text-base text-slate-900">Daily Cash & Sales Reports</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              End-of-day tally with cash breakdown, UPI payments, gross profit, and top revenue-generating treatments.
            </p>
          </div>
        </div>
      </section>

      {/* ================= SECTION: 7-DAY FREE TRIAL DEMO & PRICING PLANS ================= */}
      <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 border-t border-slate-200/80">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-[#b3135b] text-xs font-bold mb-3 shadow-xs">
            <Gift className="w-4 h-4 text-[#b3135b]" />
            <span>100% Free 7-Day Evaluation Demo</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Start Free for 7 Days, Upgrade as You Grow
          </h2>
          <p className="text-xs sm:text-base text-slate-600 mt-3 max-w-2xl mx-auto leading-relaxed">
            Every new salon starts with a full-featured <strong>7-Day Free Trial Demo</strong>. Experience real online bookings, POS billing, staff commission tracking, and live chair kanban with zero upfront cost.
          </p>
        </div>

        {/* Step-by-Step Onboarding Roadmap */}
        <div className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs relative">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#b3135b] font-black text-base flex items-center justify-center mb-3">
              1
            </div>
            <h4 className="font-bold text-sm sm:text-base text-slate-900">
              Create Your Salon Account
            </h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Enter your <strong>Full Name, Phone Number, Email, Salon Name, City & Password</strong>. Registration takes less than 60 seconds.
            </p>
          </div>

          <div className="bg-white border border-pink-300 rounded-2xl p-5 sm:p-6 shadow-xs relative ring-2 ring-pink-100">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white font-black text-base flex items-center justify-center mb-3 shadow-md shadow-pink-900/20">
              2
            </div>
            <h4 className="font-bold text-sm sm:text-base text-[#b3135b]">
              Instant 7-Day Demo Activated
            </h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Your private salon dashboard goes live immediately. Test with your real stylists, services, and live bookings with <strong>₹0 charged</strong>.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs relative">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center mb-3">
              3
            </div>
            <h4 className="font-bold text-sm sm:text-base text-slate-900">
              Owner Login & Choose Plan
            </h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Log in anytime with your email & password. After 7 days, subscribe to your preferred plan to keep your salon active without losing any data!
            </p>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Plan 1: 7-Day Free Trial Demo */}
          <div className="bg-white border-2 border-pink-400 rounded-3xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden ring-4 ring-pink-50">
            <div className="absolute top-0 right-0 bg-[#b3135b] text-white text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-bl-xl shadow-xs">
              Free Demo
            </div>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#b3135b] flex items-center justify-center mb-4">
                <Gift className="w-5 h-5 text-[#b3135b]" />
              </div>
              <h3 className="font-black text-lg text-slate-900">7-Day Free Trial</h3>
              <p className="text-xs text-slate-500 mt-1">Full evaluation for new salons</p>

              <div className="mt-4 mb-6">
                <div className="text-3xl font-black text-slate-900">₹0</div>
                <div className="text-xs text-slate-500 mt-0.5">Free for 7 full days</div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full ERP & POS billing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live Studio Floor Kanban</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Public Online Booking Page</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApp bill receipts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/register-salon"
                className="w-full py-3 px-4 rounded-xl bg-[#b3135b] hover:bg-[#960f4c] text-white font-bold text-xs shadow-md shadow-pink-900/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Start 7-Day Demo ➔</span>
              </Link>
            </div>
          </div>

          {/* Plan 2: Starter Studio */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                <Scissors className="w-5 h-5" />
              </div>
              <h3 className="font-black text-lg text-slate-900">Starter Studio</h3>
              <p className="text-xs text-slate-500 mt-1">For boutique studios & solo stylists</p>

              <div className="mt-4 mb-6">
                <div className="text-3xl font-black text-slate-900">₹999</div>
                <div className="text-xs text-slate-500 mt-0.5">per month + GST</div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Includes 7-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlimited client appointments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>10-second GST billing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to 3 Stylist profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Daily revenue & cash summary</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/register-salon"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Choose Starter ➔</span>
              </Link>
            </div>
          </div>

          {/* Plan 3: Growth Professional (Most Popular) */}
          <div className="bg-gradient-to-b from-[#2a1630] to-[#1a0c1e] text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-bl-xl shadow-xs">
              Most Popular
            </div>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-300 flex items-center justify-center mb-4 border border-pink-500/30">
                <Sparkles className="w-5 h-5 text-pink-300" />
              </div>
              <h3 className="font-black text-lg text-white">Growth Pro</h3>
              <p className="text-xs text-pink-200/80 mt-1">For busy salons, spas & beauty studios</p>

              <div className="mt-4 mb-6">
                <div className="text-3xl font-black text-white">₹1,999</div>
                <div className="text-xs text-pink-200/70 mt-0.5">per month + GST</div>
              </div>

              <div className="space-y-2.5 text-xs text-pink-100 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Includes 7-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Stylists & Staff</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Retail product sales & POS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Staff commissions auto-calc</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>WhatsApp marketing studio</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/register-salon"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#b3135b] to-[#e63985] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-pink-900/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Choose Growth Pro ➔</span>
              </Link>
            </div>
          </div>

          {/* Plan 4: Enterprise Annual */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-lg text-slate-900">Enterprise Annual</h3>
              <p className="text-xs text-slate-500 mt-1">Multi-branch salons & franchises</p>

              <div className="mt-4 mb-6">
                <div className="text-3xl font-black text-slate-900">₹19,999</div>
                <div className="text-xs text-emerald-600 font-bold mt-0.5">per year · Save 17%</div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Everything in Growth Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Multi-branch management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dedicated account manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom domain & SLA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Priority 24/7 WhatsApp help</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/register-salon"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Choose Enterprise ➔</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM CTA BANNER ================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-amber-50 border border-pink-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-sm relative overflow-hidden">
          <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Ready to Automate Your Salon Operations?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-3 max-w-lg mx-auto leading-relaxed">
            Join hundreds of forward-thinking salons running with SalonPro. Setup takes less than 3 minutes.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register-salon"
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-pink-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Create Your Salon Account ➔</span>
            </Link>

            <Link
              href="/salon-owner"
              className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Already Registered? Sign In ➔</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 sm:py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-sm text-slate-900">SalonPro</span>
            <span>·</span>
            <span>Multi-Tenant Cloud Salon & Spa Suite</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-600 font-semibold text-xs">
            <Link href="/register-salon" className="hover:text-[#b3135b] transition-colors">Register Salon</Link>
            <Link href="/salon-owner" className="hover:text-[#b3135b] transition-colors">Salon Owner Sign In</Link>
            <Link href="/portal" className="hover:text-[#b3135b] transition-colors">Client Portal</Link>
            <Link href="/admin/login" className="hover:text-[#b3135b] transition-colors">Super Admin</Link>
          </div>

          <div className="text-slate-400 text-[11px]">
            © 2026 SalonPro Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
