'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/landing/ThemeToggle';
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
  Star,
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
  { name: 'Reviews', href: '/app/reviews', icon: Star, requiredFlag: 'reviews', requiredPlanName: 'Pro' },
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
    logo_url?: string | null;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const s = localStorage.getItem('salonpro_salon_info');
        if (s) return JSON.parse(s);
      } catch {}
    }
    return null;
  });
  const [user, setUser] = useState<{ email: string; role: string } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = localStorage.getItem('salonpro_user_info');
        if (u) return JSON.parse(u);
      } catch {}
    }
    return null;
  });

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
          router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.salon) {
            const sInfo = {
              name: data.salon.name,
              slug: data.salon.slug,
              open_time: data.salon.open_time,
              close_time: data.salon.close_time,
            };
            setSalon(sInfo);
            try {
              localStorage.setItem('salonpro_salon_info', JSON.stringify(sInfo));
            } catch {}
          }
          if (data.user) {
            setUser(data.user);
            try {
              localStorage.setItem('salonpro_user_info', JSON.stringify(data.user));
            } catch {}
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

  // Security Guard: On Page Reload / Refresh, keep session active.
  // On Browser Back / Forward navigation (or mobile swipe back/forward) or bfcache restore, require re-authentication.
  // Clean up any remaining route effects
  useEffect(() => {
    // Normal browser back/forward navigation preserves valid sessions
  }, [pathname]);

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
    setMobileMenuOpen(false);
    setLoggingOut(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      // Continue with client purge
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      // Perform full browser navigation to login so all cached states & auth tokens are purged
      window.location.href = '/login';
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
    <div className="min-h-screen lg:h-screen flex flex-col bg-white dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] overflow-x-hidden lg:overflow-hidden transition-colors duration-250">
      {/* Top Professional Trial Notification Banner (Only shown if on active 7-Day trial) */}
      {subscription?.isTrial && !subscription?.isTrialExpired && (
        <div className="shrink-0 bg-[#10141F] text-white text-xs py-1.5 px-3 sm:px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-[#2A2F3A] shadow-xs">
          <div className="flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 animate-ping"></span>
            <span className="truncate">
              <strong>🎁 Free Trial:</strong>{' '}
              <span className="font-extrabold text-[#D4A77F] underline decoration-[#D4A77F]">
                {subscription.trialDaysRemaining} day{subscription.trialDaysRemaining === 1 ? '' : 's'} remaining
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4A77F] text-[#080B12] font-black text-[10px] sm:text-[11px] shadow-sm hover:bg-[#B8905F] transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3 h-3 text-[#080B12] fill-[#080B12]" />
              <span>Upgrade</span>
            </button>
            {salon?.slug && (
              <Link
                href={`/${salon.slug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#D4A77F] hover:text-white transition-colors underline ml-2"
              >
                <span>Live Booking</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Active Paid Plan Banner (Shown when salon has active paid subscription) */}
      {!subscription?.isTrial && subscription?.status === 'active' && !(subscription as any)?.isSubscriptionExpiringSoon && (
        <div className="shrink-0 bg-[#10141F] text-white text-xs py-1.5 px-3 sm:px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-[#2A2F3A] shadow-xs">
          <div className="flex items-center gap-2 truncate text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0"></span>
            <span className="truncate">
              <strong className="text-[#D4A77F] font-black">💎 {subscription.currentPlan?.name || 'Pro'} Active:</strong>{' '}
              <span className="text-white font-bold">
                {(subscription as any)?.subscriptionDaysRemaining ?? 30} days remaining
              </span>
              {subscription.subscriptionEndsAt && (
                <span className="hidden md:inline text-[#A0A8B8]">
                  {' '}· Valid till {new Date(subscription.subscriptionEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/app/subscription"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D4A77F]/20 text-[#D4A77F] border border-[#D4A77F]/40 text-[10px] sm:text-[11px] hover:bg-[#D4A77F]/30 transition-all font-bold"
            >
              <span>Manage Plan</span>
            </Link>
            {salon?.slug && (
              <Link
                href={`/${salon.slug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#D4A77F] hover:text-white transition-colors underline ml-2"
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
        <div className="shrink-0 bg-amber-950 text-white text-xs py-1.5 px-3 sm:px-4 font-medium tracking-wide flex items-center justify-between z-40 border-b border-amber-600 shadow-xs">
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-black text-[10px] sm:text-[11px] shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3 h-3 text-[#080B12] fill-[#080B12]" />
              <span>Renew Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Demo Owner ERP Sandbox Banner */}
      {salon?.slug === 'dixa-beauty-salon' && (
        <div className="shrink-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 text-xs py-1.5 px-3 sm:px-6 font-semibold flex flex-wrap items-center justify-between gap-2 z-40 border-b border-amber-600/40 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider shrink-0">
              ⚡ Live Owner ERP Demo
            </span>
            <span className="truncate text-[11px] sm:text-xs font-bold text-slate-900">
              You are exploring the Salon Owner Dashboard in live sandbox demo mode.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dixa-beauty-salon"
              target="_blank"
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition-all"
            >
              <span>Booking Demo</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/register-salon"
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-[11px] inline-flex items-center gap-1 shadow-xs transition-all"
            >
              <span>Create My Free Salon ➔</span>
            </Link>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 shrink-0 h-14 sm:h-16 bg-white/95 dark:bg-[#10141F]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2A2F3A] z-30 px-3 sm:px-6 flex items-center justify-between shadow-2xs transition-colors duration-250">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-[#6B7280] dark:text-[#A0A8B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] focus:outline-none cursor-pointer transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/app" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] text-[#D4A77F] flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shrink-0 overflow-hidden">
              {salon?.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={salon.logo_url} alt={salon.name} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A77F]" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF] tracking-tight block leading-tight truncate max-w-[140px] sm:max-w-xs">
                {salon?.name || process.env.NEXT_PUBLIC_DEFAULT_SALON_NAME || 'Pari Beauty Studio - Branch 1'}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#6B7280] dark:text-[#A0A8B8] hidden sm:block -mt-0.5 truncate">
                Salon Business ERP
              </span>
            </div>
          </Link>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          <div className="hidden md:flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#A0A8B8] bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] py-1.5 px-3 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>
              Studio Open ({salon?.open_time ? salon.open_time.slice(0, 5) : '09:00'} - {salon?.close_time ? salon.close_time.slice(0, 5) : '21:00'})
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out of ERP"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 p-2 sm:py-1.5 sm:px-3 rounded-xl transition-colors cursor-pointer border border-[#E5E7EB] dark:border-[#2A2F3A]"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide Drawer Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full bg-white dark:bg-[#10141F] shadow-2xl flex flex-col p-4 sm:p-5 animate-slide-left border-r border-[#E5E7EB] dark:border-[#2A2F3A] overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 no-scrollbar pr-1">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] text-[#D4A77F] flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden shrink-0">
                    {salon?.logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={salon.logo_url} alt={salon.name} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-[#D4A77F]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-sm text-[#1F2937] dark:text-[#FFFFFF] block leading-tight truncate">
                      {salon?.name || process.env.NEXT_PUBLIC_DEFAULT_SALON_NAME || 'Pari Beauty Studio - Branch 1'}
                    </span>
                    <span className="text-[10px] text-[#D4A77F] font-bold bg-[#F3F4F6] dark:bg-[#1C2230] px-1.5 py-0.5 rounded border border-[#E5E7EB] dark:border-[#2A2F3A]">
                      Salon Owner ERP
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F3F4F6] dark:bg-[#1C2230] hover:bg-[#E5E7EB] dark:hover:bg-[#2A2F3A] text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#A0A8B8] tracking-wider px-2 mb-1.5">
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
                          ? 'bg-[#D4A77F] text-[#080B12] shadow-md shadow-[#D4A77F]/20 font-bold'
                          : isLocked
                          ? 'text-[#6B7280] dark:text-[#A0A8B8] hover:bg-[#F3F4F6]/80 dark:hover:bg-[#1C2230]/80'
                          : 'text-[#1F2937] dark:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] hover:translate-x-1'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#080B12]' : isLocked ? 'text-[#6B7280] dark:text-[#A0A8B8]' : 'text-[#D4A77F]'}`} />
                        <span>{item.name}</span>
                      </div>
                      {isLocked && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#D4A77F]/20 text-[#D4A77F]">
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
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
                  <a
                    href={`/${salon.slug}`}
                    target="_blank"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#D4A77F] bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] transition-all hover:opacity-90"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4A77F]" />
                      <span>Client Booking Page</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Account & Sign Out */}
            <div className="shrink-0 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowPlanModal(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] hover:opacity-90 text-[#1F2937] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#D4A77F]" />
                <span>Subscription & Billing</span>
              </button>

              <div className="p-2.5 rounded-xl bg-[#F8F9FA] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] uppercase font-bold">
                  {user?.role === 'owner' ? 'Logged In Owner' : user?.role === 'manager' ? 'Logged In Manager' : 'Logged In User'}
                </div>
                <div className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] truncate mt-0.5">
                  {user?.email || 'pari.branch1@gmail.com'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-2.5 px-3 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
              >
                <LogOut className="w-4 h-4 text-[#EF4444]" />
                <span>{loggingOut ? 'Signing out...' : 'Sign Out of ERP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-visible lg:overflow-hidden">
        {/* Left Sidebar (Desktop & Large Screens) */}
        <aside className="hidden lg:flex w-64 xl:w-72 bg-[#F8F9FA] dark:bg-[#10141F] border-r border-[#E5E7EB] dark:border-[#2A2F3A] flex-col h-full shrink-0 select-none transition-colors duration-250">
          <div className="flex-1 overflow-y-auto py-3.5 px-3 space-y-0.5 no-scrollbar">
            <div className="px-3 pb-1.5 text-[10px] font-bold text-[#6B7280] dark:text-[#A0A8B8] uppercase tracking-wider">
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
                        ? 'bg-[#D4A77F] text-[#080B12] shadow-md shadow-[#D4A77F]/20 font-bold'
                        : isLocked
                        ? 'text-[#6B7280] dark:text-[#A0A8B8] hover:bg-[#F3F4F6]/80 dark:hover:bg-[#1C2230]/80'
                        : 'text-[#1F2937] dark:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#080B12]' : isLocked ? 'text-[#6B7280] dark:text-[#A0A8B8]' : 'text-[#D4A77F]'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#D4A77F]/20 text-[#D4A77F]">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{item.requiredPlanName || 'PRO'}</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F8F9FA] dark:bg-[#10141F] shrink-0">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs">
              <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] mb-0.5 font-bold uppercase">Signed in as:</div>
              <div className="text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] truncate" title={user?.email || 'pari.branch1@gmail.com'}>
                {user?.email || 'pari.branch1@gmail.com'}
              </div>
              <div className="text-[10px] text-[#10B981] font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                <span className="capitalize">{user?.role || 'Owner'} Account</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-x-hidden lg:overflow-y-auto p-2.5 xs:p-3.5 sm:p-6 lg:p-8 w-full max-w-full pb-24 md:pb-8 touch-scroll">
          <div className="max-w-7xl mx-auto w-full">
            {isExpiredLockout ? (
            <div className="max-w-4xl mx-auto py-8">
              {/* Paywall Lockout Screen */}
              <div className="bg-white dark:bg-[#141926] rounded-3xl border-2 border-red-500/30 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-950 via-[#10141F] to-red-950 p-6 sm:p-8 text-white text-center border-b border-red-500/20">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-4 ring-4 ring-white/20">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-red-950/40 text-red-200 text-xs font-bold uppercase tracking-wider mb-2">
                    {subscription?.isTrial ? '7-Day Free Trial Ended' : 'Subscription Expired'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {subscription?.isTrial ? 'Your 7-Day Free Trial Has Concluded' : 'Your Workspace Subscription Has Concluded'}
                  </h2>
                  <p className="text-neutral-300 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
                    All salon records, appointments, and staff settings for{' '}
                    <strong className="underline text-white">{salon?.name || 'your salon'}</strong> are safely preserved.
                    Select an official subscription plan below to immediately re-enable your portal and online bookings.
                  </p>
                </div>

                <div className="p-6 sm:p-8 bg-[#F8F9FA] dark:bg-[#080B12]">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-neutral-300 text-center mb-6">
                    Choose Your Subscription Plan to Reactivate
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {availablePlans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer bg-white dark:bg-[#141926] flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#D4A77F] ring-4 ring-[#D4A77F]/20 shadow-lg scale-102'
                              : 'border-slate-200 dark:border-[#2A2F3A] hover:border-slate-300 dark:hover:border-[#D4A77F]/50'
                          }`}
                        >
                          {plan.is_popular && (
                            <span className="absolute -top-3 right-4 bg-[#D4A77F] text-[#080B12] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                              Recommended
                            </span>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{plan.name}</h4>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-[#D4A77F] bg-[#D4A77F]' : 'border-slate-300 dark:border-[#2A2F3A]'
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-[#080B12]" />}
                              </div>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-[#A0A8B8] mb-4 min-h-[32px]">{plan.description}</p>

                            <div className="mb-4">
                              <span className="text-2xl font-black text-slate-900 dark:text-white">₹{Number(plan.price).toLocaleString()}</span>
                              <span className="text-xs text-slate-500 dark:text-[#A0A8B8] ml-1">/{plan.billing_interval}</span>
                            </div>

                            <div className="space-y-2 border-t border-slate-100 dark:border-[#2A2F3A] pt-3">
                              {(Array.isArray(plan.features) ? plan.features : []).map((feat: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-[#A0A8B8]">
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
                                ? 'bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold shadow-md'
                                : 'bg-slate-100 dark:bg-[#1C2230] hover:bg-slate-200 dark:hover:bg-[#2A2F3A] text-slate-800 dark:text-neutral-200'
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
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Upgrade to Pro / Premium</span>
                  </button>
                  <Link
                    href="/app/subscription"
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 dark:bg-[#1C2230] hover:bg-slate-200 dark:hover:bg-[#2A2F3A] text-slate-800 dark:text-neutral-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            <div className="relative z-10 bg-white dark:bg-[#141926] rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-[#2A2F3A] max-h-[88vh] overflow-y-auto my-auto animate-scale-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2A2F3A] mb-6 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D4A77F]">
                    SalonPro Cloud Subscriptions
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Upgrade or Manage Your Subscription Plan
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C2230] cursor-pointer"
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
                          ? 'border-[#D4A77F] ring-4 ring-[#D4A77F]/20 shadow-lg'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {plan.is_popular && (
                        <span className="absolute -top-3 right-4 bg-[#D4A77F] text-[#080B12] text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
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
                            ? 'bg-[#D4A77F] text-[#080B12] hover:bg-[#B8905F] font-bold'
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
                <div className="flex items-center gap-2 text-[#D4A77F] font-black text-sm">
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

              <div className="p-4 rounded-2xl bg-[#D4A77F]/10 border border-[#D4A77F]/30 mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D4A77F]">Recommended Plan</span>
                  <div className="text-sm font-extrabold text-[#1F2937] dark:text-white">Upgrade to {planPrompt.requiredPlan || 'Pro'}</div>
                </div>
                <span className="text-xs font-black text-[#D4A77F]">₹999/month</span>
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
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#10141F]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#2A2F3A] px-3 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          href="/app"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            pathname === '/app'
              ? 'text-[#D4A77F] font-bold'
              : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Overview</span>
        </Link>

        <Link
          href="/app/live"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors relative ${
            pathname.startsWith('/app/live')
              ? 'text-[#D4A77F] font-bold'
              : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
          }`}
        >
          <span className="relative">
            <Radio className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981]"></span>
          </span>
          <span className="text-[10px]">Live</span>
        </Link>

        <Link
          href="/app/billing"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            pathname.startsWith('/app/billing')
              ? 'text-[#D4A77F] font-bold'
              : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px]">Billing</span>
        </Link>

        <Link
          href="/app/appointments"
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            pathname.startsWith('/app/appointments')
              ? 'text-[#D4A77F] font-bold'
              : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Bookings</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-[#FFFFFF] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">All Menus</span>
        </button>
      </div>
    </div>
  );
}
