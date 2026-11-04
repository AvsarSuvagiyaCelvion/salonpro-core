import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  ExternalLink,
  Lock,
  Calendar,
  Receipt,
  Scissors,
  Users,
} from 'lucide-react';

export default function LandingFooter() {
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '8320653782';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'avsarsuvagiya968@gmail.com';

  return (
    <footer className="relative z-10 bg-slate-950 text-slate-400 pt-16 sm:pt-20 pb-12 border-t border-slate-800">
      {/* Background Soft Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-pink-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-12 pb-14 border-b border-slate-800/80">
          {/* Column 1: Brand & Overview (Spans 2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 inline-flex">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] flex items-center justify-center font-black text-xl text-white shadow-lg shadow-pink-900/30">
                ✂
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl text-white tracking-tight leading-none">
                  SalonPro
                </span>
                <span className="text-[10px] text-pink-300 font-semibold tracking-wider uppercase mt-1">
                  Operating System for Salons
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The modern all-in-one salon management suite built for hair studios, beauty parlours, unisex salons, and luxury wellness spas across India.
            </p>

            {/* Direct Contact Pills */}
            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/91${supportPhone}?text=Hello%20SalonPro%20Team,%20I%20am%20interested%20in%20a%20live%20walkthrough.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>WhatsApp: +91 {supportPhone}</span>
              </a>
              <div className="block">
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{supportEmail}</span>
                </a>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                <span>256-Bit SSL Encrypted</span>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>GST Tax Compliant</span>
              </span>
            </div>
          </div>

          {/* Column 2: Product & Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Features & Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-pink-400 transition-colors">
                  Client Booking Engine
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-pink-400 transition-colors">
                  Live Studio Kanban Floor
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-pink-400 transition-colors">
                  10-Second GST POS Billing
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-pink-400 transition-colors">
                  Staff Commission Tracker
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-pink-400 transition-colors">
                  Meta WhatsApp Receipts
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-pink-400 transition-colors">
                  VIP Memberships & Passes
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-pink-400 transition-colors">
                  End-of-Day Cash Audits
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Live Portals & Demos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Live Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/dixa-beauty-salon"
                  target="_blank"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <span>⚡ Live Booking Demo</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/salon-owner" className="hover:text-pink-400 transition-colors inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Salon Owner Sign In</span>
                </Link>
              </li>
              <li>
                <Link href="/register-salon" className="hover:text-pink-400 transition-colors text-pink-300 font-bold">
                  Start 7-Day Free Trial
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-pink-400 transition-colors">
                  Customer Appointment Portal
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-pink-400 transition-colors text-slate-500">
                  Platform Admin Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Subscription Pricing
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/91${supportPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Help Desk & Onboarding
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip: Copyright + Payment Logos + System Status */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center md:text-left">
          <div className="space-y-1">
            <p className="text-slate-400 font-medium">
              © {new Date().getFullYear()} SalonPro Software Platform. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-600">
              Designed & engineered for professional salons, studios, and wellness spas across India.
            </p>
          </div>

          {/* Supported Payment Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">UPI / QR</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">GPay</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">PhonePe</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">RuPay</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Visa</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Mastercard</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">NetBanking</span>
          </div>

          {/* Status Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

