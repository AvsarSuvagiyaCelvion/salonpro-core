'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Lock, User } from 'lucide-react';
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
      {/* Top Demo & Offer Announcement Ribbon in Regal Plum + Champagne Gold */}
      <div className="bg-[#4B263F] text-[#F1EBEF] text-[11px] sm:text-xs py-2 px-3 text-center font-medium tracking-wide flex items-center justify-center gap-2 relative z-50">
        <span className="bg-[#C69A5D] text-[#242126] px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
          7-Day Free Trial
        </span>
        <span className="hidden sm:inline">
          Test-drive SalonPro free for 7 days with zero upfront payment & no credit card required!
        </span>
        <span className="sm:hidden">
          7-Day Free Trial · Zero Upfront Payment!
        </span>
        <Link
          href="/register-salon"
          className="underline font-bold text-[#D4AD76] hover:text-white ml-1 whitespace-nowrap"
        >
          Start Free Trial ➔
        </Link>
      </div>

      <nav
        className={`sticky top-0 z-50 border-b transition-all duration-300 w-full max-w-full ${
          scrolled
            ? 'bg-[#F7F5F2]/90 dark:bg-[#151218]/90 backdrop-blur-xl shadow-xs border-[#E8E1E5] dark:border-[#3A3040] py-2.5 sm:py-3'
            : 'bg-[#F7F5F2]/95 dark:bg-[#151218]/95 backdrop-blur-md border-[#E8E1E5] dark:border-[#3A3040] py-3.5 sm:py-4.5'
        } px-3 sm:px-6`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#4B263F] dark:bg-[#2B2230] dark:border dark:border-[#3A3040] flex items-center justify-center font-black text-base sm:text-xl text-white dark:text-[#D6A0B4] shadow-md shadow-[#4B263F]/15 shrink-0 group-hover:rotate-12 transition-transform duration-300">
              ✂
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-xl text-[#242126] dark:text-[#F5EFF5] tracking-tight">
                SalonPro
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#77717A] dark:text-[#B5AAB8]">
            <a href="#problems" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">Problems We Solve</a>
            <a href="#features" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">Features & POS</a>
            <a href="#how-it-works" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-[#4B263F] dark:hover:text-[#D6A0B4] transition-colors flex items-center gap-1 font-bold text-[#4B263F] dark:text-[#D6A0B4]">
              <span>7-Day Trial & Pricing</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#F1EBEF] dark:bg-[#2B2230] text-[#4B263F] dark:text-[#D6A0B4] text-[9px] uppercase border border-[#E8E1E5] dark:border-[#3A3040]">Free</span>
            </a>
          </div>

          {/* Desktop Action CTAs + Theme Toggle */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            <Link
              href="/dixa-beauty-salon"
              target="_blank"
              className="px-3 py-2 rounded-xl text-[#2F7D68] dark:text-[#55B99A] bg-[#F1EBEF] dark:bg-[#211B24] hover:bg-white dark:hover:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1 shadow-xs hover:scale-105 active:scale-95"
            >
              <span>⚡ Live Booking Demo</span>
              <span className="text-[10px]">↗</span>
            </Link>
            <Link
              href="/salon-owner"
              className="px-3 py-2 rounded-xl text-[#242126] dark:text-[#F5EFF5] hover:text-[#4B263F] dark:hover:text-[#D6A0B4] hover:bg-[#F1EBEF] dark:hover:bg-[#2B2230] text-xs font-bold transition-all whitespace-nowrap"
            >
              Owner Sign In
            </Link>
            <Link
              href="/register-salon"
              className="px-4 py-2 rounded-xl bg-[#4B263F] hover:bg-[#3a1c30] text-white dark:bg-[#D6A0B4] dark:hover:bg-[#c48e9f] dark:text-[#151218] text-xs font-bold transition-all shadow-md shadow-[#4B263F]/20 active:scale-95 whitespace-nowrap flex items-center gap-1.5"
            >
              <span>🎁 Start 7-Day Free Trial</span>
              <span>➔</span>
            </Link>
          </div>

          {/* Mobile Right Controls (< 640px) */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <Link
              href="/register-salon"
              className="px-2.5 py-1.5 rounded-lg bg-[#4B263F] dark:bg-[#D6A0B4] text-white dark:text-[#151218] text-[11px] font-bold shadow-xs active:scale-95 whitespace-nowrap"
            >
              7-Day Trial ➔
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5] hover:bg-[#F1EBEF] dark:hover:bg-[#2B2230] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Animated Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide Drawer Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-[#F7F5F2] dark:bg-[#151218] shadow-2xl flex flex-col justify-between p-5 border-l border-[#E8E1E5] dark:border-[#3A3040] animate-in slide-in-from-right duration-200 text-[#242126] dark:text-[#F5EFF5]">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E1E5] dark:border-[#3A3040]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#4B263F] dark:bg-[#2B2230] text-white dark:text-[#D6A0B4] flex items-center justify-center font-bold text-sm">
                    ✂
                  </div>
                  <span className="font-extrabold text-base text-[#242126] dark:text-[#F5EFF5]">SalonPro</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#77717A] dark:text-[#B5AAB8] hover:bg-[#F1EBEF] dark:hover:bg-[#2B2230] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Portal Access Links */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#77717A] dark:text-[#B5AAB8] px-2">
                  Salon Portals
                </div>
                <Link
                  href="/register-salon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#4B263F] dark:bg-[#D6A0B4] text-white dark:text-[#151218] font-bold text-xs shadow-md shadow-[#4B263F]/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🎁</span>
                    <div>
                      <div>Start 7-Day Free Trial</div>
                      <div className="text-[10px] text-[#D4AD76] dark:text-[#4B263F] font-semibold">₹0 setup · No card needed</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/salon-owner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F1EBEF] dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] text-[#4B263F] dark:text-[#D6A0B4] font-bold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#C69A5D]" />
                    <span>Existing Owner Sign In</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] text-[#242126] dark:text-[#F5EFF5] font-semibold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#77717A] dark:text-[#B5AAB8]" />
                    <span>Client Portal & Receipts</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#77717A]" />
                </Link>
              </div>

              {/* Section Anchors */}
              <div className="space-y-1 pt-2 border-t border-[#E8E1E5] dark:border-[#3A3040]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#77717A] dark:text-[#B5AAB8] px-2 mb-1">
                  Explore
                </div>
                <a
                  href="#problems"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-semibold text-[#242126] dark:text-[#F5EFF5] hover:bg-[#F1EBEF] dark:hover:bg-[#2B2230]"
                >
                  Problems We Solve
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-semibold text-[#242126] dark:text-[#F5EFF5] hover:bg-[#F1EBEF] dark:hover:bg-[#2B2230]"
                >
                  Features & POS
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-semibold text-[#242126] dark:text-[#F5EFF5] hover:bg-[#F1EBEF] dark:hover:bg-[#2B2230]"
                >
                  How It Works
                </a>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-[#E8E1E5] dark:border-[#3A3040] text-[11px] text-[#77717A] dark:text-[#B5AAB8] text-center">
              SalonPro Salon Management Platform
            </div>
          </div>
        </div>
      )}
    </>
  );
}
