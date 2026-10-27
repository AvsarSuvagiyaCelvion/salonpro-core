'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  Sparkles,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Plus,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // If on admin login page, render without admin layout shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function handleAdminLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  }

  const navItems = [
    { href: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
    { href: '/admin/salons', label: 'Salons Directory', icon: Building2 },
    { href: '/admin/owners', label: 'Owners & Staff', icon: Users },
    { href: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
    { href: '/admin/security', label: 'Admins & Security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Super Admin Banner */}
      <div className="bg-[#0f172a] text-amber-300 text-xs py-1.5 px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-slate-800">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Master Platform Admin · Multi-Tenant Cloud Architecture</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-300">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <span>Landing Page</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <span>·</span>
          <Link
            href="/salon-owner"
            target="_blank"
            className="flex items-center gap-1 hover:text-amber-300 transition-colors text-amber-400 font-bold"
          >
            <span>Salon Owner ERP</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">
                  SalonPro Admin
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Panel 1
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Platform Governance & Analytics
              </span>
            </div>
          </Link>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-amber-50/80 border border-amber-200/80 py-1.5 px-3 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-700">Platform Active (Supabase Cloud)</span>
          </div>

          <button
            onClick={handleAdminLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 py-1.5 px-3 rounded-xl transition-colors cursor-pointer border border-slate-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {loggingOut ? 'Signing out...' : 'Admin Sign Out'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Horizontal Scroll Menu */}
      <div className="md:hidden bg-white border-b border-slate-200 overflow-x-auto py-2 px-3 flex gap-2 no-scrollbar sticky top-16 z-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-1.5 rounded-xl font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/90 flex-col justify-between py-5 px-3 sticky top-16 h-[calc(100vh-4rem-1.75rem)] overflow-y-auto">
          <div className="space-y-6">
            <div>
              <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Platform Navigation
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                          : 'text-slate-700 hover:bg-amber-50/70 hover:text-amber-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Switcher Section */}
            <div className="pt-4 border-t border-slate-100">
              <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Role / Panel
              </div>
              <div className="space-y-1">
                <Link
                  href="/salon-owner"
                  target="_blank"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100/80 transition-colors border border-pink-200/60"
                >
                  <span className="flex items-center gap-2">
                    <span>💇</span>
                    <span>Salon Owner ERP</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-pink-500" />
                </Link>

                <Link
                  href="/glow-studio"
                  target="_blank"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 transition-colors border border-emerald-200/60"
                >
                  <span className="flex items-center gap-2">
                    <span>✨</span>
                    <span>Customer Booking</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-emerald-500" />
                </Link>
              </div>
            </div>
          </div>

          {/* Admin User Profile Box */}
          <div className="pt-4 border-t border-slate-100 px-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                A
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">Super Admin</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">Adminsalonpro@gmail.com</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
