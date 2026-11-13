'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import ThemeToggle from '@/components/landing/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [admin, setAdmin] = useState<{ email: string; name: string; role: string } | null>(null);

  useEffect(() => {
    if (admin) return;
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
  }, [pathname, admin]);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

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
      window.location.replace('/admin/login');
    }
  }

  const isSuperAdmin = admin?.role === 'super_admin';

  const navItems = [
    { href: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
    { href: '/admin/salons', label: 'Salons Directory', icon: Building2 },
    { href: '/admin/plans', label: 'Subscription Plans', icon: CreditCard },
    { href: '/admin/owners', label: 'Owners & Staff', icon: Users },
    { href: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
    ...(isSuperAdmin
      ? [{ href: '/admin/security', label: 'Admins & Security', icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] font-sans selection:bg-[#D4A77F] selection:text-[#080B12] overflow-x-hidden lg:overflow-hidden transition-colors duration-300">
      {/* Top Super Admin Banner */}
      <div className="shrink-0 bg-[#10141F] text-[#D4A77F] text-xs py-1.5 px-3 sm:px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-[#2A2F3A]">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4A77F] shrink-0" />
          <span className="truncate">
            {isSuperAdmin
              ? '👑 Master Super Admin · Full Root Platform Authority'
              : '🛡️ Platform Admin · Salons & Analytics Management'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#A0A8B8] shrink-0">
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
            className="flex items-center gap-1 hover:text-[#B8905F] transition-colors text-[#D4A77F] font-bold"
          >
            <span>Salon Owner ERP</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Top Header */}
      <header className="shrink-0 h-14 sm:h-16 bg-white dark:bg-[#10141F] border-b border-[#E5E7EB] dark:border-[#2A2F3A] z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-[#1F2937] dark:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] focus:outline-none cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4A77F] text-[#080B12] flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0">
              👑
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF] tracking-tight leading-tight truncate">
                  SalonPro Admin
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] border border-[#D4A77F]/30 shrink-0">
                  {isSuperAdmin ? 'Super Admin' : 'Platform Admin'}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#6B7280] dark:text-[#A0A8B8] hidden sm:block truncate">
                Platform Governance & Analytics
              </span>
            </div>
          </Link>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#A0A8B8] bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] py-1.5 px-3 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-medium text-[#1F2937] dark:text-[#FFFFFF]">Platform Online</span>
          </div>

          <ThemeToggle />

          <button
            onClick={handleAdminLogout}
            disabled={loggingOut}
            title="Sign out of Admin"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#EF4444] hover:bg-red-500/10 p-2 sm:py-1.5 sm:px-3 rounded-xl transition-colors cursor-pointer border border-[#E5E7EB] dark:border-[#2A2F3A]"
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
            className="fixed inset-0 bg-[#080B12]/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide Drawer Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full bg-white dark:bg-[#10141F] shadow-2xl flex flex-col p-4 sm:p-5 animate-slide-left border-r border-[#E5E7EB] dark:border-[#2A2F3A] overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 no-scrollbar pr-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#D4A77F] text-[#080B12] flex items-center justify-center font-black text-lg shadow-sm">
                    👑
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-[#1F2937] dark:text-[#FFFFFF] block leading-tight">
                      SalonPro Admin
                    </span>
                    <span className="text-[10px] text-[#8C5E2E] dark:text-[#D4A77F] font-bold bg-[#D4A77F]/15 px-1.5 py-0.5 rounded border border-[#D4A77F]/30">
                      Super Admin Panel
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F3F4F6] dark:bg-[#1C2230] hover:bg-slate-200 text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#747D8D] tracking-wider px-2 mb-2">
                  Platform Menu
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#D4A77F] text-[#080B12] shadow-md shadow-[#D4A77F]/20 font-bold'
                          : 'text-[#6B7280] dark:text-[#A0A8B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] hover:text-[#1F2937] dark:hover:text-[#FFFFFF] hover:translate-x-1'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#080B12]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`} />
                        <span>{item.label}</span>
                      </span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#080B12]" />}
                    </Link>
                  );
                })}
              </nav>

              {/* Switch to Other Panels */}
              <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] space-y-2">
                <div className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#747D8D] tracking-wider px-2">
                  Switch to Other Panels
                </div>
                <Link
                  href="/salon-owner"
                  target="_blank"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#8C5E2E] dark:text-[#D4A77F] bg-[#D4A77F]/10 border border-[#D4A77F]/30 transition-all hover:bg-[#D4A77F]/20"
                >
                  <span className="flex items-center gap-2">
                    <span>💇</span>
                    <span>Salon Owner ERP</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#8C5E2E] dark:text-[#D4A77F]" />
                </Link>
                <Link
                  href="/portal"
                  target="_blank"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 transition-all hover:bg-[#10B981]/20"
                >
                  <span className="flex items-center gap-2">
                    <span>📱</span>
                    <span>Customer Portal</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#10B981]" />
                </Link>
              </div>
            </div>

            {/* Bottom Admin User Box */}
            <div className="shrink-0 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] space-y-2">
              <div className="p-2.5 rounded-xl bg-[#F8F9FA] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D4A77F] text-[#080B12] flex items-center justify-center font-black text-xs uppercase">
                  {admin?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] truncate">
                    {admin?.name || (isSuperAdmin ? 'Super Admin' : 'Platform Admin')}
                  </div>
                  <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] font-mono truncate">
                    {admin?.email || 'admin@salonpro.in'}
                  </div>
                  <div className="text-[9px] font-bold text-[#8C5E2E] dark:text-[#D4A77F] uppercase tracking-wider">
                    {isSuperAdmin ? '👑 Full Root Admin' : '🛡️ Salons & Analytics'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdminLogout}
                disabled={loggingOut}
                className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#EF4444] border border-red-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4 text-[#EF4444]" />
                <span>{loggingOut ? 'Signing out...' : 'Admin Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-visible lg:overflow-hidden">
        {/* Left Sidebar (Desktop & Large Screens) */}
        <aside className="hidden lg:flex w-64 xl:w-72 bg-[#F8F9FA] dark:bg-[#10141F] border-r border-[#E5E7EB] dark:border-[#2A2F3A] flex-col h-full shrink-0 select-none">
          {/* Scrollable nav items section */}
          <div className="flex-1 overflow-y-auto py-3.5 px-3 space-y-3 no-scrollbar">
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold text-[#6B7280] dark:text-[#747D8D] uppercase tracking-wider">
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
                      prefetch={true}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-sm shadow-[#D4A77F]/20'
                          : 'text-[#6B7280] dark:text-[#A0A8B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#080B12]' : 'text-[#6B7280] dark:text-[#A0A8B8]'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Switcher Section */}
            <div className="pt-2.5 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
              <div className="px-3 pb-1.5 text-[10px] font-bold text-[#6B7280] dark:text-[#747D8D] uppercase tracking-wider">
                Switch Role / Panel
              </div>
              <div className="space-y-1">
                <Link
                  href="/salon-owner"
                  target="_blank"
                  className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-[#8C5E2E] dark:text-[#D4A77F] bg-[#D4A77F]/10 hover:bg-[#D4A77F]/20 transition-colors border border-[#D4A77F]/30"
                >
                  <span className="flex items-center gap-2">
                    <span>💇</span>
                    <span>Salon Owner ERP</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#8C5E2E] dark:text-[#D4A77F]" />
                </Link>

                <Link
                  href="/portal"
                  target="_blank"
                  className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800/40"
                >
                  <span className="flex items-center gap-2">
                    <span>📱</span>
                    <span>Customer Portal</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* Admin User Profile Box - Pinned firmly at bottom */}
          <div className="p-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F8F9FA] dark:bg-[#10141F] shrink-0">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center gap-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#D4A77F] text-[#080B12] flex items-center justify-center font-black text-xs uppercase shrink-0">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] truncate">
                  {admin?.name || (isSuperAdmin ? 'Super Admin' : 'Platform Admin')}
                </div>
                <div
                  className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] font-mono truncate"
                  title={admin?.email || 'admin@salonpro.in'}
                >
                  {admin?.email || 'admin@salonpro.in'}
                </div>
                <div className="text-[9px] font-bold text-[#8C5E2E] dark:text-[#D4A77F] uppercase tracking-wider">
                  {isSuperAdmin ? '👑 Full Root Admin' : '🛡️ Salons & Analytics'}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden lg:overflow-y-auto p-3.5 sm:p-6 lg:p-8 w-full max-w-full touch-scroll">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
