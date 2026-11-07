'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Lock, User, ExternalLink } from 'lucide-react';
import ThemeToggle from '@/components/landing/ThemeToggle';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Demo & Offer Announcement Ribbon in Deep Charcoal + Champagne Gold */}
      <div className="bg-[#10141F] text-[#A0A8B8] text-[10px] sm:text-xs py-1.5 px-3 text-center font-medium tracking-wide flex items-center justify-center gap-2 relative z-50 border-b border-[#2A2F3A]">
        <span className="bg-[#D4A77F] text-[#080B12] px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0">
          7-Day Free Trial
        </span>
        <span className="hidden md:inline">
          Test-drive SalonPro free for 7 days with zero upfront payment &amp; no credit card required!
        </span>
        <span className="md:hidden text-[10px] text-white/90 truncate max-w-[180px]">
          Zero Upfront Payment
        </span>
        <Link
          href="/register-salon"
          className="font-bold text-[#D4A77F] hover:text-white underline text-[10px] sm:text-xs whitespace-nowrap shrink-0"
        >
          Start ➔
        </Link>
      </div>

      <nav
        className={`sticky top-0 z-50 border-b transition-all duration-300 w-full max-w-full ${
          scrolled
            ? 'bg-white/95 dark:bg-[#080B12]/95 backdrop-blur-xl shadow-xs border-[#E5E7EB] dark:border-[#2A2F3A] py-2 sm:py-2.5'
            : 'bg-white/95 dark:bg-[#080B12]/95 backdrop-blur-md border-[#E5E7EB] dark:border-[#2A2F3A] py-3 sm:py-3.5'
        } px-3 sm:px-6`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* 1. Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] flex items-center justify-center font-black text-sm sm:text-base text-[#D4A77F] shadow-sm shrink-0 group-hover:rotate-12 transition-transform duration-300">
              ✂
            </div>
            <span className="font-bold text-lg sm:text-xl text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
              Salon<span className="text-[#D4A77F]">Pro</span>
            </span>
          </Link>

          {/* 2. Center: Minimal, Clear Navigation Links (Desktop lg+) */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 font-sans font-medium text-[14px] xl:text-[15px] text-[#6B7280] dark:text-[#A0A8B8] whitespace-nowrap">
            <Link
              href="/#features"
              className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors whitespace-nowrap"
            >
              Features &amp; POS
            </Link>
            <Link
              href="/#how-it-works"
              className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors whitespace-nowrap"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Pricing</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-[#1C2230] text-[#8C5E35] dark:text-[#D4A77F] text-[9px] font-semibold uppercase border border-[#E5E7EB] dark:border-[#2A2F3A]">
                7 Days Free
              </span>
            </Link>
          </div>

          {/* 3. Right: Streamlined, Non-Confusing Actions (Desktop lg+) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Quiet Secondary Action */}
            <Link
              href="/salon-owner"
              className="px-3 py-2 rounded-xl text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white font-sans font-medium text-[14px] transition-colors whitespace-nowrap"
            >
              Owner Sign In
            </Link>

            {/* Single Clear Primary CTA in Champagne Gold */}
            <Link
              href="/register-salon"
              className="px-4.5 py-2 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-sans font-semibold text-[14px] shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <span>Start Free Trial</span>
              <span>➔</span>
            </Link>
          </div>

          {/* 4. Mobile / Tablet Controls (< lg) */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />

            <Link
              href="/register-salon"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-[#D4A77F] text-[#080B12] text-xs font-semibold shadow-xs active:scale-95 whitespace-nowrap"
            >
              Free Trial ➔
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#1F2937] dark:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] cursor-pointer shrink-0 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Animated Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide Drawer Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#10141F] shadow-2xl flex flex-col justify-between p-5 border-l border-[#E5E7EB] dark:border-[#2A2F3A] animate-in slide-in-from-right duration-200 text-[#1F2937] dark:text-[#FFFFFF] overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#10141F] dark:bg-[#141926] text-[#D4A77F] border border-[#2A2F3A] flex items-center justify-center font-bold text-sm">
                    ✂
                  </div>
                  <span className="font-bold text-base text-[#1F2937] dark:text-[#FFFFFF]">
                    Salon<span className="text-[#D4A77F]">Pro</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#6B7280] dark:text-[#A0A8B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] rounded-lg cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Actions */}
              <div className="space-y-2">
                <Link
                  href="/register-salon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#D4A77F] text-[#080B12] font-semibold text-xs shadow-md shadow-[#D4A77F]/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🎁</span>
                    <div>
                      <div className="font-bold">Start 7-Day Free Trial</div>
                      <div className="text-[10px] text-[#080B12]/80">₹0 setup · No credit card</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/dixa-beauty-salon"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-semibold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span>⚡</span>
                    <span>Try Live Booking Demo</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <a
                  href="/api/demo/owner-login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-semibold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span>🖥️</span>
                    <span>Try Owner Dashboard Demo</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <Link
                  href="/salon-owner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F3F4F6] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#1F2937] dark:text-[#FFFFFF] font-medium text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#D4A77F]" />
                    <span>Owner Sign In</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 pt-2 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-[#747D8D] px-2 py-1">
                  Navigation
                </div>
                <Link
                  href="/#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF]"
                >
                  Features &amp; POS Billing
                </Link>
                <Link
                  href="/#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF]"
                >
                  How It Works
                </Link>
                <Link
                  href="/#problems"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF]"
                >
                  Problems We Solve
                </Link>
                <Link
                  href="/#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF]"
                >
                  7-Day Trial &amp; Pricing
                </Link>
                <Link
                  href="/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF]"
                >
                  <User className="w-3.5 h-3.5 text-[#D4A77F]" />
                  <span>Customer Portal</span>
                </Link>
              </div>
            </div>

            {/* Bottom Contact Help */}
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#2A2F3A] text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
              <p>Need setup assistance?</p>
              <a
                href="https://wa.me/918320653782?text=Hello%20SalonPro%20Team,%20I%20need%20help%20setting%20up%20my%20salon."
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#10B981] hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <span>WhatsApp: +91 8320653782</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
