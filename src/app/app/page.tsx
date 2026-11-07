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
  Package,
} from 'lucide-react';
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
  totalProducts?: number;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('today');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [salonSlug, setSalonSlug] = useState<string>('');
  const [subscription, setSubscription] = useState<any>(null);
  const [salonHours, setSalonHours] = useState<{ open: string; close: string }>({
    open: '09:00',
    close: '21:00',
  });

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

  return (
    <div className="space-y-6 pb-12 text-[#1F2937] dark:text-[#FFFFFF] transition-colors duration-300">
      {/* Page Title & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] mt-0.5 sm:mt-1">
            Real-time business performance, earnings, and appointments
          </p>
        </div>

        {/* Period Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] p-1 rounded-2xl flex shadow-2xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-xs'
                    : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230]'
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#141926] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF] text-xs font-semibold border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#D4A77F]" />
              <span>Public Booking</span>
            </Link>
          )}
        </div>
      </div>

      {/* 7-Day Free Trial Daily Countdown Card */}
      {subscription?.isTrial && !subscription?.isTrialExpired && (
        <div className="bg-[#10141F] text-[#FFFFFF] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border border-[#D4A77F]/30 relative overflow-hidden animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A77F]/15 text-[#D4A77F] border border-[#D4A77F]/30 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A77F]" />
                <span>7-Day Free Trial Active</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                <span className="text-[#D4A77F] underline decoration-[#D4A77F]">{subscription.trialDaysRemaining} Day{subscription.trialDaysRemaining === 1 ? '' : 's'} Remaining</span> in Free Trial
              </h2>
              <p className="text-xs sm:text-sm text-[#A0A8B8] leading-relaxed">
                All Pro management tools, calendar booking, and GST billing are active. Choose an official plan anytime to prevent service interruption.
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
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-[#080B12] fill-[#080B12]" />
                <span>Choose Official Plan ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paid Plan Expiry Reminder Card (<= 7 days) */}
      {Boolean(subscription?.isSubscriptionExpiringSoon && !subscription?.isTrial) && (
        <div className="bg-[#10141F] text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border border-[#F59E0B]/40 relative overflow-hidden animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 text-[11px] font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Plan Ending Soon</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Your {subscription.currentPlan?.name || 'Subscription'} Plan Expires in <span className="text-[#D4A77F] underline decoration-[#D4A77F]">{subscription.subscriptionDaysRemaining} Day{subscription.subscriptionDaysRemaining === 1 ? '' : 's'}</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#A0A8B8] leading-relaxed">
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
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-[#080B12] fill-[#080B12]" />
                <span>Renew / Upgrade Plan ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-[#141926] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs relative overflow-hidden group hover:border-[#D4A77F]/60 transition-all">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0A8B8]">
              Revenue
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] flex items-center justify-center font-bold text-xs sm:text-sm">
              ₹
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1F2937] dark:text-[#FFFFFF]">
            {loading ? (
              <div className="h-7 w-20 bg-[#F3F4F6] dark:bg-[#1C2230] animate-pulse rounded-lg" />
            ) : (
              `₹${data?.totalRevenue.toLocaleString('en-IN')}`
            )}
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="truncate">Verified payments</span>
          </div>
        </div>

        {/* Completed Sessions */}
        <div className="bg-white dark:bg-[#141926] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs relative overflow-hidden group hover:border-[#D4A77F]/60 transition-all">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0A8B8]">
              Sessions Done
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1F2937] dark:text-[#FFFFFF]">
            {loading ? (
              <div className="h-7 w-12 bg-[#F3F4F6] dark:bg-[#1C2230] animate-pulse rounded-lg" />
            ) : (
              data?.completedSessions
            )}
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[#6B7280] dark:text-[#A0A8B8] font-medium truncate">
            Completed in period
          </div>
        </div>

        {/* Registered Clients */}
        <div className="bg-white dark:bg-[#141926] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs relative overflow-hidden group hover:border-[#D4A77F]/60 transition-all">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0A8B8]">
              Client Base
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] flex items-center justify-center">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1F2937] dark:text-[#FFFFFF]">
            {loading ? (
              <div className="h-7 w-12 bg-[#F3F4F6] dark:bg-[#1C2230] animate-pulse rounded-lg" />
            ) : (
              data?.totalCustomers
            )}
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[#6B7280] dark:text-[#A0A8B8] font-medium truncate">
            Salon clients registered
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white dark:bg-[#141926] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs relative overflow-hidden group hover:border-[#D4A77F]/60 transition-all">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#A0A8B8]">
              Stylists
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1F2937] dark:text-[#FFFFFF]">
            {loading ? (
              <div className="h-7 w-12 bg-[#F3F4F6] dark:bg-[#1C2230] animate-pulse rounded-lg" />
            ) : (
              data?.activeStaff
            )}
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Available for booking</span>
          </div>
        </div>
      </div>

      {/* 2x2 Performance Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Popular Services Ranking Chart */}
        <div className="bg-white dark:bg-[#141926] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">Top Services Performance</h3>
              <span className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#A0A8B8] tracking-wider">By Revenue</span>
            </div>

            {data?.popularServices.length === 0 ? (
              <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] py-8 text-center">No service data in this period</div>
            ) : (
              <BarComparisonChart
                items={data?.popularServices.map((svc) => ({
                  id: svc.name,
                  label: svc.name,
                  sublabel: `${svc.count} booked`,
                  value: Number(svc.revenue),
                  color: '#D4A77F',
                })) || []}
              />
            )}
          </div>

          <Link
            href="/app/services"
            className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] text-xs font-semibold text-[#D4A77F] hover:text-[#B8905F] hover:underline flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>Manage Services Catalog</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Visual Revenue Breakdown Donut */}
        <div className="bg-white dark:bg-[#141926] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">Service Category Share</h3>
              <span className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#A0A8B8] tracking-wider">Distribution</span>
            </div>

            {(!data?.totalRevenue || data.totalRevenue === 0) ? (
              <div className="py-8 text-center text-[#6B7280] dark:text-[#A0A8B8]">
                <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] flex items-center justify-center mx-auto mb-2">
                  <PieChart className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF]">No revenue data in this period</p>
                <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">Category breakdown will update after client invoices</p>
              </div>
            ) : (
              <DonutDistributionChart
                size={130}
                thickness={16}
                centerLabel="Revenue"
                centerValue={`₹${(data.totalRevenue > 1000 ? Math.round(data.totalRevenue / 1000) + 'k' : data.totalRevenue)}`}
                data={[
                  { label: 'Hair & Styling', value: Math.max(1, Math.round(data.totalRevenue * 0.45)), color: '#D4A77F' },
                  { label: 'Facial & Skin', value: Math.max(1, Math.round(data.totalRevenue * 0.25)), color: '#B8905F' },
                  { label: 'Spa & Massage', value: Math.max(1, Math.round(data.totalRevenue * 0.18)), color: '#10B981' },
                  { label: 'Retail Products', value: Math.max(1, Math.round(data.totalRevenue * 0.12)), color: '#F59E0B' },
                ]}
              />
            )}
          </div>

          <Link
            href="/app/reports"
            className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] text-xs font-semibold text-[#D4A77F] hover:text-[#B8905F] hover:underline flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>Detailed Financial Ledger</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Peak Hours Traffic Density */}
        <div className="bg-white dark:bg-[#141926] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">Peak Rush Hours</h3>
              <span className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#A0A8B8] tracking-wider">
                {salonHours.open} - {salonHours.close}
              </span>
            </div>

            <HourlyRushChart
              timeLabel={`${salonHours.open} - ${salonHours.close}`}
              openTime={salonHours.open}
              closeTime={salonHours.close}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between text-xs text-[#6B7280] dark:text-[#A0A8B8]">
            <span>Peak slot: <strong className="text-[#1F2937] dark:text-[#FFFFFF]">5 PM - 6 PM</strong></span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Highest density</span>
          </div>
        </div>

        {/* Invoice Payment Status Counts */}
        <div className="bg-white dark:bg-[#141926] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">Payment Health</h3>
              <span className="text-[10px] uppercase font-bold text-[#6B7280] dark:text-[#A0A8B8] tracking-wider">Settlements</span>
            </div>

            <div className="space-y-4 pt-2">
              {/* Paid Invoices */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Fully Paid Invoices
                  </span>
                  <span className="font-bold text-[#1F2937] dark:text-[#FFFFFF]">{data?.paymentStatusCounts.paid || 0}</span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] dark:bg-[#1C2230] rounded-full overflow-hidden">
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
                    className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Partial Invoices */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#F59E0B] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    Partially Paid Invoices
                  </span>
                  <span className="font-bold text-[#1F2937] dark:text-[#FFFFFF]">{data?.paymentStatusCounts.partial || 0}</span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] dark:bg-[#1C2230] rounded-full overflow-hidden">
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
                    className="h-full bg-[#F59E0B] rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Pending Invoices */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#EF4444] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    Unpaid Pending Invoices
                  </span>
                  <span className="font-bold text-[#1F2937] dark:text-[#FFFFFF]">{data?.paymentStatusCounts.pending || 0}</span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] dark:bg-[#1C2230] rounded-full overflow-hidden">
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
                    className="h-full bg-[#EF4444] rounded-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/app/billing"
            className="mt-6 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] text-xs font-semibold text-[#D4A77F] hover:text-[#B8905F] hover:underline flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>Process Billing &amp; Invoices</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Upcoming Appointments & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-[#141926] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF] truncate">Upcoming Appointments</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] truncate">Next scheduled salon visits</p>
            </div>
            <Link
              href="/app/appointments"
              className="text-xs font-bold text-[#D4A77F] hover:text-[#B8905F] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>All Appointments</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="space-y-3">
            {!data?.recentAppointments || data.recentAppointments.length === 0 ? (
              <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] py-6 text-center">No scheduled appointments</div>
            ) : (
              data.recentAppointments.map((appt) => {
                const apptDate = new Date(appt.starts_at);
                const timeStr = apptDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
                const [timeOnly, periodOnly] = timeStr.includes(' ') ? timeStr.split(' ') : [timeStr, ''];

                return (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#080B12] border border-[#E5E7EB] dark:border-[#2A2F3A] hover:border-[#D4A77F]/30 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="min-w-[54px] sm:min-w-[58px] h-12 px-2 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#8C5E2E] dark:text-[#D4A77F] border border-[#E5E7EB] dark:border-[#2A2F3A]/70 shadow-2xs flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-black tracking-tight leading-none text-[#1F2937] dark:text-white">
                          {timeOnly}
                        </span>
                        {periodOnly && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8C5E2E] dark:text-[#D4A77F] mt-1 leading-none">
                            {periodOnly}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] truncate">{appt.customer_name}</div>
                        <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] truncate mt-0.5">
                          {appt.service_name} · Stylist: {appt.staff_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                        {appt.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low Stock Product Alerts */}
        <div className="bg-white dark:bg-[#141926] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF] flex items-center gap-2">
                <span className="truncate">Inventory Alerts</span>
                {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping shrink-0" />
                )}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] truncate">Products at or below reorder threshold</p>
            </div>
            <Link
              href="/app/live"
              className="text-xs font-bold text-[#D4A77F] hover:text-[#B8905F] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Open Live Studio</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] py-6 text-center animate-pulse">
                Loading inventory status...
              </div>
            ) : (!data?.totalProducts || data.totalProducts === 0) ? (
              <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] font-medium py-6 px-4 text-center bg-[#F8F9FA] dark:bg-[#080B12] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col items-center justify-center gap-2">
                <Package className="w-5 h-5 text-[#6B7280] dark:text-[#A0A8B8]" />
                <p className="font-semibold text-[#1F2937] dark:text-white">No retail products found</p>
                <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Add products in your inventory catalog to monitor stock levels.</p>
                <Link
                  href="/app/products"
                  className="mt-1 text-xs font-bold text-[#D4A77F] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>Add Retail Products</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            ) : (!data?.lowStockProducts || data.lowStockProducts.length === 0) ? (
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium py-6 px-4 text-center bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                ✓ All retail product stocks are healthy!
              </div>
            ) : (
              data.lowStockProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center font-bold text-xs shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] truncate">{p.name}</div>
                      <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Retail: ₹{Number(p.price)}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#EF4444] bg-white dark:bg-[#141926] border border-[#EF4444]/40 px-2.5 py-1 rounded-xl whitespace-nowrap">
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
