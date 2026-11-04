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
    <footer className="relative z-10 bg-[#F7F5F2] dark:bg-[#151218] text-[#77717A] dark:text-[#B5AAB8] pt-16 sm:pt-20 pb-12 border-t border-[#E8E1E5] dark:border-[#3A3040] transition-colors duration-300">
      {/* Background Soft Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-[#B77A91]/15 dark:from-[#D6A0B4]/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-12 pb-14 border-b border-[#E8E1E5] dark:border-[#3A3040]">
          {/* Column 1: Brand & Overview (Spans 2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 inline-flex">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4B263F] to-[#B77A91] dark:from-[#D6A0B4] dark:to-[#B77A91] flex items-center justify-center font-black text-xl text-white shadow-md shadow-[#4B263F]/20">
                ✂
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl text-[#242126] dark:text-[#F5EFF5] tracking-tight leading-none">
                  SalonPro
                </span>
                <span className="text-[10px] text-[#B77A91] dark:text-[#D6A0B4] font-semibold tracking-wider uppercase mt-1">
                  Operating System for Salons
                </span>
              </div>
            </Link>

            <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] leading-relaxed max-w-sm">
              The modern all-in-one salon management suite built for hair studios, beauty parlours, unisex salons, and luxury wellness spas across India.
            </p>

            {/* Direct Contact Pills */}
            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/91${supportPhone}?text=Hello%20SalonPro%20Team,%20I%20am%20interested%20in%20a%20live%20walkthrough.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#2F7D68] dark:text-[#55B99A] hover:opacity-85 transition-opacity"
              >
                <span className="w-2 h-2 rounded-full bg-[#2F7D68] dark:bg-[#55B99A] animate-pulse" />
                <span>WhatsApp: +91 {supportPhone}</span>
              </a>
              <div className="block">
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center gap-1.5 text-xs text-[#77717A] hover:text-[#4B263F] dark:text-[#B5AAB8] dark:hover:text-[#F5EFF5] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#B77A91] dark:text-[#D6A0B4]" />
                  <span>{supportEmail}</span>
                </a>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5] font-medium inline-flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B77A91] dark:text-[#D6A0B4]" />
                <span>256-Bit SSL Encrypted</span>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5] font-medium inline-flex items-center gap-1 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D68] dark:text-[#55B99A]" />
                <span>GST Tax Compliant</span>
              </span>
            </div>
          </div>

          {/* Column 2: Product & Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#242126] dark:text-[#F5EFF5]">
              Features & Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">
                  Client Booking Engine
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">
                  Live Studio Kanban Floor
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">
                  10-Second GST POS Billing
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">
                  Staff Commission Tracker
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">
                  Meta WhatsApp Receipts
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">
                  VIP Memberships & Passes
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">
                  End-of-Day Cash Audits
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Live Portals & Demos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#242126] dark:text-[#F5EFF5]">
              Live Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/dixa-beauty-salon"
                  target="_blank"
                  className="text-[#2F7D68] dark:text-[#55B99A] font-semibold inline-flex items-center gap-1 hover:underline"
                >
                  <span>⚡ Live Booking Demo</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/salon-owner" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#77717A] dark:text-[#B5AAB8]" />
                  <span>Salon Owner Sign In</span>
                </Link>
              </li>
              <li>
                <Link href="/register-salon" className="text-[#4B263F] dark:text-[#D6A0B4] font-bold hover:underline">
                  Start 7-Day Free Trial
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">
                  Customer Appointment Portal
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors text-[#77717A] dark:text-[#B5AAB8]">
                  Platform Admin Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#242126] dark:text-[#F5EFF5]">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-[#4B263F] dark:hover:text-[#F5EFF5] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#4B263F] dark:hover:text-[#F5EFF5] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#4B263F] dark:hover:text-[#F5EFF5] transition-colors">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#4B263F] dark:hover:text-[#F5EFF5] transition-colors">
                  Subscription Pricing
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/91${supportPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#4B263F] dark:hover:text-[#F5EFF5] transition-colors"
                >
                  Help Desk & Onboarding
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip: Copyright + Payment Logos + System Status */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#77717A] dark:text-[#B5AAB8] text-center md:text-left">
          <div className="space-y-1">
            <p className="text-[#242126] dark:text-[#F5EFF5] font-medium">
              © 2026 SalonPro Software Platform. All rights reserved.
            </p>
            <p className="text-[11px] text-[#77717A] dark:text-[#B5AAB8]">
              Designed & engineered for professional salons, studios, and wellness spas across India.
            </p>
          </div>

          {/* Supported Payment Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
            <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5]">UPI / QR</span>
            <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5]">GPay</span>
            <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5]">PhonePe</span>
            <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5]">RuPay</span>
            <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5]">Visa</span>
            <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5]">Mastercard</span>
            <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5]">NetBanking</span>
          </div>

          {/* Status Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[11px] text-[#242126] dark:text-[#F5EFF5] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#2F7D68] dark:bg-[#55B99A] animate-pulse" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
