'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  ExternalLink,
  Calendar,
  Users,
  Scissors,
  Search,
  Phone,
  Power,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Mail,
  IndianRupee,
  Send,
  Bell,
  MessageSquare,
  Sparkles,
  CreditCard,
  Edit2,
  Clock,
  X,
} from 'lucide-react';

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add New Salon Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Platform Super Admin Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('Monthly Platform Subscription Notice');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Dear Salon Partner, this is a reminder regarding your active SalonPro Cloud subscription. Please ensure timely renewal to continue uninterrupted online bookings and billing services.'
  );
  const [broadcastType, setBroadcastType] = useState<'payment' | 'update' | 'notice'>('payment');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [newSalonName, setNewSalonName] = useState('');
  const [newSalonSlug, setNewSalonSlug] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [savingSalon, setSavingSalon] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Available Plans list for selector
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  // Edit Salon Subscription & Expiry Modal
  const [editingSalonSub, setEditingSalonSub] = useState<any | null>(null);
  const [subPlanId, setSubPlanId] = useState('');
  const [subStatus, setSubStatus] = useState('trial');
  const [subEndsAt, setSubEndsAt] = useState('');
  const [customDomainVerified, setCustomDomainVerified] = useState(false);
  const [savingSub, setSavingSub] = useState(false);

  async function fetchSalons() {
    try {
      setLoading(true);
      const [salonsRes, plansRes] = await Promise.all([
        fetch('/api/admin/salons'),
        fetch('/api/admin/plans'),
      ]);
      const data = await salonsRes.json();
      if (salonsRes.ok) {
        setSalons(data.salons || []);
      }
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setAvailablePlans(plansData.plans || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenEditSub(salon: any) {
    setEditingSalonSub(salon);
    setSubPlanId(salon.subscription_plan_id || '');
    setSubStatus(salon.subscription_status || 'trial');
    setSubEndsAt(salon.subscription_ends_at ? salon.subscription_ends_at.slice(0, 10) : '');
    setCustomDomainVerified(Boolean(salon.custom_domain_verified));
  }

  async function handleSaveSub(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSalonSub) return;
    setSavingSub(true);
    try {
      const res = await fetch(`/api/admin/salons/${editingSalonSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_plan_id: subPlanId || null,
          subscription_status: subStatus,
          subscription_ends_at: subEndsAt ? new Date(subEndsAt).toISOString() : null,
          custom_domain_verified: customDomainVerified,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update plan & expiry');
      setEditingSalonSub(null);
      await fetchSalons();
    } catch (err: any) {
      alert(`Error updating subscription: ${err.message}`);
    } finally {
      setSavingSub(false);
    }
  }

  useEffect(() => {
    fetchSalons();
  }, []);

  useEffect(() => {
    if (isModalOpen || isBroadcastModalOpen || Boolean(editingSalonSub)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isBroadcastModalOpen, editingSalonSub]);

  async function handleToggleStatus(salonId: string, currentStatus: boolean, salonName: string) {
    const action = currentStatus ? 'SUSPEND' : 'REACTIVATE';
    const msg = currentStatus
      ? `Are you sure you want to SUSPEND "${salonName}"?\n\nTheir salon owner login and public customer booking page will be immediately blocked.`
      : `Reactivate "${salonName}"? Their workspace and online bookings will be restored.`;

    if (!window.confirm(msg)) return;

    try {
      setUpdatingId(salonId);
      const res = await fetch(`/api/admin/salons/${salonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update salon status');
      }

      await fetchSalons();
    } catch (err: any) {
      alert(`Error updating salon: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleExtendTrial(salonId: string, days: number, salonName: string) {
    if (!window.confirm(`Extend 7-day free trial for "${salonName}" by +${days} days?`)) return;
    try {
      setUpdatingId(salonId);
      const res = await fetch(`/api/admin/salons/${salonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend_trial_days: days }),
      });
      if (res.ok) {
        await fetchSalons();
      } else {
        alert('Failed to extend trial');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleGrantActive(salonId: string, salonName: string) {
    if (!window.confirm(`Mark "${salonName}" as an Active Paid Subscriber?`)) return;
    try {
      setUpdatingId(salonId);
      const res = await fetch(`/api/admin/salons/${salonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_status: 'active' }),
      });
      if (res.ok) {
        await fetchSalons();
      } else {
        alert('Failed to activate subscription');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

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
        setNewPhone('');
        fetchSalons();
      }, 1200);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setSavingSalon(false);
    }
  }

  const filtered = salons.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase()) ||
    (s.owner_email && s.owner_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">Tenant Workspaces & Subdomains</h1>
          <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">Super Admin control center: manage subscriptions, subdomains, and suspend/activate tenants</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#9CA3AF] dark:text-[#747D8D] absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search salon, slug, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl pl-10 pr-4 py-2 text-xs text-[#1F2937] dark:text-[#FFFFFF] placeholder-slate-400 focus:outline-none focus:border-[#D4A77F] shadow-xs"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setBroadcastSuccess(false);
                setIsBroadcastModalOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalMessage(null);
                setIsModalOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-[#D4A77F]/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Salon</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State when 0 salons registered */}
      {salons.length === 0 && !loading && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🏢
          </div>
          <h3 className="text-lg font-black text-[#1F2937] dark:text-[#FFFFFF]">0 Salons Registered</h3>
          <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1.5 mb-6 leading-relaxed">
            No salon tenants have registered yet. Register your first salon tenant below to test subdomain routing!
          </p>
          <button
            type="button"
            onClick={() => {
              setModalMessage(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Salon Live ➔</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s) => {
          const isActive = s.is_active !== false;
          const planName = (s.plan || 'pro').toUpperCase();

          return (
            <div
              key={s.id}
              className={`bg-white border rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
                isActive ? 'border-slate-200/90' : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm text-base shrink-0"
                      style={{ backgroundColor: s.brand_color || '#D4A77F' }}
                    >
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#1F2937] dark:text-[#FFFFFF] leading-snug">{s.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs text-pink-700 font-semibold">/{s.slug}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-[#6B7280] dark:text-[#A0A8B8] font-bold border border-slate-200 uppercase">
                          {planName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3 h-3" />
                        <span>Suspended</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Subdomain & Custom Domain */}
                <div className="my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-mono text-[#6B7280] dark:text-[#A0A8B8] flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#747D8D] shrink-0" />
                    <span className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold truncate">{s.slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'salonpro.in'}</span>
                  </div>
                  {s.custom_domain && (
                    <div className="flex items-center gap-1.5 text-purple-700 font-semibold truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                      <span className="truncate">{s.custom_domain}</span>
                    </div>
                  )}
                  {s.owner_email && (
                    <div className="flex items-center gap-1.5 text-[#6B7280] dark:text-[#A0A8B8] truncate text-[10px]">
                      <Mail className="w-3 h-3 text-[#9CA3AF] dark:text-[#747D8D] shrink-0" />
                      <span className="truncate">{s.owner_email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#9CA3AF] dark:text-[#747D8D]">Stylists</span>
                    <strong className="text-[#1F2937] dark:text-[#FFFFFF]">{s.staff_count} Active</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#9CA3AF] dark:text-[#747D8D]">Services</span>
                    <strong className="text-[#1F2937] dark:text-[#FFFFFF]">{s.services_count} Listed</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#9CA3AF] dark:text-[#747D8D]">Clients</span>
                    <strong className="text-[#1F2937] dark:text-[#FFFFFF]">{s.customer_count}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#9CA3AF] dark:text-[#747D8D]">Revenue</span>
                    <strong className="text-emerald-700">₹{Number(s.total_revenue || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Subscription & Trial Status */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  {s.subscription_status === 'active' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Paid ({s.subscription_plan_name || 'Pro'})</span>
                    </span>
                  ) : s.trial_ends_at && new Date(s.trial_ends_at).getTime() <= Date.now() ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      <span>Trial Expired</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                      <span>
                        Trial: {s.trial_ends_at ? Math.max(1, Math.ceil((new Date(s.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 7}d left
                      </span>
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExtendTrial(s.id, 7, s.name)}
                      className="text-[10px] text-pink-700 hover:text-pink-900 font-extrabold hover:underline cursor-pointer"
                      title="Grant +7 days free trial extension"
                    >
                      +7d Trial
                    </button>
                    {s.subscription_status !== 'active' && (
                      <button
                        type="button"
                        onClick={() => handleGrantActive(s.id, s.name)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-extrabold hover:underline cursor-pointer"
                        title="Manually mark as Paid Subscriber"
                      >
                        Grant Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <a
                    href={`/${s.slug}`}
                    target="_blank"
                    className="flex-1 min-w-[100px] py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#1F2937] dark:text-[#FFFFFF] text-center text-xs font-semibold transition-all border border-slate-200"
                  >
                    Public Booking ↗
                  </a>
                  <a
                    href="/app"
                    target="_blank"
                    className="flex-1 min-w-[90px] py-2 px-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-center text-xs font-bold transition-all"
                  >
                    Owner ERP ➔
                  </a>
                  {s.phone && (
                    <a
                      href={`https://wa.me/91${s.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${s.name} team, this is SalonPro Platform Admin.`)}`}
                      target="_blank"
                      className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
                      title="Direct WhatsApp Chat with Salon Owner"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chat</span>
                    </a>
                  )}
                </div>

                {/* Super Admin Action: Change Plan & Expiry */}
                <button
                  type="button"
                  onClick={() => handleOpenEditSub(s)}
                  className="w-full py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                  <span>Change Plan & Expiry Date</span>
                </button>

                {/* Super Admin Quick Action: Suspend / Reactivate */}
                <button
                  type="button"
                  disabled={updatingId === s.id}
                  onClick={() => handleToggleStatus(s.id, isActive, s.name)}
                  className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    isActive
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>
                    {updatingId === s.id
                      ? 'Updating...'
                      : isActive
                      ? 'Suspend Tenant Workspace'
                      : 'Reactivate Tenant Workspace'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Salon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-fade-in">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} aria-hidden="true" />
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative z-10 bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl my-auto animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <h3 className="text-base font-black text-[#1F2937] dark:text-[#FFFFFF]">Register New Salon</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
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
                  placeholder="e.g. Priya Hair & Beauty Lounge"
                  value={newSalonName}
                  onChange={(e) => {
                    setNewSalonName(e.target.value);
                    if (!newSalonSlug) {
                      setNewSalonSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                    }
                  }}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2.5 text-sm text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Subdomain Slug *</label>
                <div className="flex items-center bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2 text-sm text-[#6B7280] dark:text-[#A0A8B8] font-mono">
                  <input
                    type="text"
                    required
                    placeholder="priya-salon"
                    value={newSalonSlug}
                    onChange={(e) => setNewSalonSlug(e.target.value)}
                    className="w-full bg-transparent text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none font-mono font-semibold"
                  />
                  <span>.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'salonpro.in'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Contact Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="9898012345"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2.5 text-sm text-[#1F2937] dark:text-[#FFFFFF] font-mono focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <button
                type="submit"
                disabled={savingSalon}
                className="w-full py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs sm:text-sm shadow-md shadow-[#D4A77F]/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {savingSalon ? 'Registering Salon & Creating Starter Services...' : 'Register Salon Live ➔'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )}

      {/* Platform Broadcast to All Salons Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-fade-in">
          <div className="fixed inset-0" onClick={() => setIsBroadcastModalOpen(false)} aria-hidden="true" />
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative z-10 bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl my-auto animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📢</span>
                  <div>
                    <h3 className="text-base font-black text-[#1F2937] dark:text-[#FFFFFF]">Broadcast to All Salons</h3>
                    <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Send an official platform notice to all salon owners</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

            {broadcastSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-extrabold text-base text-emerald-900">Notice Broadcast Dispatched!</h4>
                <p className="text-emerald-700 leading-relaxed text-xs">
                  Your platform message has been queued and delivered to all <strong>{salons.length} registered salon owners</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Notice Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Notice Template</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBroadcastType('payment');
                        setBroadcastTitle('Monthly Platform Subscription Notice');
                        setBroadcastMessage(
                          'Dear Salon Partner, this is a reminder regarding your active SalonPro Cloud subscription. Please ensure timely renewal to continue uninterrupted online bookings and billing services.'
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        broadcastType === 'payment'
                          ? 'bg-amber-50 border-amber-500 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-[#6B7280] dark:text-[#A0A8B8]'
                      }`}
                    >
                      💰 Renewal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBroadcastType('update');
                        setBroadcastTitle('Exciting New Feature Release');
                        setBroadcastMessage(
                          'Hello Partners! We have just released a brand new feature update with fast WhatsApp billing and performance improvements for your salon workspace.'
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        broadcastType === 'update'
                          ? 'bg-amber-50 border-amber-500 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-[#6B7280] dark:text-[#A0A8B8]'
                      }`}
                    >
                      🚀 New Feature
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBroadcastType('notice');
                        setBroadcastTitle('System Maintenance Notice');
                        setBroadcastMessage(
                          'Scheduled Maintenance: We will be performing quick cloud database optimization tonight at 2:00 AM for 15 minutes.'
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        broadcastType === 'notice'
                          ? 'bg-amber-50 border-amber-500 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-[#6B7280] dark:text-[#A0A8B8]'
                      }`}
                    >
                      ⚙️ Maintenance
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Subject Title</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Broadcast Message Body</label>
                  <textarea
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2.5 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] leading-relaxed"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[#6B7280] dark:text-[#A0A8B8] text-xs flex justify-between items-center">
                  <span>Recipients:</span>
                  <strong className="text-[#1F2937] dark:text-[#FFFFFF]">{salons.length} Active Salon Owners</strong>
                </div>

                <button
                  type="button"
                  disabled={sendingBroadcast || !broadcastMessage.trim()}
                  onClick={() => {
                    setSendingBroadcast(true);
                    setTimeout(() => {
                      setBroadcastSuccess(true);
                      setSendingBroadcast(false);
                    }, 1200);
                  }}
                  className="w-full py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs shadow-md shadow-[#D4A77F]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {sendingBroadcast ? 'Broadcasting Notice...' : `Send Broadcast to All ${salons.length} Salons ➔`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* Change Salon Plan & Expiry Date Modal */}
      {editingSalonSub && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-fade-in">
          <div className="fixed inset-0" onClick={() => setEditingSalonSub(null)} aria-hidden="true" />
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative z-10 bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-[#1F2937] dark:text-[#FFFFFF]">
                  Update Subscription & Expiry
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">{editingSalonSub.name} ({editingSalonSub.slug})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSalonSub(null)}
                className="p-1.5 rounded-lg text-[#9CA3AF] dark:text-[#747D8D] hover:text-[#1F2937] dark:text-[#FFFFFF] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-1">
                  Subscription Plan
                </label>
                <select
                  value={subPlanId}
                  onChange={(e) => setSubPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] bg-white"
                >
                  <option value="">No Plan Attached (Use Default)</option>
                  {availablePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.slug.toUpperCase()}) - ₹{Number(p.price).toLocaleString()}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-1">
                  Subscription Status
                </label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] bg-white"
                >
                  <option value="trial">trial (7-Day Trial Mode)</option>
                  <option value="active">active (Paid Subscriber)</option>
                  <option value="expired">expired (Paywall Lockout)</option>
                  <option value="cancelled">cancelled (Terminated)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-1">
                  Subscription Expiry Date
                </label>
                <input
                  type="date"
                  value={subEndsAt}
                  onChange={(e) => setSubEndsAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] bg-white"
                />
                <span className="text-[10px] text-[#9CA3AF] dark:text-[#747D8D] mt-0.5 block">
                  Leave empty for trial or perpetual access
                </span>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">
                  <input
                    type="checkbox"
                    checked={customDomainVerified}
                    onChange={(e) => setCustomDomainVerified(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <span>Custom Domain Verified (Unlocks DNS)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSalonSub(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B7280] dark:text-[#A0A8B8] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSub}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-900/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingSub ? 'Saving...' : 'Update Salon Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
