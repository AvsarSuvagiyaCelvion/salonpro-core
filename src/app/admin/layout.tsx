'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // If on admin login page, render without admin layout shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function handleAdminLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const navItems = [
    { href: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
    { href: '/admin/salons', label: 'Salons Directory', icon: Building2 },
    { href: '/admin/owners', label: 'Owners & Staff', icon: Users },
    { href: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#07070a] text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Admin Bar */}
      <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-neutral-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">SalonPro Super Admin</span>
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Main Admin
              </span>
            </div>
            <div className="text-[10px] text-neutral-400">Multi-Salon Global Management Platform</div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick link to root launcher */}
          <a
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-all"
          >
            <span>Launchpad Hub</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>

          {/* Quick link to Salon Owner */}
          <a
            href="/app"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-pink-300 hover:text-white text-xs font-semibold transition-all"
          >
            <span>Open Salon Owner Panel</span>
            <ExternalLink className="w-3 h-3 text-pink-500" />
          </a>

          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Sub Navigation Tabs */}
      <div className="border-b border-neutral-800 bg-neutral-900/40 px-4 sm:px-8 overflow-x-auto">
        <div className="flex gap-2 py-2 max-w-7xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
