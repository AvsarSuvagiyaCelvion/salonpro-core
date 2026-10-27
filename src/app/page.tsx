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
} from 'lucide-react';

export const metadata = {
  title: 'SalonPro - The Modern Operating System for Salons & Spas',
  description: 'Transform your salon with zero double-bookings, 10-second GST billing, live chair kanban, and automated WhatsApp confirmations.',
};

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-pink-500 selection:text-white">
      {/* Background Soft Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[550px] bg-gradient-to-b from-pink-100/70 via-purple-50/50 to-transparent rounded-full blur-[120px]" />
      </div>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] flex items-center justify-center font-black text-xl text-white shadow-md shadow-pink-900/10">
              ✂
            </div>
            <div>
              <div className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                <span>SalonPro</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-50 text-[#b3135b] border border-pink-200">
                  Cloud SaaS
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#problems" className="hover:text-[#b3135b] transition-colors">Problems We Solve</a>
            <a href="#features" className="hover:text-[#b3135b] transition-colors">Features & POS</a>
            <a href="#how-it-works" className="hover:text-[#b3135b] transition-colors">How It Works</a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <a
              href="#features"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              Explore Features →
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-16 sm:pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-[#b3135b] text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#b3135b]" />
          <span>The #1 All-in-One Salon & Spa Management Software</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Stop Losing Revenue to <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-[#b3135b] via-[#d62475] to-purple-600 bg-clip-text text-transparent">
            Paper Registers & Double-Bookings
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 mt-6 max-w-2xl mx-auto leading-relaxed">
          Upgrade your salon with <strong>automated online client bookings</strong>, live chair status, 10-second GST billing, staff commission tracking, and instant WhatsApp receipts.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-pink-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Explore SalonPro Features ➔</span>
          </a>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>See How It Works</span>
          </a>
        </div>

        {/* Social Proof Stats */}
        <div className="mt-14 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">0%</div>
            <div className="text-xs text-slate-500 mt-1">Double-Bookings</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#b3135b] font-mono">10 Sec</div>
            <div className="text-xs text-slate-500 mt-1">GST POS Checkout</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-purple-700 font-mono">100%</div>
            <div className="text-xs text-slate-500 mt-1">WhatsApp Confirmations</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">35%+</div>
            <div className="text-xs text-slate-500 mt-1">Repeat Visits with VIP Plans</div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: PROBLEMS VS SALONPRO SOLUTION ================= */}
      <section id="problems" className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">Common Salon Headaches</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Running a Salon Shouldn&apos;t Feel Like Chaos
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            Traditional salons waste hours on manual registers and lose clients due to poor booking coordination. Here is how SalonPro solves every pain point:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pain Point 1 */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">The Headache: Double-Bookings & Angry Walk-Ins</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Two clients show up for the same hair stylist at 4:00 PM. Stylists are stressed, waiting areas are packed, and clients leave bad reviews.
                </p>
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>SalonPro Solution:</strong> Automated exclusion engine guarantees zero overlapping slots. Stylist buffers are computed automatically.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 2 */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">The Headache: Messy Paper Books & Lost Bills</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  When a client asks for their previous treatment shade or invoice history, staff scrambles through stacks of handwritten paper diaries.
                </p>
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>SalonPro Solution:</strong> Instant client profile lookup showing past visits, used treatments, and complete invoice receipts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 3 */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">The Headache: End-of-Day Cash & Commission Confusion</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Calculating how much each hair stylist earned in commissions and reconciling UPI vs Cash payments takes the salon owner hours every night.
                </p>
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>SalonPro Solution:</strong> Automated daily reports showing cash collected, UPI payments, and exact staff commission amounts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 4 */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">The Headache: Clients Forget Appointments</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Over 25% of verbal phone appointments result in no-shows because clients simply forget their booked time slot.
                </p>
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>SalonPro Solution:</strong> Instant WhatsApp Cloud confirmation sent to client with date, time, stylist, and salon location.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: HOW IT WORKS (THE PRIYA SALON EXAMPLE) ================= */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-4 py-16 border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#b3135b] mb-2">Simple Multi-Tenant Workflow</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            How SalonPro Works in Your Salon (Example: &quot;Priya Salon&quot;)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            Clean segregation between your internal salon operations and what your customers see.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-black text-xl mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900">Salon Owner Portal</h4>
              <div className="text-xs font-mono text-amber-700 font-semibold mt-0.5">domain.com/salon-owner</div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Priya Salon logs in daily using their password. They see their private Live Kanban chairs, appointment calendar, billing terminal, and cash drawer.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-amber-800 font-semibold">
              🔒 Strictly Private to Salon Staff
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-pink-300 rounded-3xl p-6 shadow-sm flex flex-col justify-between ring-2 ring-pink-100">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 text-[#b3135b] flex items-center justify-center font-black text-xl mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900">Unique Customer Link</h4>
              <div className="text-xs font-mono text-[#b3135b] font-semibold mt-0.5">domain.com/priya-salon</div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Priya Salon puts their unique link on their Instagram bio and Google Maps profile. Customers click and see ONLY Priya Salon&apos;s brand, services, and available stylists.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-[#b3135b] font-semibold">
              🌐 Public Client Booking Page
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-xl mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900">Instant Client Sync</h4>
              <div className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">domain.com/portal</div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                When a customer books, it instantly pops up on Priya Salon&apos;s Kanban. The client gets a WhatsApp confirmation and can view their digital bill anytime at /portal.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-emerald-800 font-semibold">
              ✨ Permanent Client Records
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: CORE FEATURES & CAPABILITIES ================= */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 py-16 border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Everything Included</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Built from Ground Up for Beauty & Wellness Studios
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <Calendar className="w-8 h-8 text-[#b3135b] mb-4" />
            <h4 className="font-bold text-base text-slate-900">Smart Appointments Calendar</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Day, week, and list views. Filter by stylist, mark customer arrivals with 1-click, and reschedule effortlessly.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <Scissors className="w-8 h-8 text-purple-600 mb-4" />
            <h4 className="font-bold text-base text-slate-900">Live Studio Kanban</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Track walk-in waiting queues, currently seated chairs, and completed sessions ready for POS billing.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <Receipt className="w-8 h-8 text-emerald-600 mb-4" />
            <h4 className="font-bold text-base text-slate-900">POS Billing with GST</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Itemized service and product checkout. Handles CGST (9%) + SGST (9%), discounts, and split payments (Cash + UPI).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <Users className="w-8 h-8 text-amber-600 mb-4" />
            <h4 className="font-bold text-base text-slate-900">Staff Commission Automation</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Set separate commission percentages for services and retail products. Export transparent payroll reports.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <Award className="w-8 h-8 text-[#b3135b] mb-4" />
            <h4 className="font-bold text-base text-slate-900">VIP Memberships & Discounts</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Sell Gold or Platinum annual memberships. Member discounts are automatically pre-filled during billing checkout.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <TrendingUp className="w-8 h-8 text-teal-600 mb-4" />
            <h4 className="font-bold text-base text-slate-900">Daily Cash & Sales Reports</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              End-of-day tally with cash breakdown, UPI payments, gross profit, and top revenue-generating treatments.
            </p>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM CTA BANNER ================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-amber-50 border border-pink-200/80 rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <h3 className="text-2xl sm:text-4xl font-black text-slate-900">
            Ready to Automate Your Salon Operations?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-3 max-w-lg mx-auto">
            Join hundreds of forward-thinking salons running with SalonPro. Setup takes less than 3 minutes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href="#problems"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white font-extrabold text-sm shadow-md shadow-pink-900/20 transition-all active:scale-95"
            >
              See Problems Solved by SalonPro ➔
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-slate-900">SalonPro</span>
            <span>·</span>
            <span>Multi-Tenant Cloud Salon & Spa Suite</span>
          </div>

          <div className="flex items-center gap-5 text-slate-500 font-medium">
            <span>© 2026 SalonPro Platform. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
