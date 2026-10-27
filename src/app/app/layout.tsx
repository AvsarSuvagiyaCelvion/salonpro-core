'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Radio,
  Calendar,
  Receipt,
  Users,
  UserCheck,
  Scissors,
  Package,
  Award,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Live studio', href: '/app/live', icon: Radio },
  { name: 'Appointments', href: '/app/appointments', icon: Calendar },
  { name: 'Billing and payments', href: '/app/billing', icon: Receipt },
  { name: 'Customers', href: '/app/customers', icon: Users },
  { name: 'Staff', href: '/app/staff', icon: UserCheck },
  { name: 'Services', href: '/app/services', icon: Scissors },
  { name: 'Products', href: '/app/products', icon: Package },
  { name: 'Memberships & packages', href: '/app/memberships', icon: Award },
  { name: 'Reports', href: '/app/reports', icon: BarChart3 },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [salon, setSalon] = useState<{ name: string; slug: string } | null>(null);

  useEffect(() => {
    async function loadSalonDetails() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.salon) {
          setSalon({ name: data.salon.name, slug: data.salon.slug });
        }
      } catch {}
    }
    loadSalonDetails();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8fa] text-[#2a1630]">
      {/* Top Production Banner */}
      <div className="bg-[#2a1630] text-pink-200 text-xs py-1.5 px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-pink-950/40">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Sparkles className="w-3.5 h-3.5 text-[#b3135b]" />
          <span>SalonPro Operating System · Live Cloud Connected</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-pink-300">
          {salon?.slug ? (
            <Link
              href={`/${salon.slug}`}
              target="_blank"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <span>Customer Booking Page (/{salon.slug})</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          ) : (
            <span className="text-pink-300/70">No Salon Configured</span>
          )}
        </div>
      </div>

      {/* Top Header */}
      <header className="h-16 bg-white border-b border-neutral-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/app" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-[#2a1630] tracking-tight block leading-tight">
                {salon?.name || 'Salon Operating System'}
              </span>
              <span className="text-[11px] text-neutral-500 block -mt-0.5">
                Salon Business ERP
              </span>
            </div>
          </Link>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-neutral-600 bg-pink-50/70 border border-pink-100/80 py-1.5 px-3 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Studio Open (10:00 - 19:00)</span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-red-600 hover:bg-red-50 py-1.5 px-3 rounded-lg transition-colors cursor-pointer border border-neutral-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Animated Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide Drawer Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between p-5 animate-slide-left border-r border-neutral-200">
            <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-sm text-[#2a1630] block leading-tight truncate">
                      {salon?.name || 'Salon Operating System'}
                    </span>
                    <span className="text-[10px] text-pink-700 font-bold bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                      Salon Owner ERP
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider px-2 mb-1.5">
                  Management Tools
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#b3135b] text-white shadow-md shadow-[#b3135b]/20 font-bold'
                          : 'text-neutral-700 hover:bg-pink-50/70 hover:translate-x-1'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Public Booking Link */}
              {salon?.slug && (
                <div className="pt-2 border-t border-neutral-100">
                  <a
                    href={`/${salon.slug}`}
                    target="_blank"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-pink-700 bg-pink-50 border border-pink-200/80 transition-all hover:bg-pink-100"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#b3135b]" />
                      <span>Client Booking Page</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Account & Sign Out */}
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <div className="text-[10px] text-neutral-400 uppercase font-bold">Logged In Manager</div>
                <div className="text-xs font-bold text-[#2a1630] truncate mt-0.5">avsarsuvagiya968@gmail.com</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{loggingOut ? 'Signing out...' : 'Sign Out of ERP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Horizontal Scroll Menu */}
      <div className="md:hidden bg-white border-b border-neutral-200 overflow-x-auto py-2 px-3 flex gap-2 no-scrollbar sticky top-16 z-20 touch-scroll">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-1.5 text-xs whitespace-nowrap px-3.5 py-2 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#b3135b] text-white shadow-xs font-bold scale-102'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200/80 flex-col justify-between py-4 px-3 sticky top-16 h-[calc(100vh-4rem-1.75rem)] overflow-y-auto">
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Management
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#b3135b] text-white shadow-md shadow-[#b3135b]/20 font-semibold'
                      : 'text-neutral-700 hover:bg-pink-50/60 hover:text-[#b3135b]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-neutral-100 px-3">
            <div>
              <div className="text-xs text-neutral-500 mb-0.5">Signed in as:</div>
              <div className="text-xs font-semibold text-[#2a1630] truncate">
                avsarsuvagiya968@gmail.com
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Owner Account
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Dock Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 px-3 py-1.5 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <Link
          href="/app"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            pathname === '/app'
              ? 'text-[#b3135b] font-bold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Overview</span>
        </Link>

        <Link
          href="/app/live"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors relative ${
            pathname.startsWith('/app/live')
              ? 'text-[#b3135b] font-bold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span className="relative">
            <Radio className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-[10px]">Live</span>
        </Link>

        <Link
          href="/app/billing"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            pathname.startsWith('/app/billing')
              ? 'text-[#b3135b] font-bold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px]">Billing</span>
        </Link>

        <Link
          href="/app/appointments"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            pathname.startsWith('/app/appointments')
              ? 'text-[#b3135b] font-bold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Bookings</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-neutral-500 hover:text-neutral-800 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">All Menus</span>
        </button>
      </div>
    </div>
  );
}
