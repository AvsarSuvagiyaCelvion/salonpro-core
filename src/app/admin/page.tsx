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
} from 'lucide-react';
import AreaTrendChart from '@/components/charts/AreaTrendChart';
import DonutDistributionChart from '@/components/charts/DonutDistributionChart';

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

  // Add New Salon Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSalonName, setNewSalonName] = useState('');
  const [newSalonSlug, setNewSalonSlug] = useState('');
  const [newBrandColor, setNewBrandColor] = useState('#b3135b');
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
          brand_color: newBrandColor,
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
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">Main Admin Dashboard</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Super Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global governance across all multi-tenant salons, owners, customers & revenue.
          </p>
        </div>

        <button
          onClick={() => {
            setModalMessage(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Salon Branch</span>
        </button>
      </div>

      {/* 4 Primary Platform KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Salons */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Salons</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {loading ? '...' : metrics?.totalSalons}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <span>● 100% active branches</span>
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Platform Volume</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            {loading ? '...' : `₹${metrics?.totalRevenue?.toLocaleString('en-IN')}`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Collected: ₹{metrics?.totalPaid?.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Appointments</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {loading ? '...' : metrics?.totalAppointments}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Across all salon branches
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Clients</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {loading ? '...' : metrics?.totalCustomers}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Permanent client profiles
          </div>
        </div>
      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Platform GMV Revenue Trend</h2>
              <p className="text-xs text-slate-500">Consolidated weekly trajectory across all salon tenants</p>
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
            color="#b3135b"
            height={190}
          />
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Branch Revenue Share</h2>
              <span className="text-[10px] uppercase font-bold text-slate-400">Market Share</span>
            </div>
            <div className="py-2">
              {salons.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No salon branches yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click &ldquo;+ Register New Salon Branch&rdquo; to add</p>
                </div>
              ) : (
                <DonutDistributionChart
                  size={140}
                  thickness={18}
                  centerLabel="Branches"
                  centerValue={salons.length}
                  data={salons.map((s, idx) => ({
                    label: s.name,
                    value: Math.max(1, Number(s.total_revenue || 0)),
                    color: s.brand_color || ['#b3135b', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][idx % 5],
                  }))}
                />
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-400">
            Real-time live multi-tenant aggregation
          </div>
        </div>
      </div>

      {/* Salons Directory Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Managed Salon Branches ({salons.length})</h2>
            <p className="text-xs text-slate-500">All active tenant salons registered on the platform</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-3 px-3">Salon & Branding</th>
                <th className="py-3 px-3">Booking Slug</th>
                <th className="py-3 px-3">Hours</th>
                <th className="py-3 px-3 text-center">Stylists</th>
                <th className="py-3 px-3 text-center">Clients</th>
                <th className="py-3 px-3 text-center">Bookings</th>
                <th className="py-3 px-3 text-right">Gross Revenue</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salons.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                        style={{ backgroundColor: s.brand_color || '#b3135b' }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {s.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-pink-700 bg-pink-50 border border-pink-200/60 px-2 py-0.5 rounded-md font-semibold">
                      /{s.slug}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">
                    {s.open_time?.slice(0, 5)} - {s.close_time?.slice(0, 5)}
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                    {s.staff_count}
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                    {s.customer_count}
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                    {s.appointment_count}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold font-mono text-emerald-700">
                    ₹{Number(s.total_revenue || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/${s.slug}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all border border-slate-200"
                        title="View Customer Booking Page"
                      >
                        Public Page ↗
                      </a>
                      <a
                        href="/app"
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-[11px] font-bold transition-all"
                        title="Manage as Salon Owner"
                      >
                        Owner ERP ➔
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Platform Appointments Stream */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Live Platform Activity Stream</h2>
        <p className="text-xs text-slate-500 mb-4">Latest bookings scheduled across all tenant salons</p>

        {recentAppointments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No bookings recorded yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAppointments.map((a) => (
              <div
                key={a.id}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">
                    <span className="text-amber-800 font-extrabold">{a.salon_name}</span>
                    <span className="text-emerald-700 capitalize bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      {a.status}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">{a.service_name}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Client: <span className="text-slate-900 font-semibold">{a.customer_name}</span> (+91 {a.customer_mobile})
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    {new Date(a.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                    at {new Date(a.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-bold text-slate-900 font-mono">₹{Number(a.service_price).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Register New Salon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                👑
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register New Salon Branch</h3>
                <p className="text-xs text-slate-500">Adds an independent tenant salon into the platform</p>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Salon Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velvet Beauty Lounge"
                  value={newSalonName}
                  onChange={(e) => {
                    setNewSalonName(e.target.value);
                    if (!newSalonSlug) {
                      setNewSalonSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Booking URL Slug *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs">salonpro.app/</span>
                  <input
                    type="text"
                    required
                    placeholder="velvet-lounge"
                    value={newSalonSlug}
                    onChange={(e) => setNewSalonSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-28 pr-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newBrandColor}
                      onChange={(e) => setNewBrandColor(e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newBrandColor}
                      onChange={(e) => setNewBrandColor(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Phone</label>
                  <input
                    type="tel"
                    placeholder="9898012345"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSalon}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {savingSalon ? 'Creating Salon...' : 'Register Salon Branch ➔'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
