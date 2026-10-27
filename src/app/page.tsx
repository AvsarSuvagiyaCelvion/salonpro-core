import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Calendar,
  Receipt,
  Users,
  CreditCard,
  Scissors,
  Clock,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Smartphone,
  ChevronRight,
  Building2,
  Award,
} from 'lucide-react';

export const metadata = {
  title: 'SalonPro - The Modern Operating System for Salons & Spas',
  description: 'Transform your salon with zero double-bookings, 10-second GST billing, live chair kanban, and automated WhatsApp confirmations.',
};

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 font-sans selection:bg-pink-500 selection:text-white">
      {/* Background Lighting Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-pink-600/15 via-purple-600/10 to-transparent rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-pink-500/25">
              ✂
            </div>
            <div>
              <div className="font-black text-xl text-white tracking-tight flex items-center gap-2">
                <span>SalonPro</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Cloud SaaS
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-300">
            <a href="#problems" className="hover:text-white transition-colors">Problems We Solve</a>
            <a href="#features" className="hover:text-white transition-colors">Features & POS</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <Link href="/glow-studio" target="_blank" className="hover:text-pink-400 transition-colors flex items-center gap-1">
              <span>Live Booking Demo</span>
              <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded font-bold">New</span>
            </Link>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/salon-owner"
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold border border-neutral-800 transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Salon Owner Login</span>
            </Link>

            <Link
              href="/salon-owner"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-extrabold shadow-md shadow-pink-500/20 transition-all"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-16 sm:pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>The #1 All-in-One Salon & Spa Management Software</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Stop Losing Revenue to <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Paper Registers & Double-Bookings
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-neutral-400 mt-6 max-w-2xl mx-auto leading-relaxed">
          Upgrade your salon with <strong>automated online client bookings</strong>, live chair status, 10-second GST billing, staff commission tracking, and instant WhatsApp receipts.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/salon-owner"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-pink-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Launch Salon Owner ERP ➔</span>
          </Link>

          <Link
            href="/glow-studio"
            target="_blank"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 font-bold text-sm border border-neutral-800 transition-all flex items-center justify-center gap-2"
          >
            <span>Experience Customer Booking Demo</span>
            <ArrowRight className="w-4 h-4 text-pink-400" />
          </Link>
        </div>

        {/* Social Proof Stats */}
        <div className="mt-12 pt-8 border-t border-neutral-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">0%</div>
            <div className="text-xs text-neutral-500 mt-0.5">Double-Bookings</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-pink-400 font-mono">10 Sec</div>
            <div className="text-xs text-neutral-500 mt-0.5">GST POS Checkout</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">100%</div>
            <div className="text-xs text-neutral-500 mt-0.5">WhatsApp Confirmations</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">35%+</div>
            <div className="text-xs text-neutral-500 mt-0.5">Repeat Visits with VIP Plans</div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: PROBLEMS VS SALONPRO SOLUTION ================= */}
      <section id="problems" className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">Common Salon Headaches</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            Running a Salon Shouldn&apos;t Feel Like Chaos
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl mx-auto">
            Traditional salons waste hours on manual registers and lose clients due to poor booking coordination. Here is how SalonPro solves every pain point:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pain Point 1 */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div>
                <h4 className="text-base font-bold text-white">The Headache: Double-Bookings & Angry Walk-Ins</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Two clients show up for the same hair stylist at 4:00 PM. Stylists are stressed, waiting areas are packed, and clients leave bad reviews.
                </p>
                <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>SalonPro Solution:</strong> Automated exclusion engine guarantees zero overlapping slots. Stylist buffers are computed automatically.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 2 */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div>
                <h4 className="text-base font-bold text-white">The Headache: Messy Paper Books & Lost Bills</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  When a client asks for their previous treatment shade or invoice history, staff scrambles through stacks of handwritten paper diaries.
                </p>
                <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>SalonPro Solution:</strong> Instant client profile lookup showing past visits, used treatments, and complete invoice receipts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 3 */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div>
                <h4 className="text-base font-bold text-white">The Headache: End-of-Day Cash & Commission Confusion</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Calculating how much each hair stylist earned in commissions and reconciling UPI vs Cash payments takes the salon owner hours every night.
                </p>
                <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>SalonPro Solution:</strong> Automated daily reports showing cash collected, UPI payments, and exact staff commission amounts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pain Point 4 */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-lg shrink-0">
                ❌
              </div>
              <div>
                <h4 className="text-base font-bold text-white">The Headache: Clients Forget Appointments</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Over 25% of verbal phone appointments result in no-shows because clients simply forget their booked time slot.
                </p>
                <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>SalonPro Solution:</strong> Instant WhatsApp Cloud confirmation sent to client with date, time, stylist, and salon location.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: HOW IT WORKS (THE PRIYA SALON EXAMPLE) ================= */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-4 py-16 border-t border-neutral-800">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-2">Simple Multi-Tenant Workflow</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            How SalonPro Works in Your Salon (Example: &quot;Priya Salon&quot;)
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl mx-auto">
            Clean segregation between your internal salon operations and what your customers see.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-xl mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-white">Salon Owner Portal</h4>
              <div className="text-xs font-mono text-amber-400 mt-0.5">domain.com/salon-owner</div>
              <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                Priya Salon logs in daily using their password. They see their private Live Kanban chairs, appointment calendar, billing terminal, and cash drawer.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-800 text-[11px] text-amber-300 font-semibold">
              🔒 Strictly Private to Salon Staff
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between ring-1 ring-pink-500/30">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center font-black text-xl mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-white">Unique Customer Link</h4>
              <div className="text-xs font-mono text-pink-400 mt-0.5">domain.com/priya-salon</div>
              <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                Priya Salon puts their unique link on their Instagram bio and Google Maps profile. Customers click and see ONLY Priya Salon&apos;s brand, services, and available stylists.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-800 text-[11px] text-pink-300 font-semibold">
              🌐 Public Client Booking Page
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xl mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-white">Instant Client Sync</h4>
              <div className="text-xs font-mono text-emerald-400 mt-0.5">domain.com/portal</div>
              <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                When a customer books, it instantly pops up on Priya Salon&apos;s Kanban. The client gets a WhatsApp confirmation and can view their digital bill anytime at /portal.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-800 text-[11px] text-emerald-300 font-semibold">
              ✨ Permanent Client Records
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: CORE FEATURES & CAPABILITIES ================= */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 py-16 border-t border-neutral-800">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">Everything Included</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
            Built from Ground Up for Beauty & Wellness Studios
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800">
            <Calendar className="w-8 h-8 text-pink-400 mb-4" />
            <h4 className="font-bold text-base text-white">Smart Appointments Calendar</h4>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Day, week, and list views. Filter by stylist, mark customer arrivals with 1-click, and reschedule effortlessly.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800">
            <Scissors className="w-8 h-8 text-purple-400 mb-4" />
            <h4 className="font-bold text-base text-white">Live Studio Kanban</h4>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Track walk-in waiting queues, currently seated chairs, and completed sessions ready for POS billing.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800">
            <Receipt className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="font-bold text-base text-white">POS Billing with GST</h4>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Itemized service and product checkout. Handles CGST (9%) + SGST (9%), discounts, and split payments (Cash + UPI).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800">
            <Users className="w-8 h-8 text-amber-400 mb-4" />
            <h4 className="font-bold text-base text-white">Staff Commission Automation</h4>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Set separate commission percentages for services and retail products. Export transparent payroll reports.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800">
            <Award className="w-8 h-8 text-pink-400 mb-4" />
            <h4 className="font-bold text-base text-white">VIP Memberships & Discounts</h4>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Sell Gold or Platinum annual memberships. Member discounts are automatically pre-filled during billing checkout.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-neutral-900/50 border border-neutral-800">
            <TrendingUp className="w-8 h-8 text-teal-400 mb-4" />
            <h4 className="font-bold text-base text-white">Daily Cash & Sales Reports</h4>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              End-of-day tally with cash breakdown, UPI payments, gross profit, and top revenue-generating treatments.
            </p>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM CTA BANNER ================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-pink-500/15 via-purple-600/15 to-amber-500/15 border border-pink-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <h3 className="text-2xl sm:text-4xl font-black text-white">
            Ready to Automate Your Salon Operations?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 mt-3 max-w-lg mx-auto">
            Join hundreds of forward-thinking salons running with SalonPro. Setup takes less than 3 minutes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/salon-owner"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-pink-500/30 transition-all active:scale-95"
            >
              Sign In as Salon Owner ➔
            </Link>
            <Link
              href="/glow-studio"
              target="_blank"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs border border-neutral-700 transition-all"
            >
              View Client Booking Page Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-10 text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-white">SalonPro</span>
            <span>·</span>
            <span>Multi-Tenant Cloud Salon & Spa Suite</span>
          </div>

          <div className="flex items-center gap-5 text-neutral-400">
            <Link href="/salon-owner" className="hover:text-pink-400 transition-colors">
              Salon Owner Portal (/salon-owner)
            </Link>
            <span>·</span>
            <Link href="/portal" className="hover:text-emerald-400 transition-colors">
              Customer Portal (/portal)
            </Link>
            <span>·</span>
            <Link href="/admin" className="hover:text-amber-400 transition-colors">
              Master Admin (/admin)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
