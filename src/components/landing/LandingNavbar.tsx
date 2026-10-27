'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles, Building2, Lock, User, ArrowRight } from 'lucide-react';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 w-full max-w-full">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] flex items-center justify-center font-black text-base sm:text-xl text-white shadow-md shadow-pink-900/10 shrink-0">
              ✂
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-xl text-slate-900 tracking-tight">
                SalonPro
              </span>
              <span className="hidden sm:inline-flex text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-pink-50 text-[#b3135b] border border-pink-200">
                SaaS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#problems" className="hover:text-[#b3135b] transition-colors">Problems We Solve</a>
            <a href="#features" className="hover:text-[#b3135b] transition-colors">Features & POS</a>
            <a href="#how-it-works" className="hover:text-[#b3135b] transition-colors">How It Works</a>
          </div>

          {/* Desktop Action CTAs */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/salon-owner"
              className="px-3 py-2 rounded-xl text-slate-700 hover:text-[#b3135b] hover:bg-pink-50 text-xs font-bold transition-all whitespace-nowrap"
            >
              Owner Sign In
            </Link>
            <Link
              href="/register-salon"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white text-xs font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap"
            >
              Register Salon ➔
            </Link>
          </div>

          {/* Mobile Right Controls (< 640px) */}
          <div className="flex sm:hidden items-center gap-1.5">
            <Link
              href="/register-salon"
              className="px-2.5 py-1.5 rounded-lg bg-[#b3135b] text-white text-[11px] font-bold shadow-xs active:scale-95 whitespace-nowrap"
            >
              Register
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
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
          <div className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between p-5 animate-slide-left border-l border-neutral-200">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white flex items-center justify-center font-bold text-sm">
                    ✂
                  </div>
                  <span className="font-extrabold text-base text-slate-900">SalonPro</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Portal Access Links */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2">
                  Salon Portals
                </div>
                <Link
                  href="/register-salon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#b3135b] to-[#d62475] text-white font-bold text-xs shadow-md shadow-pink-900/15"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4" />
                    <span>Register Your Salon</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/salon-owner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-pink-50 border border-pink-200 text-[#b3135b] font-bold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4" />
                    <span>Salon Owner Sign In</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/portal"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Client Portal & Receipts</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

              {/* Section Anchors */}
              <div className="space-y-1 pt-2 border-t border-neutral-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-1">
                  Explore
                </div>
                <a
                  href="#problems"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Problems We Solve
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Features & POS
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  How It Works
                </a>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-neutral-100 text-[11px] text-slate-400 text-center">
              SalonPro Multi-Tenant Cloud SaaS
            </div>
          </div>
        </div>
      )}
    </>
  );
}
