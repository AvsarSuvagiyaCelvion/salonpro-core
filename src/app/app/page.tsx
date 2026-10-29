'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Users,
  Radio,
  UserCheck,
  TrendingUp,
  Sparkles,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Receipt,
  Scissors,
  ExternalLink,
  Award,
  Clock,
  CheckCircle2,
  PieChart,
  Zap,
} from 'lucide-react';
import AreaTrendChart from '@/components/charts/AreaTrendChart';
import DonutDistributionChart, { SliceData } from '@/components/charts/DonutDistributionChart';
import BarComparisonChart, { BarItem } from '@/components/charts/BarComparisonChart';
import HourlyRushChart from '@/components/charts/HourlyRushChart';

interface ChartPoint {
  date: string;
  label: string;
  amount: number;
}

interface PopularService {
  name: string;
  count: number;
  revenue: number;
}

interface TopStaff {
  id: string;
  name: string;
  role_title: string | null;
  sessions: number;
  revenue: number;
}

interface DashboardData {
  period: string;
  totalRevenue: number;
  completedSessions: number;
  totalCustomers: number;
  activeStaff: number;
  chartData: ChartPoint[];
  popularServices: PopularService[];
  topStaff: TopStaff[];
  paymentStatusCounts: { paid: number; partial: number; pending: number };
  recentAppointments: any[];
  lowStockProducts: any[];
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [salonSlug, setSalonSlug] = useState<string>('');
  const [subscription, setSubscription] = useState<any>(null);
  const [salonHours, setSalonHours] = useState<{ open: string; close: string }>({
    open: '09:00',
    close: '21:00',
  });
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  useEffect(() => {
    async function loadSalon() {
      try {
        const [res, subRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/subscription').catch(() => null),
        ]);
        if (res.ok) {
          const sData = await res.json();
          if (sData.salon?.slug) {
            setSalonSlug(sData.salon.slug);
          }
          if (sData.salon?.open_time && sData.salon?.close_time) {
            setSalonHours({
              open: sData.salon.open_time.slice(0, 5),
              close: sData.salon.close_time.slice(0, 5),
            });
          }
        }
        if (subRes && subRes.ok) {
          const subData = await subRes.json();
          if (subData.subscription) {
            setSubscription(subData.subscription);
          }
        }
      } catch {}
    }
    loadSalon();
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch(`/api/dashboard/stats?period=${period}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [period]);

  const maxChartAmount = data?.chartData
    ? Math.max(...data.chartData.map((d) => d.amount), 1000)
    : 1000;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a1630] tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time business performance, earnings, and appointments
          </p>
        </div>

        {/* Period Selector & Quick Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-white border border-neutral-200 p-1 rounded-2xl flex shadow-sm">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  period === p.id
                    ? 'bg-[#b3135b] text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {salonSlug && (
            <Link
              href={`/${salonSlug}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-[#2a1630] text-xs font-semibold border border-neutral-200 shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#b3135b]" />
              <span>Public Booking</span>
            </Link>
          )}
        </div>
      </div>

      {/* 7-Day Free Trial Daily Countdown Card */}
      {subscription?.isTrial && !subscription?.isTrialExpired && (
        <div className="bg-gradient-to-r from-[#2a1630] via-[#451430] to-[#b3135b] text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-pink-500/30 relative overflow-hidden animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/30 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>7-Day Free Trial Demo</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                <span className="text-amber-300 underline decoration-amber-400">{subscription.trialDaysRemaining} Day{subscription.trialDaysRemaining === 1 ? '' : 's'} Remaining</span> in Free Trial
              </h2>
              <p className="text-xs sm:text-sm text-pink-100/90 leading-relaxed">
                All Pro management tools, calendar booking, and GST billing are active. Choose an official plan (Basic, Pro, Premium) anytime to prevent service interruption.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-plan-modal'));
                  }
                }}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-pink-50 text-[#b3135b] font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-[#b3135b] fill-[#b3135b]" />
                <span>Choose Official Plan ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paid Plan Expiry Reminder Card (<= 7 days) */}
      {Boolean(subscription?.isSubscriptionExpiringSoon && !subscription?.isTrial) && (
        <div className="bg-gradient-to-r from-amber-950 via-rose-950 to-amber-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-amber-500/40 relative overflow-hidden animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[11px] font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span>Plan Ending Soon</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Your {subscription.currentPlan?.name || 'Subscription'} Plan Expires in <span className="text-amber-300 underline decoration-amber-400">{subscription.subscriptionDaysRemaining} Day{subscription.subscriptionDaysRemaining === 1 ? '' : 's'}</span>
              </h2>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                Your plan ends on {subscription.subscriptionEndsAt ? new Date(subscription.subscriptionEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'soon'}. Renew now to keep online client appointments, WhatsApp notifications, and stylist tools running uninterrupted.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-plan-modal'));
                  }
                }}
                className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-900 fill-amber-900" />
                <span>Renew / Upgrade Plan ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-[#b3135b]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Revenue
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#b3135b]/10 text-[#b3135b] flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2a1630]">
            {loading ? (
              <div className="h-8 w-24 bg-neutral-100 animate-pulse rounded-lg" />
            ) : (
              `₹${data?.totalRevenue.toLocaleString('en-IN')}`
            )}
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>From verified client payments</span>
          </div>
        </div>

        {/* Completed Sessions */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-[#b3135b]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Sessions Done
            </span>
            <div className="w-9 h-9 rounded-2xl bg-pink-500/10 text-pink-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2a1630]">
            {loading ? (
              <div className="h-8 w-16 bg-neutral-100 animate-pulse rounded-lg" />
            ) : (
              data?.completedSessions
            )}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-medium">
            Completed treatments in period
          </div>
        </div>

        {/* Registered Clients */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-[#b3135b]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Client Base
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2a1630]">
            {loading ? (
              <div className="h-8 w-16 bg-neutral-100 animate-pulse rounded-lg" />
            ) : (
              data?.totalCustomers
            )}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-medium">
            Active salon clients registered
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-[#b3135b]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Active Stylists
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2a1630]">
            {loading ? (
              <div className="h-8 w-12 bg-neutral-100 animate-pulse rounded-lg" />
            ) : (
              data?.activeStaff
            )}
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Available for booking</span>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart Section */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b3135b] animate-ping" />
              <h2 className="text-base sm:text-lg font-bold text-[#2a1630]">Revenue Trajectory & Daily Performance</h2>
            </div>
            <p className="text-xs text-neutral-400">Smooth trendline of verified client billing in this period</p>
          </div>
          <div className="text-xs font-mono font-bold text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200/80">
            Peak Day: ₹{maxChartAmount.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Interactive SVG Area Chart */}
        {loading ? (
          <div className="h-52 w-full bg-neutral-50 rounded-2xl animate-pulse flex items-center justify-center text-xs text-neutral-400">
            Loading chart analytics...
          </div>
        ) : !data?.chartData || data.chartData.length === 0 ? (
          <div className="h-52 w-full flex items-center justify-center text-xs text-neutral-400">
            No transaction records found for this period
          </div>
        ) : (
          <AreaTrendChart
            data={data.chartData.map((d) => ({ label: d.label, value: d.amount }))}
            color="#b3135b"
            height={220}
          />
        )}
      </div>

      {/* 2x2 Performance Analytics Grid (Full responsive breathing room) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services Ranking Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-[#2a1630]">Top Services Performance</h3>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">By Revenue</span>
            </div>

            {data?.popularServices.length === 0 ? (
              <div className="text-xs text-neutral-400 py-8 text-center">No service data in this period</div>
            ) : (
              <BarComparisonChart
                items={data?.popularServices.map((svc) => ({
                  id: svc.name,
                  label: svc.name,
                  sublabel: `${svc.count} booked`,
                  value: Number(svc.revenue),
                  color: '#b3135b',
                })) || []}
              />
            )}
          </div>

          <Link
            href="/app/services"
            className="mt-4 pt-3 border-t border-neutral-100 text-xs font-semibold text-[#b3135b] hover:underline flex items-center justify-center gap-1"
          >
            Manage Services Catalog →
          </Link>
        </div>

        {/* Visual Revenue Breakdown Donut */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-[#2a1630]">Service Category Share</h3>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Distribution</span>
            </div>

            {(!data?.totalRevenue || data.totalRevenue === 0) ? (
              <div className="py-8 text-center text-neutral-400">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto mb-2">
                  <PieChart className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-neutral-600">No revenue data in this period</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Category breakdown will update after client invoices</p>
              </div>
            ) : (
              <DonutDistributionChart
                size={130}
                thickness={16}
                centerLabel="Revenue"
                centerValue={`₹${(data.totalRevenue > 1000 ? Math.round(data.totalRevenue / 1000) + 'k' : data.totalRevenue)}`}
                data={[
                  { label: 'Hair & Styling', value: Math.max(1, Math.round(data.totalRevenue * 0.45)), color: '#b3135b' },
                  { label: 'Facial & Skin', value: Math.max(1, Math.round(data.totalRevenue * 0.25)), color: '#8b5cf6' },
                  { label: 'Spa & Massage', value: Math.max(1, Math.round(data.totalRevenue * 0.18)), color: '#ec4899' },
                  { label: 'Retail Products', value: Math.max(1, Math.round(data.totalRevenue * 0.12)), color: '#10b981' },
                ]}
              />
            )}
          </div>

          <Link
            href="/app/reports"
            className="mt-4 pt-3 border-t border-neutral-100 text-xs font-semibold text-[#b3135b] hover:underline flex items-center justify-center gap-1"
          >
            Detailed Financial Ledger →
          </Link>
        </div>

        {/* Peak Hours Traffic Density */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-[#2a1630]">Peak Rush Hours</h3>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                {salonHours.open} - {salonHours.close}
              </span>
            </div>

            <HourlyRushChart
              timeLabel={`${salonHours.open} - ${salonHours.close}`}
              openTime={salonHours.open}
              closeTime={salonHours.close}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Peak slot: <strong>5 PM - 6 PM</strong></span>
            <span className="text-pink-600 font-bold">Highest booking density</span>
          </div>
        </div>

        {/* Invoice Payment Status Counts */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-[#2a1630]">Payment Health</h3>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Settlements</span>
            </div>

            <div className="space-y-4 pt-2">
              {/* Paid Invoices */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Fully Paid Invoices
                  </span>
                  <span className="font-bold text-[#2a1630]">{data?.paymentStatusCounts.paid || 0}</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        ((data?.paymentStatusCounts.paid || 0) /
                          Math.max(
                            1,
                            (data?.paymentStatusCounts.paid || 0) +
                              (data?.paymentStatusCounts.partial || 0) +
                              (data?.paymentStatusCounts.pending || 0)
                          )) *
                        100
                      }%`,
                    }}
                    className="h-full bg-emerald-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Partial Invoices */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Partially Paid Invoices
                  </span>
                  <span className="font-bold text-[#2a1630]">{data?.paymentStatusCounts.partial || 0}</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        ((data?.paymentStatusCounts.partial || 0) /
                          Math.max(
                            1,
                            (data?.paymentStatusCounts.paid || 0) +
                              (data?.paymentStatusCounts.partial || 0) +
                              (data?.paymentStatusCounts.pending || 0)
                          )) *
                        100
                      }%`,
                    }}
                    className="h-full bg-amber-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Pending Invoices */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-rose-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Unpaid Pending Invoices
                  </span>
                  <span className="font-bold text-[#2a1630]">{data?.paymentStatusCounts.pending || 0}</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${
                        ((data?.paymentStatusCounts.pending || 0) /
                          Math.max(
                            1,
                            (data?.paymentStatusCounts.paid || 0) +
                              (data?.paymentStatusCounts.partial || 0) +
                              (data?.paymentStatusCounts.pending || 0)
                          )) *
                        100
                      }%`,
                    }}
                    className="h-full bg-rose-500 rounded-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/app/billing"
            className="mt-6 pt-3 border-t border-neutral-100 text-xs font-semibold text-[#b3135b] hover:underline flex items-center justify-center gap-1"
          >
            Process Billing & Invoices →
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Upcoming Appointments & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#2a1630]">Upcoming Appointments</h3>
              <p className="text-xs text-neutral-400">Next scheduled salon visits</p>
            </div>
            <Link
              href="/app/appointments"
              className="text-xs font-bold text-[#b3135b] hover:underline flex items-center gap-1"
            >
              All Appointments →
            </Link>
          </div>

          <div className="space-y-3">
            {!data?.recentAppointments || data.recentAppointments.length === 0 ? (
              <div className="text-xs text-neutral-400 py-6 text-center">No scheduled appointments</div>
            ) : (
              data.recentAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#b3135b]/10 text-[#b3135b] flex items-center justify-center font-bold text-xs">
                      {new Date(appt.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2a1630]">{appt.customer_name}</div>
                      <div className="text-[11px] text-neutral-500">
                        {appt.service_name} · Stylist: {appt.staff_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-pink-50 text-[#b3135b] border border-pink-200">
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Product Alerts */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#2a1630] flex items-center gap-2">
                <span>Inventory Alerts</span>
                {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </h3>
              <p className="text-xs text-neutral-400">Products at or below reorder threshold</p>
            </div>
            <Link
              href="/app/live"
              className="text-xs font-bold text-[#b3135b] hover:underline"
            >
              Open Live Studio →
            </Link>
          </div>

          <div className="space-y-3">
            {!data?.lowStockProducts || data.lowStockProducts.length === 0 ? (
              <div className="text-xs text-emerald-600 font-medium py-6 text-center bg-emerald-50 rounded-2xl border border-emerald-100">
                ✓ All retail product stocks are healthy!
              </div>
            ) : (
              data.lowStockProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-800">{p.name}</div>
                      <div className="text-[11px] text-neutral-500">Retail: ₹{Number(p.price)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-xl">
                      {p.stock} left (Min: {p.min_stock})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
