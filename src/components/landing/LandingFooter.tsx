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
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'studiodeskapp@gmail.com';

  return (
    <footer className="relative z-10 bg-white dark:bg-[#080B12] text-[#6B7280] dark:text-[#A0A8B8] pt-16 sm:pt-20 pb-12 border-t border-[#E5E7EB] dark:border-[#2A2F3A] transition-colors duration-300">
      {/* Background Soft Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-[#D4A77F]/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-12 pb-14 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
          {/* Column 1: Brand & Overview (Spans 2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <Link href="/" className="flex flex-col text-left inline-flex">
              <span className="font-black text-2xl sm:text-3xl text-[#1F2937] dark:text-[#FFFFFF] tracking-tight leading-none">
                Studio<span className="text-[#D4A77F]">Desk</span>
              </span>
              <span className="text-xs text-[#D4A77F] font-semibold tracking-wider uppercase mt-1.5">
                Operating System for Salons &amp; Studios
              </span>
            </Link>

            <p className="text-sm sm:text-[15px] text-[#6B7280] dark:text-[#A0A8B8] leading-relaxed max-w-sm mx-auto md:mx-0">
              The modern all-in-one salon management suite built for hair studios, beauty parlours, unisex salons, and luxury wellness spas across India.
            </p>

            {/* Direct Contact Pills */}
            <div className="space-y-2.5 pt-2 flex flex-col items-center md:items-start w-full">
              <a
                href={`https://wa.me/91${supportPhone}?text=Hello%20StudioDesk%20Team,%20I%20am%20interested%20in%20a%20live%20walkthrough.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center md:justify-start gap-2 text-sm sm:text-[15px] font-semibold text-[#10B981] hover:opacity-85 transition-opacity"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>WhatsApp: +91 {supportPhone}</span>
              </a>
              <div className="block">
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center justify-center md:justify-start gap-1.5 text-sm sm:text-[15px] text-[#6B7280] hover:text-[#1F2937] dark:text-[#A0A8B8] dark:hover:text-[#FFFFFF] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#D4A77F]" />
                  <span>{supportEmail}</span>
                </a>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-3 flex flex-wrap justify-center md:justify-start gap-2 text-xs sm:text-[13px]">
              <span className="px-3 py-1.5 rounded-xl bg-[#F3F4F6] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#1F2937] dark:text-[#FFFFFF] font-medium inline-flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#D4A77F]" />
                <span>256-Bit SSL Encrypted</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#F3F4F6] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#1F2937] dark:text-[#FFFFFF] font-medium inline-flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>GST Tax Compliant</span>
              </span>
            </div>
          </div>

          {/* Column 2: Product & Modules */}
          <div className="space-y-4 text-center md:text-left">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#1F2937] dark:text-[#FFFFFF]">
              Features & Modules
            </h4>
            <ul className="space-y-3 text-sm sm:text-[15px] flex flex-col items-center md:items-start">
              <li>
                <Link href="/#features" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
                  Client Booking Engine
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
                  Live Studio Kanban Floor
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
                  10-Second GST POS Billing
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
                  Staff Commission Tracker
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
                  WhatsApp Digital Receipts
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
                  VIP Memberships &amp; Passes
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
                  End-of-Day Cash Audits
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Live Portals & Demos */}
          <div className="space-y-4 text-center md:text-left">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#1F2937] dark:text-[#FFFFFF]">
              Portals &amp; Access
            </h4>
            <ul className="space-y-3 text-sm sm:text-[15px] flex flex-col items-center md:items-start">
              <li>
                <Link href="/salon-owner" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors inline-flex items-center justify-center md:justify-start gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#A0A8B8]" />
                  <span>Salon Owner Sign In</span>
                </Link>
              </li>
              <li>
                <Link href="/register-salon" className="text-[#D4A77F] font-bold hover:underline inline-flex items-center justify-center md:justify-start">
                  Start 7-Day Free Trial
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors inline-flex items-center justify-center md:justify-start">
                  Customer Appointment Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="space-y-4 text-center md:text-left">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#1F2937] dark:text-[#FFFFFF]">
              Legal & Support
            </h4>
            <ul className="space-y-3 text-sm sm:text-[15px] flex flex-col items-center md:items-start">
              <li>
                <Link href="/terms" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors inline-flex items-center justify-center md:justify-start">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors inline-flex items-center justify-center md:justify-start">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors inline-flex items-center justify-center md:justify-start">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors inline-flex items-center justify-center md:justify-start">
                  Subscription Pricing
                </Link>
              </li>
              <li>
                <a
                  href={`https://wa.me/91${supportPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors inline-flex items-center justify-center md:justify-start"
                >
                  Help Desk & Onboarding
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip: Clean, balanced copyright & quick legal links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm sm:text-[15px] text-[#6B7280] dark:text-[#A0A8B8] text-center sm:text-left">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold">
              © 2026 StudioDesk. All rights reserved.
            </p>
            <p className="text-xs sm:text-[13px] text-[#6B7280] dark:text-[#A0A8B8]">
              Designed &amp; engineered for modern salons, studios, and wellness spas.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2 text-sm sm:text-[15px]">
            <Link href="/terms" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
