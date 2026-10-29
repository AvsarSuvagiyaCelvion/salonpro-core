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
  Lock,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  requiredFlag?: string;
  requiredPlanName?: string;
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
  { name: 'Memberships & packages', href: '/app/memberships', icon: Award, requiredFlag: 'memberships', requiredPlanName: 'Pro' },
  { name: 'Reports', href: '/app/reports', icon: BarChart3 },
  { name: 'Subscription & Plans', href: '/app/subscription', icon: CreditCard },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [salon, setSalon] = useState<{
    name: string;
    slug: string;
    open_time?: string;
    close_time?: string;
  } | null>(null);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  // Subscription & 7-Day Trial State
  const [subscription, setSubscription] = useState<{
    status: string;
    isActive: boolean;
    isTrial: boolean;
    isTrialActive?: boolean;
    isTrialExpired: boolean;
    isSubscriptionExpired?: boolean;
    trialDaysRemaining: number;
    trialEndsAt?: string | null;
    subscriptionEndsAt?: string | null;
    currentPlan: any;
  } | null>(null);

  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activatingPlan, setActivatingPlan] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Global Plan Gate / Upgrade Modal Prompt
  const [planPrompt, setPlanPrompt] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    requiredPlan?: string;
  } | null>(null);

  // Global Fetch Interceptor for 402 SUBSCRIPTION_EXPIRED and 403 UPGRADE_REQUIRED / LIMIT_REACHED
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 402) {
        response.clone().json().then((data) => {
          if (data?.code === 'SUBSCRIPTION_EXPIRED') {
            setSubscription((prev) => prev ? { ...prev, isTrialExpired: true, isActive: false } : prev);
          }
        }).catch(() => {});
      } else if (response.status === 403) {
        response.clone().json().then((data) => {
          if (data?.code === 'UPGRADE_REQUIRED') {
            setPlanPrompt({
              isOpen: true,
              title: 'Upgrade Required',
              message: data.error || `This feature requires the ${data.requiredPlan || 'Pro'} plan.`,
              requiredPlan: data.requiredPlan || 'Pro',
            });
          } else if (data?.code === 'LIMIT_REACHED') {
            setPlanPrompt({
              isOpen: true,
              title: 'Plan Limit Reached',
              message: data.error || 'You have reached the maximum allowed limit for your subscription plan.',
              requiredPlan: 'Pro or Premium',
            });
          }
        }).catch(() => {});
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [res, subRes, plansRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/subscription').catch(() => null),
          fetch('/api/plans').catch(() => null),
        ]);

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.salon) {
            setSalon({
              name: data.salon.name,
              slug: data.salon.slug,
              open_time: data.salon.open_time,
              close_time: data.salon.close_time,
            });
          }
          if (data.user) {
            setUser(data.user);
          }
        }

        if (subRes && subRes.ok) {
          const subData = await subRes.json();
          if (subData.subscription) {
            setSubscription(subData.subscription);
          }
        }

        if (plansRes && plansRes.ok) {
          const plansData = await plansRes.json();
          setAvailablePlans(plansData.plans || []);
          if (plansData.plans?.length > 0) {
            setSelectedPlanId(plansData.plans[0].id);
          }
        }
      } catch {
        // Do not redirect on non-critical network interruptions
      }
    }
    loadData();

    function handleSettingsUpdated(e: any) {
      if (e?.detail) {
        setSalon((prev) => ({
          name: e.detail.name || prev?.name || '',
          slug: e.detail.slug || prev?.slug || '',
          open_time: e.detail.open_time,
          close_time: e.detail.close_time,
        }));
      } else {
        loadData();
      }
    }

    function handleOpenPlanModal() {
      setShowPlanModal(true);
    }

    window.addEventListener('salon-settings-updated', handleSettingsUpdated);
    window.addEventListener('open-plan-modal', handleOpenPlanModal);
    return () => {
      window.removeEventListener('salon-settings-updated', handleSettingsUpdated);
      window.removeEventListener('open-plan-modal', handleOpenPlanModal);
    };
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

  const isExpiredLockout = Boolean(
    (!subscription?.isActive && (subscription?.isTrialExpired || (subscription as any)?.isSubscriptionExpired || subscription?.status === 'expired')) ||
    (subscription?.subscriptionEndsAt && new Date(subscription.subscriptionEndsAt).getTime() <= Date.now() && !subscription?.isActive)
  );

  const lockedItem = navItems.find(
    (item) =>
      item.requiredFlag &&
      pathname.startsWith(item.href) &&
      subscription?.currentPlan?.flags &&
      subscription.currentPlan.flags[item.requiredFlag] === false
  );

  return (
    <div className="h-screen flex flex-col bg-[#faf8fa] text-[#2a1630] overflow-hidden">
      {/* Top Professional Trial Notification Banner (Only shown if on active 7-Day trial) */}
      {subscription?.isTrial && !subscription?.isTrialExpired && (
        <div className="shrink-0 bg-gradient-to-r from-purple-900 via-pink-900 to-[#b3135b] text-white text-xs py-1.5 px-3 sm:px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-pink-700 shadow-xs">
          <div className="flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping"></span>
            <span className="truncate">
              <strong>🎁 Free Trial:</strong>{' '}
              <span className="font-extrabold text-amber-300 underline decoration-amber-400">
                {subscription.trialDaysRemaining} day{subscription.trialDaysRemaining === 1 ? '' : 's'} remaining
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-pink-900 font-extrabold text-[10px] sm:text-[11px] shadow-sm hover:bg-pink-50 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3 h-3 text-pink-700 fill-pink-600" />
              <span>Upgrade</span>
            </button>
            {salon?.slug && (
              <Link
                href={`/${salon.slug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-pink-200 hover:text-white transition-colors underline ml-2"
              >
                <span>Live Booking</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Paid Plan Expiring Soon Banner (<= 7 days remaining) */}
      {Boolean((subscription as any)?.isSubscriptionExpiringSoon && !subscription?.isTrial) && (
        <div className="shrink-0 bg-gradient-to-r from-amber-800 via-rose-900 to-[#b3135b] text-white text-xs py-1.5 px-3 sm:px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-amber-600 shadow-xs">
          <div className="flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0 animate-ping"></span>
            <span className="truncate">
              <strong>⚠️ Plan Ending Soon:</strong>{' '}
              <span className="font-extrabold text-amber-200 underline decoration-amber-300">
                {(subscription as any)?.subscriptionDaysRemaining} day{(subscription as any)?.subscriptionDaysRemaining === 1 ? '' : 's'} remaining
              </span>
              <span className="hidden md:inline text-white/90"> · Renew to avoid service stoppage</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px] sm:text-[11px] shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3 h-3 text-amber-900 fill-amber-800" />
              <span>Renew Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="shrink-0 h-14 sm:h-16 bg-white border-b border-neutral-200/80 z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 focus:outline-none cursor-pointer transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/app" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#b3135b] to-[#e63985] text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base text-[#2a1630] tracking-tight block leading-tight truncate max-w-[140px] sm:max-w-xs">
                {salon?.name || 'Salon Operating System'}
              </span>
              <span className="text-[10px] sm:text-[11px] text-neutral-500 hidden sm:block -mt-0.5 truncate">
                Salon Business ERP
              </span>
            </div>
          </Link>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-xs text-neutral-600 bg-pink-50/70 border border-pink-100/80 py-1.5 px-3 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Studio Open ({salon?.open_time ? salon.open_time.slice(0, 5) : '09:00'} - {salon?.close_time ? salon.close_time.slice(0, 5) : '21:00'})
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out of ERP"
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-red-600 hover:bg-red-50 p-2 sm:py-1.5 sm:px-3 rounded-xl transition-colors cursor-pointer border border-neutral-200"
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
        <div className="fixed inset-0 z-50 lg:hidden">
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
                  const isLocked = Boolean(
                    item.requiredFlag &&
                    subscription?.currentPlan?.flags &&
                    subscription.currentPlan.flags[item.requiredFlag] === false
                  );

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#b3135b] text-white shadow-md shadow-[#b3135b]/20 font-bold'
                          : isLocked
                          ? 'text-neutral-500 hover:bg-neutral-100/80'
                          : 'text-neutral-700 hover:bg-pink-50/70 hover:translate-x-1'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isLocked ? 'text-neutral-400' : 'text-neutral-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      {isLocked && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{item.requiredPlanName || 'PRO'}</span>
                        </span>
                      )}
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

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop & Large Screens) */}
        <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-neutral-200/80 flex-col h-full shrink-0 select-none">
          <div className="flex-1 overflow-y-auto py-3.5 px-3 space-y-0.5 no-scrollbar">
            <div className="px-3 pb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Management
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
                const isLocked = Boolean(
                  item.requiredFlag &&
                  subscription?.currentPlan?.flags &&
                  subscription.currentPlan.flags[item.requiredFlag] === false
                );

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#b3135b] text-white shadow-md shadow-[#b3135b]/20 font-semibold'
                        : isLocked
                        ? 'text-neutral-500 hover:bg-neutral-100/80'
                        : 'text-neutral-700 hover:bg-pink-50/60 hover:text-[#b3135b]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isLocked ? 'text-neutral-400' : 'text-neutral-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{item.requiredPlanName || 'PRO'}</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3 border-t border-neutral-200/80 bg-neutral-50/60 shrink-0">
            <div className="p-2.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs">
              <div className="text-[10px] text-neutral-400 mb-0.5 font-bold uppercase">Signed in as:</div>
              <div className="text-xs font-semibold text-[#2a1630] truncate" title={user?.email || 'Active Workspace User'}>
                {user?.email || 'Active Workspace User'}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="capitalize">{user?.role || 'Owner'} Account</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 w-full max-w-full pb-24 md:pb-8 touch-scroll">
          <div className="max-w-7xl mx-auto w-full">
            {isExpiredLockout ? (
            <div className="max-w-4xl mx-auto py-8">
              {/* Paywall Lockout Screen */}
              <div className="bg-white rounded-3xl border-2 border-red-200 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-[#b3135b] p-6 sm:p-8 text-white text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-4 ring-4 ring-white/20">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-red-950/40 text-red-200 text-xs font-bold uppercase tracking-wider mb-2">
                    {subscription?.isTrial ? '7-Day Free Trial Ended' : 'Subscription Expired'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {subscription?.isTrial ? 'Your 7-Day Free Trial Has Concluded' : 'Your Workspace Subscription Has Concluded'}
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
          ) : lockedItem ? (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
              <div className="bg-white rounded-3xl border-2 border-amber-200 p-8 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4 ring-4 ring-amber-50">
                  <Lock className="w-8 h-8" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wider mb-3">
                  {lockedItem.requiredPlanName || 'Pro'} Feature Locked
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Upgrade to {lockedItem.requiredPlanName || 'Pro'} to Unlock {lockedItem.name}
                </h2>
                <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
                  Your salon is currently on the <strong>{subscription?.currentPlan?.name || 'Basic'}</strong> plan.
                  VIP Memberships, package passes, and client loyalty benefits are available exclusively on Pro and Premium plans.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#b3135b] hover:bg-[#9c0f4e] text-white font-extrabold text-xs shadow-lg shadow-pink-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Upgrade to Pro / Premium</span>
                  </button>
                  <Link
                    href="/app/subscription"
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>View Plan Comparison</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
          </div>
        </main>
      </div>

      {/* Plan Upgrade / Subscription Modal (When clicked from top bar or settings) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-fade-in">
          <div className="fixed inset-0" onClick={() => setShowPlanModal(false)} aria-hidden="true" />
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative z-10 bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[88vh] overflow-y-auto my-auto animate-scale-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 shrink-0">
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
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-bold animate-fade-in shrink-0">
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
        </div>
      )}

      {/* Global Limit / Upgrade Required Modal */}
      {planPrompt?.isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-fade-in">
          <div className="fixed inset-0" onClick={() => setPlanPrompt(null)} aria-hidden="true" />
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative z-10 bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2 text-[#b3135b] font-black text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>{planPrompt.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPlanPrompt(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                {planPrompt.message}
              </p>

              <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-100 mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-pink-700">Recommended Plan</span>
                  <div className="text-sm font-extrabold text-[#2a1630]">Upgrade to {planPrompt.requiredPlan || 'Pro'}</div>
                </div>
                <span className="text-xs font-black text-[#b3135b]">₹999/month</span>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPlanPrompt(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlanPrompt(null);
                    setShowPlanModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#b3135b] hover:bg-[#9c0f4e] text-white shadow-md shadow-pink-900/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>View Upgrade Options</span>
                </button>
              </div>
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
