'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  CreditCard,
  Percent,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Printer,
  Download,
} from 'lucide-react';
import DonutDistributionChart from '@/components/charts/DonutDistributionChart';
import BarComparisonChart from '@/components/charts/BarComparisonChart';
import ReportExportModal from '@/components/reports/ReportExportModal';

interface PaymentMethodStat {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

interface StaffReportItem {
  id: string;
  name: string;
  roleTitle: string | null;
  sessions: number;
  servicesRevenue: number;
  productsRevenue: number;
  totalRevenue: number;
  serviceCommissionPct: number;
  productCommissionPct: number;
  commissionEarned: number;
}

interface ReportsData {
  period: string;
  overview: {
    totalRevenue: number;
    totalSessions: number;
    avgSessionValue: number;
    paymentMethods: PaymentMethodStat[];
    paymentStatuses: {
      paid: { count: number; amount: number };
      partial: { count: number; amount: number };
      pending: { count: number; amount: number };
    };
  };
  staffReport: StaffReportItem[];
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff'>('overview');
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportsData | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Global commission adjustment inputs for simulator
  const [globalServiceCommPct, setGlobalServiceCommPct] = useState<number>(10);
  const [globalProductCommPct, setGlobalProductCommPct] = useState<number>(5);
  const [useCustomCommissionRates, setUseCustomCommissionRates] = useState<boolean>(false);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports?period=${period}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [period]);

  // Method color helper
  function getMethodColor(method: string) {
    const m = method.toLowerCase();
    if (m === 'cash') return 'bg-emerald-500';
    if (m === 'upi') return 'bg-purple-500';
    if (m === 'card') return 'bg-blue-500';
    return 'bg-amber-500';
  }

  // Calculate reactive staff commission rows
  const staffRows = (data?.staffReport || []).map((st) => {
    const svcPct = useCustomCommissionRates
      ? globalServiceCommPct
      : st.serviceCommissionPct || 10;
    const prodPct = useCustomCommissionRates
      ? globalProductCommPct
      : st.productCommissionPct || 5;

    const commission =
      (st.servicesRevenue * svcPct) / 100 + (st.productsRevenue * prodPct) / 100;

    return {
      ...st,
      activeServicePct: svcPct,
      activeProductPct: prodPct,
      calculatedCommission: Math.round(commission),
    };
  });

  const totalStaffCommissionPayout = staffRows.reduce(
    (sum, st) => sum + st.calculatedCommission,
    0
  );
  const totalStaffRevenue = staffRows.reduce((sum, st) => sum + st.totalRevenue, 0);
  const totalStaffSessions = staffRows.reduce((sum, st) => sum + st.sessions, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Financial revenue, payment methods breakdown, and staff commission calculations
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1 sm:pb-0">
          <div className="bg-white dark:bg-[#141926] border border-neutral-200 dark:border-[#2A2F3A] p-1 rounded-2xl flex shadow-sm shrink-0">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  period === p.id
                    ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#1C2230]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-semibold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
            title="Export CSV and PDF Reports"
          >
            <Download className="w-3.5 h-3.5 text-[#080B12]" />
            <span>Export Reports</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-2xl bg-white dark:bg-[#141926] border border-neutral-200 dark:border-[#2A2F3A] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white shadow-sm print:hidden shrink-0 cursor-pointer"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-neutral-200 dark:border-[#2A2F3A] overflow-x-auto no-scrollbar gap-1 sm:gap-2 pb-px touch-scroll">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 sm:pb-3 px-3 sm:px-6 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#D4A77F] text-[#D4A77F]'
              : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Overview & Revenue</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-2.5 sm:pb-3 px-3 sm:px-6 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'staff'
              ? 'border-[#D4A77F] text-[#D4A77F]'
              : 'border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Staff Performance & Commission</span>
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
                Total Revenue
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white mt-2">
                {loading ? '...' : `₹${data?.overview.totalRevenue.toLocaleString('en-IN')}`}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Settled client payments in period
              </p>
            </div>

            <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
                Completed Sessions
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white mt-2">
                {loading ? '...' : data?.overview.totalSessions}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-[#A0A8B8] font-medium mt-1">
                Fulfilled appointments & walk-ins
              </p>
            </div>

            <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
                Average Session Value
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white mt-2">
                {loading ? '...' : `₹${data?.overview.avgSessionValue.toLocaleString('en-IN')}`}
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
                Average ticket size per client visit
              </p>
            </div>
          </div>

          {/* Revenue by Payment Method */}
          <div className="bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-[#1F2937] dark:text-white">Revenue by Payment Method</h3>
                <p className="text-xs text-neutral-500 dark:text-[#A0A8B8]">Collections distribution across digital and cash modes</p>
              </div>
            </div>

            {/* Visual Donut Chart */}
            <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-[#10141F] border border-neutral-100 dark:border-[#2A2F3A] mb-6">
              <DonutDistributionChart
                size={160}
                thickness={22}
                centerLabel="Total Settled"
                centerValue={`₹${(data?.overview.totalRevenue || 0).toLocaleString('en-IN')}`}
                data={(data?.overview.paymentMethods || []).map((pm) => ({
                  label: pm.method.toUpperCase(),
                  value: pm.amount,
                  color:
                    pm.method.toLowerCase() === 'upi'
                      ? '#8b5cf6'
                      : pm.method.toLowerCase() === 'cash'
                      ? '#10b981'
                      : pm.method.toLowerCase() === 'card'
                      ? '#3b82f6'
                      : '#f59e0b',
                }))}
              />
            </div>

            {/* Methods Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.overview.paymentMethods.map((pm, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#10141F] border border-neutral-200/60 dark:border-[#2A2F3A]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${getMethodColor(pm.method)}`} />
                    <span className="font-bold uppercase text-xs text-neutral-700 dark:text-neutral-300">{pm.method}</span>
                  </div>
                  <div className="text-xl font-extrabold text-[#1F2937] dark:text-white">
                    ₹{pm.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-[#A0A8B8] mt-1">
                    <span>{pm.count} txns</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{pm.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm">
            <h3 className="font-bold text-base text-[#1F2937] dark:text-white mb-4">Invoice Status Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Paid Invoices</div>
                <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">
                  {data?.overview.paymentStatuses.paid.count}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Value: ₹{(data?.overview.paymentStatuses.paid.amount || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Partial Invoices</div>
                <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100 mt-1">
                  {data?.overview.paymentStatuses.partial.count}
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Value: ₹{(data?.overview.paymentStatuses.partial.amount || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/40">
                <div className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Pending Invoices</div>
                <div className="text-2xl font-extrabold text-rose-900 dark:text-rose-100 mt-1">
                  {data?.overview.paymentStatuses.pending.count}
                </div>
                <div className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  Value: ₹{(data?.overview.paymentStatuses.pending.amount || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: STAFF PERFORMANCE & COMMISSION ================= */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Commission Simulator Bar */}
          <div className="bg-gradient-to-r from-[#1F2937] to-[#40122a] text-white p-6 rounded-3xl shadow-md border border-neutral-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400">
                  Interactive Simulator
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">Commission Calculation Controls</h3>
                <p className="text-xs text-neutral-300 mt-1">
                  Adjust commission rates below to simulate staff payouts in real-time
                </p>
              </div>

              {/* Commission inputs */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-2xl border border-white/10">
                  <label className="text-xs font-medium text-neutral-200">Service Commission:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={globalServiceCommPct}
                      onChange={(e) => {
                        setGlobalServiceCommPct(Number(e.target.value));
                        setUseCustomCommissionRates(true);
                      }}
                      className="w-14 bg-black/40 border border-white/20 rounded-xl px-2 py-1 text-center font-bold text-sm text-white focus:outline-none focus:border-pink-400"
                    />
                    <span className="text-xs font-bold text-pink-400">%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-2xl border border-white/10">
                  <label className="text-xs font-medium text-neutral-200">Product Commission:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={globalProductCommPct}
                      onChange={(e) => {
                        setGlobalProductCommPct(Number(e.target.value));
                        setUseCustomCommissionRates(true);
                      }}
                      className="w-14 bg-black/40 border border-white/20 rounded-xl px-2 py-1 text-center font-bold text-sm text-white focus:outline-none focus:border-pink-400"
                    />
                    <span className="text-xs font-bold text-pink-400">%</span>
                  </div>
                </div>

                {useCustomCommissionRates && (
                  <button
                    onClick={() => setUseCustomCommissionRates(false)}
                    className="text-xs font-bold text-pink-300 hover:text-white underline"
                  >
                    Reset to Staff Profiles
                  </button>
                )}
              </div>
            </div>

            {/* Total Payout Preview */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap justify-between items-center text-xs">
              <span className="text-neutral-300">
                Total Stylist Commission Liability for Period:
              </span>
              <span className="text-lg font-extrabold text-pink-300">
                ₹{totalStaffCommissionPayout.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Visual Staff Revenue Ranking Chart */}
          <div className="bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm">
            <h4 className="font-extrabold text-base text-[#1F2937] dark:text-white mb-1">
              Stylist Revenue Contribution Ranking
            </h4>
            <p className="text-xs text-neutral-500 dark:text-[#A0A8B8] mb-4">
              Visual comparison of total sales (services + retail) generated by each staff member
            </p>
            {staffRows.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">No staff activity recorded in this period</div>
            ) : (
              <BarComparisonChart
                items={staffRows.map((st) => ({
                  id: st.id,
                  label: st.name,
                  sublabel: `${st.sessions} treatments`,
                  value: st.totalRevenue,
                  color: '#D4A77F',
                }))}
              />
            )}
          </div>

          {/* Staff Performance Table */}
          <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-[#10141F] border-b border-neutral-200 dark:border-[#2A2F3A] text-neutral-500 dark:text-[#A0A8B8] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-4 px-6">Stylist</th>
                    <th className="py-4 px-4 text-center">Sessions</th>
                    <th className="py-4 px-4 text-right">Services Rev</th>
                    <th className="py-4 px-4 text-right">Products Rev</th>
                    <th className="py-4 px-4 text-right">Total Billed</th>
                    <th className="py-4 px-4 text-center">Rates (Svc / Prod)</th>
                    <th className="py-4 px-6 text-right">Commission Earned</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 dark:divide-[#2A2F3A]">
                  {staffRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-400 dark:text-neutral-500">
                        No staff activity recorded in this period
                      </td>
                    </tr>
                  ) : (
                    staffRows.map((st) => (
                      <tr key={st.id} className="hover:bg-neutral-50/60 dark:hover:bg-[#1C2230]/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#D4A77F]/10 text-[#D4A77F] font-bold flex items-center justify-center">
                              {st.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-[#1F2937] dark:text-white text-sm">{st.name}</div>
                              <div className="text-[10px] text-neutral-400 dark:text-[#A0A8B8]">{st.roleTitle || 'Stylist'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center font-bold text-neutral-700 dark:text-neutral-300">
                          {st.sessions}
                        </td>

                        <td className="py-4 px-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
                          ₹{st.servicesRevenue.toLocaleString('en-IN')}
                        </td>

                        <td className="py-4 px-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
                          ₹{st.productsRevenue.toLocaleString('en-IN')}
                        </td>

                        <td className="py-4 px-4 text-right font-bold text-[#1F2937] dark:text-white">
                          ₹{st.totalRevenue.toLocaleString('en-IN')}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-2 py-1 rounded-lg bg-neutral-100 dark:bg-[#1C2230] font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                            {st.activeServicePct}% / {st.activeProductPct}%
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <span className="font-extrabold text-sm text-[#8C5E2E] dark:text-[#D4A77F] bg-[#D4A77F]/10 px-2.5 py-1 rounded-xl border border-[#D4A77F]/30">
                            ₹{st.calculatedCommission.toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Table Footer Totals */}
                {staffRows.length > 0 && (
                  <tfoot className="bg-neutral-50/80 dark:bg-[#10141F] border-t-2 border-neutral-300 dark:border-[#2A2F3A] font-bold text-[#1F2937] dark:text-white">
                    <tr>
                      <td className="py-4 px-6">Totals</td>
                      <td className="py-4 px-4 text-center">{totalStaffSessions}</td>
                      <td className="py-4 px-4 text-right">
                        ₹{staffRows.reduce((sum, s) => sum + s.servicesRevenue, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        ₹{staffRows.reduce((sum, s) => sum + s.productsRevenue, 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        ₹{totalStaffRevenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-center text-neutral-400 dark:text-neutral-500">-</td>
                      <td className="py-4 px-6 text-right text-base text-[#D4A77F]">
                        ₹{totalStaffCommissionPayout.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Export Reports Modal */}
      <ReportExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        role="owner"
        salonName="Salon Business Intelligence"
      />
    </div>
  );
}
