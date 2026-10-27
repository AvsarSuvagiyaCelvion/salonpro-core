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

      {/* Mobile Horizontal Scroll Menu */}
      <div className="md:hidden bg-white border-b border-neutral-200 overflow-x-auto py-2 px-3 flex gap-2 no-scrollbar sticky top-16 z-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-[#b3135b] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
