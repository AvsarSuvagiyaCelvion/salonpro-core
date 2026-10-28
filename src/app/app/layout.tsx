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
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
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
  { name: 'Subscription & Plans', href: '/app/subscription', icon: CreditCard },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [salon, setSalon] = useState<{ name: string; slug: string } | null>(null);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  // Subscription & 7-Day Trial State
  const [subscription, setSubscription] = useState<{
    status: string;
    isActive: boolean;
    isTrial: boolean;
    isTrialExpired: boolean;
    trialDaysRemaining: number;
    currentPlan: any;
  } | null>(null);

  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activatingPlan, setActivatingPlan] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.salon) {
          setSalon({ name: data.salon.name, slug: data.salon.slug });
        } else {
          router.push('/login');
          return;
        }
        if (data.user) {
          setUser(data.user);
        }

        // Fetch Subscription details
        const subRes = await fetch('/api/subscription');
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData.subscription) {
            setSubscription(subData.subscription);
          }
        }

        // Fetch Public Plans for upgrade modal
        const plansRes = await fetch('/api/plans');
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setAvailablePlans(plansData.plans || []);
          if (plansData.plans?.length > 0) {
            setSelectedPlanId(plansData.plans[0].id);
          }
        }
      } catch {
        router.push('/login');
      }
    }
    loadData();
  }, [router]);

  async function handleActivatePlan(planId: string) {
    setActivatingPlan(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          paymentMethod: 'Instant UPI / Card Payment',
          transactionId: `TXN-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentSuccess(true);
        setTimeout(() => {
          setPaymentSuccess(false);
          setShowPlanModal(false);
          // Refresh state
          window.location.reload();
        }, 1500);
      } else {
        alert(data.error || 'Failed to process plan subscription.');
      }
    } catch (err: any) {
      alert(err.message || 'Payment processing failed.');
    } finally {
      setActivatingPlan(false);
    }
  }

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

  const isExpiredLockout = subscription?.isTrialExpired && !subscription?.isActive;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8fa] text-[#2a1630]">
      {/* Top Professional Trial Notification Banner (Only shown if on active 7-Day trial) */}
      {subscription?.isTrial && !subscription?.isTrialExpired && (
        <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-[#b3135b] text-white text-xs py-2 px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-pink-700 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>
              <strong>🎁 7-Day Free Trial Active:</strong> You have{' '}
              <span className="font-extrabold text-amber-300 underline decoration-amber-400">
                {subscription.trialDaysRemaining} day{subscription.trialDaysRemaining === 1 ? '' : 's'} remaining
              </span>{' '}
              to explore all pro ERP features.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-pink-900 font-extrabold text-[11px] shadow-sm hover:bg-pink-50 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3 h-3 text-pink-700 fill-pink-600" />
              <span>Upgrade Plan</span>
            </button>
            {salon?.slug && (
              <Link
                href={`/${salon.slug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-pink-200 hover:text-white transition-colors underline ml-2"
              >
                <span>Live Booking Link</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}

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
            <div className="pt-4 border-t border-neutral-100 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowPlanModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#b3135b] border border-pink-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-pink-700" />
                <span>Subscription Plan & Billing</span>
              </button>

              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <div className="text-[10px] text-neutral-400 uppercase font-bold">
                  {user?.role === 'owner' ? 'Logged In Owner' : user?.role === 'manager' ? 'Logged In Manager' : 'Logged In User'}
                </div>
                <div className="text-xs font-bold text-[#2a1630] truncate mt-0.5">
                  {user?.email || 'Active Workspace User'}
                </div>
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
                {user?.email || 'Active Workspace User'}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="capitalize">{user?.role || 'Owner'} Account</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 animate-fade-in">
          {isExpiredLockout ? (
            <div className="max-w-4xl mx-auto py-8">
              {/* Paywall Lockout Screen */}
              <div className="bg-white rounded-3xl border-2 border-red-200 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-[#b3135b] p-6 sm:p-8 text-white text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-4 ring-4 ring-white/20">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-red-950/40 text-red-200 text-xs font-bold uppercase tracking-wider mb-2">
                    7-Day Free Trial Ended
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Your 7-Day Free Trial Has Concluded
                  </h2>
                  <p className="text-pink-100 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
                    All salon records, appointments, and staff settings for{' '}
                    <strong className="underline text-white">{salon?.name || 'your salon'}</strong> are safely preserved.
                    Select an official subscription plan below to immediately re-enable your portal and online bookings.
                  </p>
                </div>

                <div className="p-6 sm:p-8 bg-slate-50">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 text-center mb-6">
                    Choose Your Subscription Plan to Reactivate
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {availablePlans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer bg-white flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#b3135b] ring-4 ring-pink-100 shadow-lg scale-102'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {plan.is_popular && (
                            <span className="absolute -top-3 right-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                              Recommended
                            </span>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-extrabold text-slate-900 text-base">{plan.name}</h4>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-[#b3135b] bg-[#b3135b]' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </div>

                            <p className="text-xs text-slate-500 mb-4 min-h-[32px]">{plan.description}</p>

                            <div className="mb-4">
                              <span className="text-2xl font-black text-slate-900">₹{Number(plan.price).toLocaleString()}</span>
                              <span className="text-xs text-slate-500 ml-1">/{plan.billing_interval}</span>
                            </div>

                            <div className="space-y-2 border-t border-slate-100 pt-3">
                              {(Array.isArray(plan.features) ? plan.features : []).map((feat: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivatePlan(plan.id);
                            }}
                            disabled={activatingPlan}
                            className={`w-full mt-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                              isSelected
                                ? 'bg-[#b3135b] hover:bg-[#9c0f4e] text-white shadow-pink-900/20'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{activatingPlan && isSelected ? 'Activating...' : 'Select & Pay'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-xs text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out of Workspace</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Plan Upgrade / Subscription Modal (When clicked from top bar or settings) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-600">
                  SalonPro Cloud Subscriptions
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Upgrade or Manage Your Subscription Plan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-bold animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Payment verified! Your plan has been activated successfully.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {availablePlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer bg-white flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#b3135b] ring-4 ring-pink-100 shadow-lg'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {plan.is_popular && (
                      <span className="absolute -top-3 right-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                        Popular
                      </span>
                    )}

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base mb-1">{plan.name}</h4>
                      <p className="text-xs text-slate-500 mb-3 min-h-[30px]">{plan.description}</p>
                      <div className="mb-4">
                        <span className="text-2xl font-black text-slate-900">₹{Number(plan.price).toLocaleString()}</span>
                        <span className="text-xs text-slate-500 ml-1">/{plan.billing_interval}</span>
                      </div>
                      <div className="space-y-1.5 border-t border-slate-100 pt-3">
                        {(Array.isArray(plan.features) ? plan.features : []).map((feat: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivatePlan(plan.id);
                      }}
                      disabled={activatingPlan}
                      className={`w-full mt-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#b3135b] text-white hover:bg-[#9c0f4e]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{activatingPlan && isSelected ? 'Processing...' : 'Pay & Activate'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
