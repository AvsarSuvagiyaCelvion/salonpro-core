import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  User,
  Sparkles,
  ArrowRight,
  Calendar,
  Receipt,
  Users,
  CreditCard,
  Scissors,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const metadata = {
  title: 'SalonPro - 3-Tier Multi-Tenant Salon & Spa Platform',
  description: 'Main Admin, Salon Owner ERP, and Customer Self-Service Portal',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07070a] text-neutral-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Top Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-gradient-to-br from-amber-500/10 via-pink-500/10 to-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[450px] bg-gradient-to-tr from-purple-600/10 to-pink-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-pink-500/25">
              ✂
            </div>
            <div>
              <div className="font-black text-lg text-white tracking-tight flex items-center gap-2">
                <span>SalonPro</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Enterprise
                </span>
              </div>
              <div className="text-[10px] text-neutral-400">Complete 3-Panel Architecture</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">Live Production System</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-14 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Unified Salon Management & Booking Ecosystem</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
          One Platform. <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">3 Dedicated Panels.</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 mt-4 max-w-2xl mx-auto leading-relaxed">
          Full segregation between <strong>Main Admin</strong> (Platform governance), <strong>Salon Owner</strong> (Daily studio operations & POS), and <strong>Customer</strong> (Self-service bookings & digital receipts).
        </p>
      </section>

      {/* The 3 Dedicated Panels Grid */}
      <section className="relative z-10 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ================= PANEL 1: MAIN ADMIN ================= */}
          <div className="group relative bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/40">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-2xl shadow-md">
                  👑
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Panel 1
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-white">Main Admin</h2>
              <div className="text-xs text-amber-400/90 font-medium mt-0.5">Platform Super Admin</div>
              <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                Platform-wide control over all registered salon branches, revenue analytics, owner accounts, and global platform governance.
              </p>

              <div className="mt-5 space-y-2 border-t border-neutral-800/80 pt-4 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Register & Manage Salons</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Platform Gross Volume & Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Salon Owners Master Directory</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-800/80">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 mb-3 text-[11px] text-neutral-400 font-mono">
                <div>Email: <strong className="text-amber-300">admin@salonpro.com</strong></div>
                <div>Pass: <strong className="text-amber-300">Admin@2136</strong></div>
              </div>

              <Link
                href="/admin"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Launch Main Admin Panel</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ================= PANEL 2: SALON OWNER & STAFF ================= */}
          <div className="group relative bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800 hover:border-pink-500/50 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/40 ring-1 ring-pink-500/20">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center font-black text-2xl shadow-md">
                  💇
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  Panel 2
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-white">Salon Owner & Staff</h2>
              <div className="text-xs text-pink-400/90 font-medium mt-0.5">Salon ERP & POS Studio</div>
              <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                Day-to-day salon operations: Real-time appointments, Live Studio Kanban, POS Billing with GST, Staff commissions, and Products.
              </p>

              <div className="mt-5 space-y-2 border-t border-neutral-800/80 pt-4 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>Live Studio Kanban & Waiting Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>POS Billing, GST & WhatsApp Receipts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>Staff Commissions & VIP Memberships</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-800/80">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 mb-3 text-[11px] text-neutral-400 font-mono">
                <div>Email: <strong className="text-pink-300">avsarsuvagiya968@gmail.com</strong></div>
                <div>Pass: <strong className="text-pink-300">Av$@r2136</strong></div>
              </div>

              <Link
                href="/app"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Launch Salon Owner ERP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ================= PANEL 3: CUSTOMER PORTAL ================= */}
          <div className="group relative bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/50 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/40">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-2xl shadow-md">
                  ✨
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Panel 3
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-white">Customer Portal</h2>
              <div className="text-xs text-emerald-400/90 font-medium mt-0.5">Client Self-Service & Booking</div>
              <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                Dedicated client area to book appointments, review upcoming visits, view itemized digital receipts, and track VIP discounts.
              </p>

              <div className="mt-5 space-y-2 border-t border-neutral-800/80 pt-4 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Real-Time Slot Booking Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Permanent Visit & Bill History</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Printable GST Receipts & VIP Perks</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-800/80">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 mb-3 text-[11px] text-neutral-400 font-mono">
                <div>Client Mobile: <strong className="text-emerald-300">9898023456</strong></div>
                <div>Demo PIN: <strong className="text-emerald-300">1234</strong></div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/portal"
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>Client Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/glow-studio"
                  className="px-4 py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-all flex items-center justify-center"
                  title="Book an Appointment"
                >
                  Book 🗓️
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>SalonPro Enterprise · PostgreSQL & Next.js 16 Multi-Tenant Architecture</div>
          <div className="flex items-center gap-4 text-neutral-400">
            <Link href="/admin" className="hover:text-amber-400">Main Admin</Link>
            <span>·</span>
            <Link href="/app" className="hover:text-pink-400">Salon Owner</Link>
            <span>·</span>
            <Link href="/portal" className="hover:text-emerald-400">Customer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
