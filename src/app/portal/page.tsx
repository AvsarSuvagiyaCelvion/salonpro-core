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
} from 'lucide-react';
import ThemeToggle from '@/components/landing/ThemeToggle';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
}

interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  brand_color: string;
}

interface Appointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  service_name: string;
  duration_min: number;
  service_price: number;
  staff_name: string;
  staff_role: string | null;
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
  const [activeTab, setActiveTab] = useState<'appointments' | 'bills' | 'memberships'>('appointments');

  // Auth form state (when not logged in)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authMobile, setAuthMobile] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [authConfirmPin, setAuthConfirmPin] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function checkSession() {
    try {
      setLoading(true);
      const res = await fetch('/api/customer/auth');
      const data = await res.json();

      if (data.loggedIn && data.customer) {
        setLoggedIn(true);
        setCustomer(data.customer);
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
      setSalon(data.salon);
      setUpcomingAppts(data.upcomingAppointments || []);
      setPastAppts(data.pastAppointments || []);
      setInvoices(data.invoices || []);
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Failed to load records:', err);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'bills' || tabParam === 'memberships' || tabParam === 'appointments') {
        setActiveTab(tabParam);
      }
    }

    checkSession();
  }, []);

  function handleSwitchTab(tab: 'appointments' | 'bills' | 'memberships') {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setLoggedIn(true);
      setCustomer(data.customer);
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
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] flex flex-col justify-center items-center p-4 selection:bg-[#D4A77F] selection:text-[#080B12] transition-colors duration-300">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

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
              New Account / Reset PIN
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
              href="/"
              className="text-xs text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#D4A77F] transition-colors inline-flex items-center gap-1"
            >
              <span>← Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ================= LOGGED IN: CUSTOMER PORTAL =================
  const brandColor = salon?.brand_color || '#D4A77F';

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] flex flex-col font-sans pb-24 transition-colors duration-300">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-[#10141F] border-b border-[#E5E7EB] dark:border-[#2A2F3A] px-4 py-6 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              style={{ backgroundColor: brandColor }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-[#080B12] text-2xl shadow-md border border-white/10"
            >
              {customer?.name.charAt(0) || 'C'}
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
            <ThemeToggle />

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
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A] pb-2 overflow-x-auto touch-scroll no-scrollbar">
          {[
            { id: 'appointments', label: `My Appointments (${upcomingAppts.length})`, icon: Calendar },
            { id: 'bills', label: `Bills & Receipts (${invoices.length})`, icon: Receipt },
            { id: 'memberships', label: `VIP Memberships (${plans.length})`, icon: Award },
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
                      className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold shadow-md"
                    >
                      <span>Book Slot Now →</span>
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
                  {upcomingAppts.map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#D4A77F]/15 text-[#D4A77F] border border-[#D4A77F]/30 flex flex-col items-center justify-center font-bold">
                          <span className="text-[10px] uppercase">{new Date(appt.starts_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' })}</span>
                          <span className="text-base">{new Date(appt.starts_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' })}</span>
                        </div>
                        <div>
                          <div className="font-bold text-base text-[#1F2937] dark:text-white">{appt.service_name}</div>
                          <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">
                            Stylist: <span className="text-[#1F2937] dark:text-white font-semibold">{appt.staff_name}</span> ({appt.staff_role || 'Stylist'})
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                            <span className="flex items-center gap-1 text-[#D4A77F] font-medium">
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

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          {appt.status}
                        </span>
                      </div>
                    </div>
                  ))}
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
                  {pastAppts.map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-4 flex justify-between items-center text-xs shadow-2xs"
                    >
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
                      <div className="text-right">
                        <div className="font-bold text-[#1F2937] dark:text-white">₹{Number(appt.service_price).toLocaleString('en-IN')}</div>
                        <span className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] capitalize">{appt.status}</span>
                      </div>
                    </div>
                  ))}
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
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#D4A77F]/15 text-[#D4A77F] border border-[#D4A77F]/30">
                        {p.kind}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.is_active
                            ? 'bg-[#10B981]/15 text-[#10B981]'
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
                          <span className="font-bold text-[#D4A77F]">{p.services_discount_pct}% OFF</span>
                        </div>
                        <div className="flex justify-between text-[#6B7280] dark:text-[#A0A8B8]">
                          <span>Products Discount:</span>
                          <span className="font-bold text-[#D4A77F]">{p.products_discount_pct}% OFF</span>
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
      </div>

      {/* Mobile Bottom Dock for Customer Portal */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#10141F]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#2A2F3A] px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => handleSwitchTab('appointments')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'appointments' ? 'text-[#D4A77F] font-bold scale-105' : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px]">Visits</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab('bills')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'bills' ? 'text-[#D4A77F] font-bold scale-105' : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span className="text-[10px]">Bills</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab('memberships')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'memberships' ? 'text-[#D4A77F] font-bold scale-105' : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span className="text-[10px]">VIP</span>
        </button>

        {salon?.slug && (
          <Link
            href={`/${salon.slug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A77F] text-[#080B12] rounded-xl text-xs font-bold shadow-md shadow-[#D4A77F]/30"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Book</span>
          </Link>
        )}
      </div>
    </div>
  );
}
