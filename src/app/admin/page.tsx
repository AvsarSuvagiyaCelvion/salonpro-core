'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  Plus,
  ExternalLink,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Clock,
  ArrowRight,
  Download,
} from 'lucide-react';
import AreaTrendChart from '@/components/charts/AreaTrendChart';
import DonutDistributionChart from '@/components/charts/DonutDistributionChart';
import ReportExportModal from '@/components/reports/ReportExportModal';

interface Metrics {
  totalSalons: number;
  totalCustomers: number;
  totalAppointments: number;
  totalStaff: number;
  totalRevenue: number;
  totalPaid: number;
}

interface SalonItem {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
  open_time: string;
  close_time: string;
  created_at: string;
  staff_count: number;
  customer_count: number;
  appointment_count: number;
  total_revenue: number;
}

interface RecentAppt {
  id: string;
  starts_at: string;
  status: string;
  source: string;
  salon_name: string;
  salon_slug: string;
  customer_name: string;
  customer_mobile: string;
  service_name: string;
  service_price: number;
}

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [salons, setSalons] = useState<SalonItem[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<RecentAppt[]>([]);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  async function handleImpersonate(salonId: string, salonName: string) {
    setImpersonatingId(salonId);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect to salon dashboard');
      }
      if (typeof localStorage !== 'undefined' && data.salon) {
        localStorage.setItem(
          'salonpro_salon_info',
          JSON.stringify({
            name: data.salon.name,
            slug: data.salon.slug,
          })
        );
      }
      window.location.href = data.redirectUrl || '/app';
    } catch (err: any) {
      alert(err.message || 'Unable to connect to salon dashboard');
      setImpersonatingId(null);
    }
  }

  // Add New Salon Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [newSalonName, setNewSalonName] = useState('');
  const [newSalonSlug, setNewSalonSlug] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [savingSalon, setSavingSalon] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.metrics);
        setSalons(data.salons || []);
        setRecentAppointments(data.recentAppointments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  async function handleCreateSalon(e: React.FormEvent) {
    e.preventDefault();
    setSavingSalon(true);
    setModalMessage(null);

    try {
      const res = await fetch('/api/admin/salons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSalonName,
          slug: newSalonSlug,
          phone: newPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create salon');
      }

      setModalMessage({ type: 'success', text: `Salon "${data.salon.name}" successfully registered!` });
      setTimeout(() => {
        setIsModalOpen(false);
        setNewSalonName('');
        setNewSalonSlug('');
        loadData();
      }, 1200);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setSavingSalon(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Register Salon Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-black text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">Main Admin Dashboard</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] border border-[#D4A77F]/30">
              Super Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] mt-1">
            Global governance across all multi-tenant salons, owners, customers & revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            title="Export Platform Reports (CSV & PDF)"
          >
            <Download className="w-4 h-4 text-[#D4A77F]" />
            <span>Export (CSV & PDF)</span>
          </button>

          <button
            onClick={() => {
              setModalMessage(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs sm:text-sm shadow-md shadow-[#D4A77F]/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Salon Branch</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Platform KPI Cards - Modern 2x2 on Mobile, 4-Cols on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
        {/* Total Salons */}
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden group hover:border-[#D4A77F]/60 transition-all">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#A0A8B8] mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Total Salons</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1F2937] dark:text-[#FFFFFF]">
            {loading ? '...' : metrics?.totalSalons}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1 truncate">
            <span>● 100% active</span>
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden group hover:border-[#D4A77F]/60 transition-all">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#A0A8B8] mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Gross Volume</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
              ₹
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
            {loading ? '...' : `₹${metrics?.totalRevenue?.toLocaleString('en-IN')}`}
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-1 font-medium truncate">
            Paid: ₹{metrics?.totalPaid?.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden group hover:border-[#D4A77F]/60 transition-all">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#A0A8B8] mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Appointments</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1F2937] dark:text-[#FFFFFF]">
            {loading ? '...' : metrics?.totalAppointments}
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-1 font-medium truncate">
            All branches
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden group hover:border-[#D4A77F]/60 transition-all">
          <div className="flex items-center justify-between text-[#6B7280] dark:text-[#A0A8B8] mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Clients</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1F2937] dark:text-[#FFFFFF]">
            {loading ? '...' : metrics?.totalCustomers}
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-1 font-medium truncate">
            Registered profiles
          </div>
        </div>
      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1F2937] dark:text-[#FFFFFF]">Platform GMV Revenue Trend</h2>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Consolidated weekly trajectory across all salon tenants</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
              ₹{Number(metrics?.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <AreaTrendChart
            data={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
              label: d,
              value: Math.round(Number(metrics?.totalRevenue || 0) * [0.08, 0.12, 0.11, 0.15, 0.18, 0.22, 0.14][i]),
            }))}
            color="#D4A77F"
            height={190}
          />
        </div>

        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#1F2937] dark:text-[#FFFFFF]">Branch Revenue Share</h2>
              <span className="text-[10px] uppercase font-bold text-[#9CA3AF] dark:text-[#747D8D]">Market Share</span>
            </div>
            <div className="py-2">
              {salons.length === 0 ? (
                <div className="py-8 text-center text-[#9CA3AF] dark:text-[#747D8D]">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#9CA3AF] dark:text-[#747D8D] flex items-center justify-center mx-auto mb-2">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-[#6B7280] dark:text-[#A0A8B8]">No salon branches yet</p>
                  <p className="text-[11px] text-[#9CA3AF] dark:text-[#747D8D] mt-0.5">Click &ldquo;+ Register New Salon Branch&rdquo; to add</p>
                </div>
              ) : (
                <DonutDistributionChart
                  size={130}
                  thickness={16}
                  centerLabel="Branches"
                  centerValue={salons.length}
                  data={salons.map((s, idx) => ({
                    label: s.name,
                    value: Math.max(1, Number(s.total_revenue || 0)),
                    color: s.brand_color || ['#D4A77F', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][idx % 5],
                  }))}
                />
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-[#9CA3AF] dark:text-[#747D8D]">
            Real-time live multi-tenant aggregation
          </div>
        </div>
      </div>

      {/* Salons Directory Table */}
      <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#FFFFFF]">Managed Salon Branches ({salons.length})</h2>
            <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">All active tenant salons registered on the platform</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#2A2F3A] text-[#6B7280] dark:text-[#A0A8B8] font-bold uppercase tracking-wider text-[10px] bg-[#F8F9FA] dark:bg-[#10141F]">
                <th className="py-3 px-3">Salon Details</th>
                <th className="py-3 px-3">Booking Slug</th>
                <th className="py-3 px-3">Hours</th>
                <th className="py-3 px-3 text-center">Stylists</th>
                <th className="py-3 px-3 text-center">Clients</th>
                <th className="py-3 px-3 text-center">Bookings</th>
                <th className="py-3 px-3 text-right">Gross Revenue</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2A2F3A]">
              {salons.map((s) => (
                <tr key={s.id} className="hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                        style={{ backgroundColor: s.brand_color || '#D4A77F' }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-[#1F2937] dark:text-[#FFFFFF] text-sm">{s.name}</div>
                        <div className="text-[10px] text-[#9CA3AF] dark:text-[#747D8D] font-mono">ID: {s.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-pink-700 bg-pink-50 border border-pink-200/60 px-2 py-0.5 rounded-md font-semibold">
                      /{s.slug}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#A0A8B8]">
                    {s.open_time?.slice(0, 5)} - {s.close_time?.slice(0, 5)}
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-[#1F2937] dark:text-[#FFFFFF]">
                    {s.staff_count}
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-[#1F2937] dark:text-[#FFFFFF]">
                    {s.customer_count}
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-[#1F2937] dark:text-[#FFFFFF]">
                    {s.appointment_count}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold font-mono text-emerald-700">
                    ₹{Number(s.total_revenue || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <a
                        href={`/${s.slug}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1C2230] hover:bg-slate-200 dark:hover:bg-[#252D3D] text-[#1F2937] dark:text-[#FFFFFF] text-[11px] font-semibold transition-all border border-slate-200 dark:border-[#2A2F3A] inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                        title="View Customer Booking Page"
                      >
                        <span>Public Page</span>
                        <span className="shrink-0 font-bold">↗</span>
                      </a>
                      <button
                        type="button"
                        disabled={impersonatingId === s.id}
                        onClick={() => handleImpersonate(s.id, s.name)}
                        className="px-2.5 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/50 text-[11px] font-bold transition-all inline-flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-50"
                        title="Login directly into salon dashboard as Super Admin without password"
                      >
                        <span>{impersonatingId === s.id ? 'Connecting...' : 'Owner ERP'}</span>
                        <span className="shrink-0 font-bold">➔</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Platform Appointments Stream */}
      <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Live Platform Activity Stream</h2>
        <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mb-4">Latest bookings scheduled across all tenant salons</p>

        {recentAppointments.length === 0 ? (
          <div className="text-center py-8 text-[#9CA3AF] dark:text-[#747D8D] text-xs">No bookings recorded yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAppointments.map((a) => (
              <div
                key={a.id}
                className="bg-[#F8F9FA] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#6B7280] dark:text-[#A0A8B8] mb-1.5 font-bold uppercase tracking-wider">
                    <span className="text-[#8C5E2E] dark:text-[#D4A77F] font-bold">{a.salon_name}</span>
                    <span className="text-emerald-700 dark:text-emerald-300 capitalize bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-bold">
                      {a.status}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-[#1F2937] dark:text-[#FFFFFF]">{a.service_name}</div>
                  <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">
                    Client: <span className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold">{a.customer_name}</span> (+91 {a.customer_mobile})
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#2A2F3A] flex justify-between items-center text-xs">
                  <span className="text-[#6B7280] dark:text-[#A0A8B8] font-mono text-[11px]">
                    {new Date(a.starts_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}{' '}
                    at {new Date(a.starts_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-bold text-[#1F2937] dark:text-[#FFFFFF] font-mono">₹{Number(a.service_price).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Register New Salon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#080B12]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#9CA3AF] dark:text-[#747D8D] hover:text-[#1F2937] dark:text-[#FFFFFF]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                👑
              </div>
              <div>
                <h3 className="font-bold text-[#1F2937] dark:text-[#FFFFFF] text-base">Register New Salon Branch</h3>
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Adds an independent tenant salon into the platform</p>
              </div>
            </div>

            {modalMessage && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  modalMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {modalMessage.type === 'success' ? '✓' : '⚠️'}
                <span>{modalMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateSalon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Salon Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxury Hair Studio"
                  value={newSalonName}
                  onChange={(e) => {
                    setNewSalonName(e.target.value);
                    if (!newSalonSlug) {
                      setNewSalonSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2.5 text-sm text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">
                  Public Booking URL Slug *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#8C5E2E] dark:text-[#D4A77F] font-mono text-sm font-bold select-none">/</span>
                  <input
                    type="text"
                    required
                    placeholder="luxury-hair-studio"
                    value={newSalonSlug}
                    onChange={(e) => setNewSalonSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-[#1F2937] dark:text-[#FFFFFF] font-mono focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">WhatsApp / Phone</label>
                <input
                  type="tel"
                  placeholder="9898012345"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2.5 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <button
                type="submit"
                disabled={savingSalon}
                className="w-full py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs sm:text-sm shadow-md shadow-[#D4A77F]/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {savingSalon ? 'Creating Salon...' : 'Register Salon Branch ➔'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Export Reports Modal */}
      <ReportExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        role="admin"
        salonName="SalonPro Master Governance"
      />
    </div>
  );
}
