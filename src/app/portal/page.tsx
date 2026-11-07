'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Receipt,
  Award,
  Clock,
  Sparkles,
  LogOut,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  ShieldAlert,
  X,
  Check,
  User,
  Lock,
  MapPin,
  KeyRound,
  ShieldCheck,
  Star,
} from 'lucide-react';
import ThemeToggle from '@/components/landing/ThemeToggle';
import ImageUploader from '@/components/ui/ImageUploader';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address?: string | null;
  avatar_url?: string | null;
}

interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  brand_color: string;
  cancel_policy_hours?: number;
  max_advance_days?: number;
  min_advance_hours?: number;
}

interface Appointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  service_id?: string;
  service_name: string;
  duration_min: number;
  service_price: number;
  staff_id?: string;
  staff_name: string;
  staff_role: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  rescheduled_count?: number;
}

interface Invoice {
  id: string;
  number: string;
  receipt_token: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  status: 'paid' | 'partial' | 'pending';
  created_at: string;
}

interface Plan {
  id: string;
  kind: string;
  plan_name: string;
  services_discount_pct: number | null;
  products_discount_pct: number | null;
  starts_on: string;
  expires_on: string;
  is_active: boolean;
}

export default function CustomerPortalPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  const [pastAppts, setPastAppts] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'bills' | 'memberships' | 'profile'>('appointments');

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // PIN change form state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changingPin, setChangingPin] = useState(false);
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);
  const [pinErrorMsg, setPinErrorMsg] = useState<string | null>(null);

  function syncProfile(cust: Customer) {
    setProfileName(cust.name || '');
    setProfileEmail(cust.email || '');
    setProfileAddress(cust.address || '');
    setProfileAvatarUrl(cust.avatar_url || null);
  }

  // Auth form state (when not logged in)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authMobile, setAuthMobile] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [authConfirmPin, setAuthConfirmPin] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastSalonSlug, setLastSalonSlug] = useState<string | null>(null);

  // Cancel & Reschedule Modals State
  const [cancelModalAppt, setCancelModalAppt] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [rescheduleModalAppt, setRescheduleModalAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<Array<{ time: string; formattedTime: string; staffId: string; staffName: string }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSlotStaffId, setSelectedSlotStaffId] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [portalMessage, setPortalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Customer Reviews State
  const [reviewsMap, setReviewsMap] = useState<Record<string, any>>({});
  const [reviewModalAppt, setReviewModalAppt] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  function canModifyAppointment(startsAtStr: string, policyHours: number = 2): boolean {
    const startsAt = new Date(startsAtStr).getTime();
    const cutoff = startsAt - policyHours * 3600 * 1000;
    return Date.now() <= cutoff;
  }

  async function loadRescheduleSlots(dateStr: string, appt: Appointment) {
    if (!salon?.slug || !appt.service_id || !dateStr) return;
    try {
      setLoadingSlots(true);
      setRescheduleError(null);
      setSelectedSlot(null);
      setSelectedSlotStaffId(null);
      const url = `/api/public/${salon.slug}/slots?service_id=${appt.service_id}&date=${dateStr}&staff_id=${appt.staff_id || 'anyone'}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch slots');
      }
      setRescheduleSlots(data.slots || []);
    } catch (err: any) {
      setRescheduleError(err.message || 'Error fetching available slots');
      setRescheduleSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleOpenReschedule(appt: Appointment) {
    setRescheduleModalAppt(appt);
    setRescheduleError(null);
    setSelectedSlot(null);
    setSelectedSlotStaffId(null);
    const nowIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    setRescheduleDate(nowIST);
    loadRescheduleSlots(nowIST, appt);
  }

  async function handleConfirmCancel() {
    if (!cancelModalAppt) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/customer/appointments/${cancelModalAppt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel appointment');
      }
      setCancelModalAppt(null);
      setPortalMessage({ type: 'success', text: 'Appointment cancelled successfully.' });
      setTimeout(() => setPortalMessage(null), 5000);
      await loadCustomerRecords();
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  }

  async function handleConfirmReschedule() {
    if (!rescheduleModalAppt || !selectedSlot || !rescheduleDate) return;
    setRescheduling(true);
    setRescheduleError(null);
    try {
      const res = await fetch(`/api/customer/appointments/${rescheduleModalAppt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          date: rescheduleDate,
          time: selectedSlot,
          staff_id: selectedSlotStaffId || rescheduleModalAppt.staff_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.isOverlap) {
          if (rescheduleModalAppt) {
            await loadRescheduleSlots(rescheduleDate, rescheduleModalAppt);
          }
        }
        throw new Error(data.error || 'Failed to reschedule appointment');
      }
      setRescheduleModalAppt(null);
      setPortalMessage({ type: 'success', text: 'Appointment rescheduled successfully!' });
      setTimeout(() => setPortalMessage(null), 5000);
      await loadCustomerRecords();
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule appointment');
    } finally {
      setRescheduling(false);
    }
  }

  async function checkSession() {
    try {
      setLoading(true);
      const res = await fetch('/api/customer/auth');
      const data = await res.json();

      if (data.loggedIn && data.customer) {
        setLoggedIn(true);
        setCustomer(data.customer);
        syncProfile(data.customer);
        await loadCustomerRecords();
      } else {
        setLoggedIn(false);
      }
    } catch {
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomerRecords() {
    try {
      const res = await fetch('/api/customer/records');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomer(data.customer);
      if (data.customer) {
        syncProfile(data.customer);
      }
      setSalon(data.salon);
      setUpcomingAppts(data.upcomingAppointments || []);
      setPastAppts(data.pastAppointments || []);
      setInvoices(data.invoices || []);
      setPlans(data.plans || []);

      // Fetch customer's submitted reviews
      try {
        const revRes = await fetch('/api/customer/reviews');
        if (revRes.ok) {
          const revData = await revRes.json();
          const rMap: Record<string, any> = {};
          (revData.reviews || []).forEach((r: any) => {
            rMap[r.appointment_id] = r;
          });
          setReviewsMap(rMap);
        }
      } catch {}
    } catch (err) {
      console.error('Failed to load records:', err);
    }
  }

  function handleOpenReviewModal(appt: Appointment) {
    setReviewModalAppt(appt);
    setReviewRating(5);
    setReviewComment('');
    setReviewError(null);
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewModalAppt) return;
    setSubmittingReview(true);
    setReviewError(null);

    try {
      const res = await fetch('/api/customer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: reviewModalAppt.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Update reviewsMap locally
      setReviewsMap((prev) => ({
        ...prev,
        [reviewModalAppt.id]: data.review,
      }));

      setReviewModalAppt(null);
      setPortalMessage({ type: 'success', text: 'Thank you! Your review has been submitted.' });
      setTimeout(() => setPortalMessage(null), 5000);
    } catch (err: any) {
      setReviewError(err.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam === 'bills' ||
        tabParam === 'memberships' ||
        tabParam === 'appointments' ||
        tabParam === 'profile'
      ) {
        setActiveTab(tabParam);
      }
      const slug = params.get('salon') || params.get('slug') || localStorage.getItem('salonpro_last_salon');
      if (slug) setLastSalonSlug(slug);
    }

    checkSession();
  }, []);

  function handleSwitchTab(tab: 'appointments' | 'bills' | 'memberships' | 'profile') {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const cleanName = profileName.trim();
    if (cleanName.length < 2 || cleanName.length > 60) {
      setProfileErrorMsg('Full name must be between 2 and 60 characters.');
      setSavingProfile(false);
      return;
    }

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: profileEmail.trim() || null,
          address: profileAddress.trim() || null,
          avatar_url: profileAvatarUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setCustomer(data.customer);
      syncProfile(data.customer);
      setProfileSuccessMsg('Your profile has been saved successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Error saving profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault();
    setChangingPin(true);
    setPinSuccessMsg(null);
    setPinErrorMsg(null);

    const cleanCurr = currentPin.trim();
    const cleanNew = newPin.trim();
    const cleanConf = confirmPin.trim();

    if (!cleanCurr) {
      setPinErrorMsg('Please enter your current PIN.');
      setChangingPin(false);
      return;
    }

    if (!/^\d{4}$/.test(cleanNew)) {
      setPinErrorMsg('New PIN must be exactly 4 digits (0-9).');
      setChangingPin(false);
      return;
    }

    if (cleanNew === cleanCurr) {
      setPinErrorMsg('New PIN must be different from your current PIN.');
      setChangingPin(false);
      return;
    }

    if (cleanNew !== cleanConf) {
      setPinErrorMsg('New PIN and Confirm PIN do not match.');
      setChangingPin(false);
      return;
    }

    try {
      const res = await fetch('/api/customer/profile/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin: cleanCurr,
          newPin: cleanNew,
          confirmPin: cleanConf,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update PIN.');
      }

      setPinSuccessMsg('Your 4-digit PIN has been changed successfully!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => setPinSuccessMsg(null), 4000);
    } catch (err: any) {
      setPinErrorMsg(err.message || 'Error updating PIN.');
    } finally {
      setChangingPin(false);
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);

    if (authMode === 'signup' && authPin !== authConfirmPin) {
      setAuthError('PINs do not match. Please verify your confirm PIN.');
      setAuthSubmitting(false);
      return;
    }

    const lastSalon = typeof window !== 'undefined' ? localStorage.getItem('salonpro_last_salon') : null;
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const salonSlugParam = urlParams?.get('salon') || urlParams?.get('slug') || lastSalon || undefined;

    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          name: authName,
          mobile: authMobile,
          email: authEmail,
          pin: authPin,
          confirmPin: authMode === 'signup' ? authConfirmPin : undefined,
          salonSlug: salonSlugParam,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresLogin) {
          setAuthMode('login');
          setAuthError(data.error || 'Account already exists. Please enter your 4-digit PIN to sign in.');
          return;
        }
        if (data.canSetPin) {
          setAuthMode('signup');
          setAuthError(data.error || 'Please set your 4-digit PIN to access your portal.');
          return;
        }
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.customer?.salon_slug && typeof window !== 'undefined') {
        localStorage.setItem('salonpro_last_salon', data.customer.salon_slug);
      }

      setLoggedIn(true);
      setCustomer(data.customer);
      if (data.customer) {
        syncProfile(data.customer);
      }
      await loadCustomerRecords();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/customer/logout', { method: 'POST' });
      setLoggedIn(false);
      setCustomer(null);
    } catch {
      setLoggedIn(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#D4A77F] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-[#6B7280] dark:text-[#A0A8B8] text-xs font-medium">Loading customer portal...</p>
      </div>
    );
  }

  // ================= NOT LOGGED IN: LOGIN / SIGNUP VIEW =================
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] flex flex-col selection:bg-[#D4A77F] selection:text-[#080B12] transition-colors duration-300">
        {/* Sticky Top Portal Navigation Header */}
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#10141F]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2A2F3A] px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-2xs transition-colors duration-250">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href={lastSalonSlug ? `/${lastSalonSlug}` : '/'}
              className="flex items-center gap-2 group min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] flex items-center justify-center font-black text-sm sm:text-base text-[#D4A77F] shadow-sm shrink-0 group-hover:rotate-12 transition-transform duration-300">
                ✂
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF] tracking-tight block leading-tight truncate">
                  Salon<span className="text-[#8C5E2E] dark:text-[#D4A77F]">Pro</span>
                </span>
                <span className="text-[10px] text-[#8C5E2E] dark:text-[#D4A77F] font-bold block -mt-0.5 truncate">
                  Client Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {lastSalonSlug ? (
              <Link
                href={`/${lastSalonSlug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Book Slot</span>
              </Link>
            ) : (
              <Link
                href="/"
                className="text-xs text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#D4A77F] transition-colors font-medium px-2 py-1"
              >
                Home
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 w-full max-w-full">
          <div className="max-w-md w-full bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#D4A77F] text-[#080B12] flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Sparkles className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-[#1F2937] dark:text-[#FFFFFF]">Client Portal</h1>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">
                {authMode === 'login'
                  ? 'Sign in to view your appointments, receipts and benefits'
                  : 'Create your customer account to track your visits'}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-[#F3F4F6] dark:bg-[#10141F] rounded-2xl mb-5 border border-[#E5E7EB] dark:border-[#2A2F3A]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthConfirmPin('');
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-[#D4A77F] text-[#080B12] shadow-sm font-bold'
                    : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                  setAuthConfirmPin('');
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-[#D4A77F] text-[#080B12] shadow-sm font-bold'
                    : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
                }`}
              >
                New Account / Set PIN
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1.5">
                    Full Name <span className="text-[#D4A77F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diya Joshi"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-3 text-sm text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1.5">
                  Mobile Number <span className="text-[#D4A77F]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm text-[#9CA3AF] dark:text-[#747D8D] font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    placeholder="9898023456"
                    value={authMobile}
                    onChange={(e) => setAuthMobile(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl pl-14 pr-4 py-3 text-sm font-mono text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="diya.j@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-3 text-sm text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1.5">
                  4-Digit PIN / Password <span className="text-[#D4A77F]">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="Enter 4-digit PIN"
                  value={authPin}
                  onChange={(e) => setAuthPin(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-3 text-sm font-mono text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1.5">
                    Confirm 4-Digit PIN <span className="text-[#D4A77F]">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Re-enter 4-digit PIN"
                    value={authConfirmPin}
                    onChange={(e) => setAuthConfirmPin(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-3 text-sm font-mono text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-extrabold text-sm shadow-md shadow-[#D4A77F]/20 transition-all active:scale-98 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {authSubmitting ? 'Verifying...' : authMode === 'login' ? 'Sign In to Portal' : 'Create Customer Account'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#E5E7EB] dark:border-[#2A2F3A] text-center">
              <Link
                href={lastSalonSlug ? `/${lastSalonSlug}` : '/'}
                className="text-xs text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#D4A77F] transition-colors inline-flex items-center gap-1"
              >
                <span>← Back to {lastSalonSlug ? 'Salon Booking' : 'Home'}</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ================= LOGGED IN: CUSTOMER PORTAL =================
  const brandColor = salon?.brand_color || '#D4A77F';

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] flex flex-col font-sans pb-24 transition-colors duration-300">
      {/* Sticky Top Portal Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#10141F]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2A2F3A] px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-2xs transition-colors duration-250">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href={salon?.slug ? `/${salon.slug}` : lastSalonSlug ? `/${lastSalonSlug}` : '/'}
            className="flex items-center gap-2 group min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] flex items-center justify-center font-black text-sm sm:text-base text-[#D4A77F] shadow-sm shrink-0 group-hover:rotate-12 transition-transform duration-300">
              ✂
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF] tracking-tight block leading-tight truncate max-w-[140px] xs:max-w-xs sm:max-w-md">
                {salon?.name || 'SalonPro'}
              </span>
              <span className="text-[10px] text-[#8C5E2E] dark:text-[#D4A77F] font-bold block -mt-0.5 truncate">
                Customer Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {salon?.slug && (
            <Link
              href={`/${salon.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Book Visit</span>
            </Link>
          )}

          <ThemeToggle />

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out of customer portal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F4F6] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-[#6B7280] dark:text-[#A0A8B8] text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Top Profile Banner */}
      <div className="bg-white dark:bg-[#10141F] border-b border-[#E5E7EB] dark:border-[#2A2F3A] px-4 py-6 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              style={{ backgroundColor: customer?.avatar_url ? 'transparent' : brandColor }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-[#080B12] text-2xl shadow-md border border-white/10 overflow-hidden shrink-0"
            >
              {customer?.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={customer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                customer?.name?.charAt(0) || 'C'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] dark:text-[#FFFFFF]">{customer?.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  Verified Client
                </span>
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] font-mono mt-0.5">
                +91 {customer?.mobile} {customer?.email && `· ${customer.email}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {salon?.slug && (
              <Link
                href={`/${salon.slug}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Book Slot</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#F3F4F6] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] hover:bg-[#E5E7EB] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-neutral-200 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto p-3 xs:p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A] pb-2 overflow-x-auto touch-scroll no-scrollbar">
          {[
            { id: 'appointments', label: `My Appointments (${upcomingAppts.length})`, icon: Calendar },
            { id: 'bills', label: `Bills & Receipts (${invoices.length})`, icon: Receipt },
            { id: 'memberships', label: `VIP Memberships (${plans.length})`, icon: Award },
            { id: 'profile', label: `Profile & Security`, icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSwitchTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-[#D4A77F] text-[#080B12] shadow-md shadow-[#D4A77F]/20 font-bold scale-102'
                    : 'bg-white dark:bg-[#141926] text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white border border-[#E5E7EB] dark:border-[#2A2F3A]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: APPOINTMENTS ================= */}
        {activeTab === 'appointments' && (
          <div className="space-y-6 animate-fade-in">
            {portalMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2 font-medium ${
                  portalMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                }`}
              >
                {portalMessage.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{portalMessage.text}</span>
              </div>
            )}

            {/* Upcoming Appointments */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0A8B8] mb-3">
                Upcoming Visits
              </h2>

              {upcomingAppts.length === 0 ? (
                <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-8 text-center shadow-xs">
                  <Calendar className="w-10 h-10 text-[#9CA3AF] dark:text-[#747D8D] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#1F2937] dark:text-white">No upcoming appointments scheduled</p>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">Book your next beauty session in seconds</p>
                  {salon?.slug ? (
                    <Link
                      href={`/${salon.slug}`}
                      className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold shadow-md whitespace-nowrap"
                    >
                      <span>Book Slot Now</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#1F2937] dark:text-white text-xs font-bold"
                    >
                      <span>Explore Services</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppts.map((appt) => {
                    const policyHours = salon?.cancel_policy_hours ?? 2;
                    const isModifiable = canModifyAppointment(appt.starts_at, policyHours);
                    const isScheduled = appt.status === 'scheduled';
                    const maxReschedulesReached = (appt.rescheduled_count ?? 0) >= 2;

                    return (
                      <div
                        key={appt.id}
                        className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 shadow-xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] border border-[#D4A77F]/30 flex flex-col items-center justify-center font-bold shrink-0">
                              <span className="text-[10px] uppercase">
                                {new Date(appt.starts_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' })}
                              </span>
                              <span className="text-base">
                                {new Date(appt.starts_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' })}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-base text-[#1F2937] dark:text-white">{appt.service_name}</div>
                              <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">
                                Stylist: <span className="text-[#1F2937] dark:text-white font-semibold">{appt.staff_name}</span> ({appt.staff_role || 'Stylist'})
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                                <span className="flex items-center gap-1 text-[#8C5E2E] dark:text-[#D4A77F] font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(appt.starts_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span>·</span>
                                <span>⏱ {appt.duration_min} mins</span>
                                <span>·</span>
                                <span className="font-bold text-[#1F2937] dark:text-white">₹{Number(appt.service_price).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            {appt.rescheduled_count && appt.rescheduled_count > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A77F]/20 text-[#B8905F] dark:text-[#D4A77F] border border-[#D4A77F]/30">
                                Rescheduled ({appt.rescheduled_count}x)
                              </span>
                            ) : null}
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                              {appt.status}
                            </span>
                          </div>
                        </div>

                        {/* Policy info and Cancel / Reschedule actions */}
                        {isScheduled && (
                          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
                              <ShieldAlert className="w-3.5 h-3.5 text-[#D4A77F] shrink-0" />
                              <span>Free cancellation up to {policyHours} hour{policyHours === 1 ? '' : 's'} before</span>
                            </div>

                            {isModifiable ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenReschedule(appt)}
                                  disabled={maxReschedulesReached}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    maxReschedulesReached
                                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                                      : 'bg-[#D4A77F]/15 hover:bg-[#D4A77F]/25 text-[#9E6E38] dark:text-[#D4A77F] border border-[#D4A77F]/30 cursor-pointer active:scale-95'
                                  }`}
                                  title={maxReschedulesReached ? 'Maximum 2 reschedules reached' : 'Reschedule visit'}
                                >
                                  {maxReschedulesReached ? 'Max Reschedules (2/2)' : 'Reschedule'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelModalAppt(appt);
                                    setCancelError(null);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer active:scale-95"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                <span>
                                  Cancellation closed. Please call the salon{salon?.phone ? ` at ${salon.phone}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past Visits */}
            {pastAppts.length > 0 && (
              <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0A8B8] mb-3">
                  Past Visits History
                </h2>
                <div className="space-y-2.5">
                  {pastAppts.map((appt) => {
                    const existingReview = reviewsMap[appt.id];
                    const isCompleted = appt.status === 'completed' || appt.status === 'done';
                    const apptTime = new Date(appt.ends_at || appt.starts_at).getTime();
                    const isWithin30Days = Date.now() - apptTime <= 30 * 24 * 60 * 60 * 1000;
                    const canReview = isCompleted && !existingReview && isWithin30Days;

                    return (
                      <div
                        key={appt.id}
                        className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-4 text-xs shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-[#1F2937] dark:text-white">{appt.service_name}</div>
                            <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
                              {new Date(appt.starts_at).toLocaleDateString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              ·{' '}
                              {new Date(appt.starts_at).toLocaleTimeString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              with {appt.staff_name}
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                            <div className="font-bold text-[#1F2937] dark:text-white">
                              ₹{Number(appt.service_price).toLocaleString('en-IN')}
                            </div>
                            <div className="flex items-center gap-1">
                              {appt.rescheduled_count && appt.rescheduled_count > 0 ? (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[#D4A77F]/20 text-[#B8905F] dark:text-[#D4A77F]">
                                  Rescheduled
                                </span>
                              ) : null}
                              <span
                                className={`text-[10px] font-bold capitalize ${
                                  appt.status === 'cancelled'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : appt.status === 'completed' || appt.status === 'done'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-[#6B7280] dark:text-[#A0A8B8]'
                                }`}
                              >
                                {appt.status === 'cancelled'
                                  ? appt.cancelled_by === 'customer'
                                    ? 'Cancelled (by you)'
                                    : 'Cancelled'
                                  : appt.status === 'done'
                                  ? 'Completed'
                                  : appt.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Submitted Review (Read-only) */}
                        {existingReview && (
                          <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-[11px] space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center text-amber-400 text-xs">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={
                                      i < existingReview.rating
                                        ? 'text-amber-400'
                                        : 'text-neutral-300 dark:text-neutral-700'
                                    }
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="font-bold text-neutral-700 dark:text-neutral-200">
                                Your rating ({existingReview.rating}/5)
                              </span>
                            </div>

                            {existingReview.comment && (
                              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
                                &ldquo;{existingReview.comment}&rdquo;
                              </p>
                            )}

                            {existingReview.owner_reply && (
                              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#10141F] border-l-2 border-[#D4A77F] text-[10px] text-neutral-600 dark:text-neutral-300 mt-1 space-y-0.5">
                                <span className="font-bold text-[#D4A77F] block">Salon response:</span>
                                <p>{existingReview.owner_reply}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Review Call to Action */}
                        {canReview && (
                          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                            <span className="text-[10px] text-neutral-400">
                              Completed visit · Share your feedback
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenReviewModal(appt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>Rate this visit</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: INVOICES & BILLS ================= */}
        {activeTab === 'bills' && (
          <div className="animate-fade-in">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0A8B8] mb-3">
              Your Digital Salon Invoices
            </h2>

            {invoices.length === 0 ? (
              <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-8 text-center shadow-xs">
                <Receipt className="w-10 h-10 text-[#9CA3AF] dark:text-[#747D8D] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1F2937] dark:text-white">No invoices recorded yet</p>
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">Invoices generated upon completing sessions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1F2937] dark:text-white text-sm">{inv.number}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                              : inv.status === 'partial'
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                              : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">
                        Issued on {new Date(inv.created_at).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        at {new Date(inv.created_at).toLocaleTimeString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-[#6B7280] dark:text-[#A0A8B8]">
                          Total: <strong className="text-[#1F2937] dark:text-white">₹{Number(inv.total).toLocaleString('en-IN')}</strong>
                        </span>
                        <span>·</span>
                        <span className="text-[#10B981]">
                          Paid: <strong>₹{Number(inv.paid_amount).toLocaleString('en-IN')}</strong>
                        </span>
                        {Number(inv.due_amount) > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[#EF4444]">
                              Due: <strong>₹{Number(inv.due_amount).toLocaleString('en-IN')}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/b/${inv.receipt_token}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] hover:bg-[#E5E7EB] dark:hover:bg-[#2A2F3A] text-[#1F2937] dark:text-white text-xs font-bold transition-all self-end sm:self-auto border border-[#E5E7EB] dark:border-[#2A2F3A] active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#D4A77F]" />
                      <span>View Receipt / PDF</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: MEMBERSHIPS & PACKAGES ================= */}
        {activeTab === 'memberships' && (
          <div className="animate-fade-in">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0A8B8] mb-3">
              Your VIP Subscriptions & Packages
            </h2>

            {plans.length === 0 ? (
              <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-8 text-center shadow-xs">
                <Award className="w-10 h-10 text-[#9CA3AF] dark:text-[#747D8D] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1F2937] dark:text-white">No active VIP membership found</p>
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">
                  Ask our salon manager to activate a Gold VIP plan to enjoy up to 15% off all services!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 relative overflow-hidden shadow-xs"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] border border-[#D4A77F]/30">
                        {p.kind}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Expired'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#1F2937] dark:text-white">{p.plan_name}</h3>

                    {p.kind === 'membership' && (
                      <div className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] space-y-1 text-xs">
                        <div className="flex justify-between text-[#6B7280] dark:text-[#A0A8B8]">
                          <span>Services Discount:</span>
                          <span className="font-bold text-[#8C5E2E] dark:text-[#D4A77F]">{p.services_discount_pct}% OFF</span>
                        </div>
                        <div className="flex justify-between text-[#6B7280] dark:text-[#A0A8B8]">
                          <span>Products Discount:</span>
                          <span className="font-bold text-[#8C5E2E] dark:text-[#D4A77F]">{p.products_discount_pct}% OFF</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-2 text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
                      Valid until:{' '}
                      <strong className="text-[#1F2937] dark:text-white">
                        {new Date(p.expires_on).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: PROFILE & SECURITY ================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* Profile Update Feedback */}
            {profileSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Personal Details */}
              <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                  <div className="w-8 h-8 rounded-xl bg-[#D4A77F]/15 text-[#D4A77F] flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1F2937] dark:text-white">Personal Profile</h3>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
                      Keep your contact and address details up to date
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Avatar Uploader */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <ImageUploader
                      value={profileAvatarUrl}
                      onChange={(url) => setProfileAvatarUrl(url)}
                      onRemove={() => setProfileAvatarUrl(null)}
                      type="avatar"
                      mode="avatar"
                      label="Profile Picture"
                      helperText="Square photo recommended. Max 400x400px, WebP/JPEG, <=60 KB."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                      Full Name <span className="text-[#D4A77F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Diya Joshi"
                      className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-2.5 text-xs text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5 flex items-center justify-between">
                      <span>Registered Mobile</span>
                      <span className="text-[10px] text-neutral-400 font-normal flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Read-only ID
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-xs text-[#9CA3AF] dark:text-[#747D8D] font-mono">+91</span>
                      <input
                        type="tel"
                        disabled
                        value={customer?.mobile || ''}
                        className="w-full bg-neutral-100 dark:bg-neutral-900 border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl pl-12 pr-4 py-2.5 text-xs font-mono text-[#6B7280] dark:text-[#A0A8B8] cursor-not-allowed select-none"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Your phone number is linked to your salon visits and cannot be altered.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. diya.j@example.com"
                      className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-2.5 text-xs text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                      Delivery / Home Address (Optional)
                    </label>
                    <textarea
                      rows={2}
                      maxLength={250}
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      placeholder="e.g. 402, Shivalik Heights, CG Road, Ahmedabad"
                      className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-2.5 text-xs text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                    />
                    <div className="flex justify-end text-[10px] text-neutral-400 mt-0.5">
                      {profileAddress.length}/250 characters
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-extrabold text-xs shadow-md shadow-[#D4A77F]/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                  </button>
                </form>
              </div>

              {/* Card 2: Security & PIN Change */}
              <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1F2937] dark:text-white">Security & 4-Digit PIN</h3>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
                      Change your security passcode for accessing your portal
                    </p>
                  </div>
                </div>

                {pinSuccessMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pinSuccessMsg}</span>
                  </div>
                )}

                {pinErrorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{pinErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleChangePin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                      Current 4-Digit PIN <span className="text-[#D4A77F]">*</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-2.5 text-xs font-mono tracking-widest text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                      New 4-Digit PIN <span className="text-[#D4A77F]">*</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-2.5 text-xs font-mono tracking-widest text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Must be 4 numbers (0-9) and different from current PIN.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                      Confirm New 4-Digit PIN <span className="text-[#D4A77F]">*</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-2.5 text-xs font-mono tracking-widest text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={changingPin || !currentPin || !newPin || !confirmPin}
                      className="w-full py-3 rounded-2xl bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-neutral-900 font-extrabold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {changingPin ? 'Updating PIN...' : 'Update Security PIN'}
                    </button>
                  </div>
                </form>

                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300">
                  <div className="font-bold mb-0.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Security Lock Protection
                  </div>
                  5 consecutive failed PIN attempts will lock PIN changes for 15 minutes to protect your account.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= CANCEL CONFIRMATION MODAL ================= */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-[#1F2937] dark:text-white">Cancel Appointment</h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalAppt(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-[#4B5563] dark:text-[#9CA3AF]">
              Are you sure you want to cancel your appointment for{' '}
              <strong className="text-[#1F2937] dark:text-white">{cancelModalAppt.service_name}</strong> with{' '}
              <strong className="text-[#1F2937] dark:text-white">{cancelModalAppt.staff_name}</strong> on{' '}
              <strong className="text-[#1F2937] dark:text-white">
                {new Date(cancelModalAppt.starts_at).toLocaleDateString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </strong>{' '}
              at{' '}
              <strong className="text-[#1F2937] dark:text-white">
                {new Date(cancelModalAppt.starts_at).toLocaleTimeString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
              ?
            </p>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelModalAppt(null)}
                className="px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                No, Keep Visit
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESCHEDULE MODAL ================= */}
      {rescheduleModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D4A77F]/20 text-[#B8905F] dark:text-[#D4A77F] flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#1F2937] dark:text-white">Reschedule Appointment</h3>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
                    {rescheduleModalAppt.service_name} · Stylist: {rescheduleModalAppt.staff_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalAppt(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                Select New Date
              </label>
              <input
                type="date"
                min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
                max={new Date(Date.now() + (salon?.max_advance_days || 30) * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
                value={rescheduleDate}
                onChange={(e) => {
                  const newD = e.target.value;
                  setRescheduleDate(newD);
                  if (rescheduleModalAppt) {
                    loadRescheduleSlots(newD, rescheduleModalAppt);
                  }
                }}
                className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-2.5 text-sm font-mono text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
              />
            </div>

            {/* Available Slots */}
            <div>
              <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-2">
                Choose Time Slot
              </label>

              {loadingSlots ? (
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#D4A77F] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-neutral-400 mt-2">Checking open slots...</span>
                </div>
              ) : rescheduleSlots.length === 0 ? (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-500">
                  No slots available on this date. Please pick another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                  {rescheduleSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot.time);
                          setSelectedSlotStaffId(slot.staffId);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                          isSelected
                            ? 'bg-[#D4A77F] text-[#080B12] border-[#D4A77F] shadow-sm font-extrabold scale-102'
                            : 'bg-[#F9FAFB] dark:bg-[#10141F] text-[#1F2937] dark:text-neutral-200 border-[#E5E7EB] dark:border-[#2A2F3A] hover:border-[#D4A77F]'
                        }`}
                      >
                        {slot.formattedTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
              <span className="text-[11px] text-neutral-400">
                Reschedule {Number(rescheduleModalAppt.rescheduled_count || 0) + 1} of 2
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={rescheduling}
                  onClick={() => setRescheduleModalAppt(null)}
                  className="px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot || rescheduling}
                  onClick={handleConfirmReschedule}
                  className="px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-extrabold shadow-md shadow-[#D4A77F]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {rescheduling ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUBMIT VISIT REVIEW ================= */}
      {reviewModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-white">Rate Your Visit</h3>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] truncate max-w-[200px]">
                    {reviewModalAppt.service_name} · {reviewModalAppt.staff_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalAppt(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {reviewError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selector (Fits cleanly on 1 line at 320px) */}
              <div className="text-center py-1">
                <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-2">
                  How was your experience?
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          star <= reviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-300 dark:text-neutral-700 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  {reviewRating === 5 && '★★★★★ Excellent'}
                  {reviewRating === 4 && '★★★★☆ Very Good'}
                  {reviewRating === 3 && '★★★☆☆ Average'}
                  {reviewRating === 2 && '★★☆☆☆ Below Average'}
                  {reviewRating === 1 && '★☆☆☆☆ Poor'}
                </div>
              </div>

              {/* Optional Comment */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                  Your Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of your visit, the stylist's service, or styling tips..."
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-3.5 py-2.5 text-xs text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                />
                <div className="flex justify-end text-[10px] text-neutral-400 mt-0.5">
                  {reviewComment.length}/500
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => setReviewModalAppt(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Dock for Customer Portal */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#10141F]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#2A2F3A] px-4 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => handleSwitchTab('appointments')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'appointments' ? 'text-[#8C5E2E] dark:text-[#D4A77F] font-bold scale-105' : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px]">Visits</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab('bills')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'bills' ? 'text-[#8C5E2E] dark:text-[#D4A77F] font-bold scale-105' : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span className="text-[10px]">Bills</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab('memberships')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'memberships' ? 'text-[#8C5E2E] dark:text-[#D4A77F] font-bold scale-105' : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span className="text-[10px]">VIP</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab('profile')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-[#8C5E2E] dark:text-[#D4A77F] font-bold scale-105' : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[10px]">Profile</span>
        </button>

        {salon?.slug && (
          <Link
            href={`/${salon.slug}`}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A77F] text-[#080B12] rounded-xl text-xs font-bold shadow-md shadow-[#D4A77F]/30"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Book</span>
          </Link>
        )}
      </div>
    </div>
  );
}
