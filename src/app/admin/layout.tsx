'use client';

import React, { useState, useEffect } from 'react';
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
  CreditCard,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [admin, setAdmin] = useState<{ email: string; name: string; role: string } | null>(null);

  useEffect(() => {
    async function loadAdmin() {
      try {
        const res = await fetch('/api/admin/auth');
        const data = await res.json();
        if (data.loggedIn && data.admin) {
          setAdmin(data.admin);
        } else if (pathname !== '/admin/login') {
          window.location.href = `/admin/login?returnUrl=${encodeURIComponent(pathname)}`;
        }
      } catch {
        if (pathname !== '/admin/login') {
          window.location.href = `/admin/login?returnUrl=${encodeURIComponent(pathname)}`;
        }
      }
    }
    loadAdmin();
  }, [pathname]);

  // If on admin login page, render without admin layout shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function handleAdminLogout() {
    setMobileMenuOpen(false);
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Continue client purge
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      window.location.href = '/admin/login';
    }
  }

  const navItems = [
    { href: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
    { href: '/admin/salons', label: 'Salons Directory', icon: Building2 },
    { href: '/admin/plans', label: 'Subscription Plans', icon: CreditCard },
    { href: '/admin/owners', label: 'Owners & Staff', icon: Users },
    { href: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
    { href: '/admin/security', label: 'Admins & Security', icon: ShieldCheck },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-amber-500 selection:text-white overflow-hidden">
      {/* Top Super Admin Banner */}
      <div className="shrink-0 bg-[#0f172a] text-amber-300 text-xs py-1.5 px-3 sm:px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Master Platform Admin<span className="hidden sm:inline"> · Multi-Tenant Cloud Architecture</span></span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-300 shrink-0">
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
      <header className="shrink-0 h-14 sm:h-16 bg-white border-b border-slate-200/90 z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0">
              👑
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight leading-tight truncate">
                  SalonPro Admin
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                  Panel 1
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block truncate">
                Platform Governance & Analytics
              </span>
            </div>
          </Link>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-amber-50/80 border border-amber-200/80 py-1.5 px-3 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-700">Platform Active (Supabase Cloud)</span>
          </div>

          <button
            onClick={handleAdminLogout}
            disabled={loggingOut}
            title="Sign out of Admin"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 p-2 sm:py-1.5 sm:px-3 rounded-xl transition-colors cursor-pointer border border-slate-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {loggingOut ? 'Signing out...' : 'Admin Sign Out'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Animated Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide Drawer Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col p-4 sm:p-5 animate-slide-left border-r border-slate-200 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 no-scrollbar pr-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm">
                    👑
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                      SalonPro Admin
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Super Admin Panel
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 mb-2">
                  Platform Menu
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                          : 'text-slate-700 hover:bg-slate-100 hover:translate-x-1'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-950" />}
                    </Link>
                  );
                })}
              </nav>

              {/* Switch to Other Panels */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2">
                  Switch to Other Panels
                </div>
                <Link
                  href="/salon-owner"
                  target="_blank"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-pink-700 bg-pink-50 border border-pink-200/60 transition-all hover:bg-pink-100/70"
                >
                  <span className="flex items-center gap-2">
                    <span>💇</span>
                    <span>Salon Owner ERP</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-pink-500" />
                </Link>
                <Link
                  href="/portal"
                  target="_blank"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 transition-all hover:bg-emerald-100/70"
                >
                  <span className="flex items-center gap-2">
                    <span>📱</span>
                    <span>Customer Portal</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-emerald-500" />
                </Link>
              </div>
            </div>

            {/* Bottom Admin User Box */}
            <div className="shrink-0 pt-3 border-t border-slate-100 space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs uppercase">
                  {admin?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {admin?.name || 'Super Admin'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {admin?.email || 'admin@salonpro.in'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdminLogout}
                disabled={loggingOut}
                className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>{loggingOut ? 'Signing out...' : 'Admin Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop & Large Screens) */}
        <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-slate-200/90 flex-col h-full shrink-0 select-none">
          {/* Scrollable nav items section */}
          <div className="flex-1 overflow-y-auto py-3.5 px-3 space-y-3 no-scrollbar">
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Platform Navigation
              </div>
              <nav className="space-y-0.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
            <div className="pt-2.5 border-t border-slate-100">
              <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Role / Panel
              </div>
              <div className="space-y-1">
                <Link
                  href="/salon-owner"
                  target="_blank"
                  className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100/80 transition-colors border border-pink-200/60"
                >
                  <span className="flex items-center gap-2">
                    <span>💇</span>
                    <span>Salon Owner ERP</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-pink-500" />
                </Link>

                <Link
                  href="/portal"
                  target="_blank"
                  className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 transition-colors border border-emerald-200/60"
                >
                  <span className="flex items-center gap-2">
                    <span>📱</span>
                    <span>Customer Portal</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-emerald-500" />
                </Link>
              </div>
            </div>
          </div>

          {/* Admin User Profile Box - Pinned firmly at bottom */}
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/60 shrink-0">
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs uppercase shrink-0">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {admin?.name || 'Super Admin'}
                </div>
                <div
                  className="text-[11px] text-slate-500 font-mono truncate"
                  title={admin?.email || 'admin@salonpro.in'}
                >
                  {admin?.email || 'admin@salonpro.in'}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area - only this scrolls when user scrolls! */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 w-full max-w-full touch-scroll">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
