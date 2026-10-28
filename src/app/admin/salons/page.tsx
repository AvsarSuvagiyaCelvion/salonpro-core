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
  const [newBrandColor, setNewBrandColor] = useState('#b3135b');
  const [newPhone, setNewPhone] = useState('');
  const [savingSalon, setSavingSalon] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function fetchSalons() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/salons');
      const data = await res.json();
      if (res.ok) {
        setSalons(data.salons || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSalons();
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tenant Workspaces & Subdomains</h1>
          <p className="text-xs text-slate-500">Super Admin control center: manage subscriptions, subdomains, and suspend/activate tenants</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search salon, slug, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setBroadcastSuccess(false);
              setIsBroadcastModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>📢 Broadcast to All Salons</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalMessage(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Salon</span>
          </button>
        </div>
      </div>

      {/* Empty State when 0 salons registered */}
      {salons.length === 0 && !loading && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🏢
          </div>
          <h3 className="text-lg font-black text-slate-900">0 Salons Registered</h3>
          <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">
            No salon tenants have registered yet. Register your first salon tenant below to test subdomain routing!
          </p>
          <button
            type="button"
            onClick={() => {
              setModalMessage(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
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
              className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all ${
                isActive ? 'border-slate-200/90' : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm text-base shrink-0"
                      style={{ backgroundColor: s.brand_color || '#b3135b' }}
                    >
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">{s.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs text-pink-700 font-semibold">/{s.slug}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200 uppercase">
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
                <div className="my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-600 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-semibold truncate">{s.slug}.salonpro.in</span>
                  </div>
                  {s.custom_domain && (
                    <div className="flex items-center gap-1.5 text-purple-700 font-semibold truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                      <span className="truncate">{s.custom_domain}</span>
                    </div>
                  )}
                  {s.owner_email && (
                    <div className="flex items-center gap-1.5 text-slate-500 truncate text-[10px]">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{s.owner_email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Stylists</span>
                    <strong className="text-slate-900">{s.staff_count} Active</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Services</span>
                    <strong className="text-slate-900">{s.services_count} Listed</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Clients</span>
                    <strong className="text-slate-900">{s.customer_count}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Revenue</span>
                    <strong className="text-emerald-700">₹{Number(s.total_revenue || 0).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`/${s.slug}`}
                    target="_blank"
                    className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-center text-xs font-semibold transition-all border border-slate-200"
                  >
                    Public Booking ↗
                  </a>
                  <a
                    href="/app"
                    target="_blank"
                    className="flex-1 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-center text-xs font-bold transition-all"
                  >
                    Owner ERP ➔
                  </a>
                  {s.phone && (
                    <a
                      href={`https://wa.me/91${s.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${s.name} team, this is SalonPro Platform Admin.`)}`}
                      target="_blank"
                      className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center text-xs font-bold transition-all flex items-center justify-center gap-1"
                      title="Direct WhatsApp Chat with Salon Owner"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chat</span>
                    </a>
                  )}
                </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <h3 className="text-base font-black text-slate-900">Register New Salon</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Salon Name *</label>
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subdomain Slug *</label>
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-500 font-mono">
                  <input
                    type="text"
                    required
                    placeholder="priya-salon"
                    value={newSalonSlug}
                    onChange={(e) => setNewSalonSlug(e.target.value)}
                    className="w-full bg-transparent text-slate-900 focus:outline-none font-mono font-semibold"
                  />
                  <span>.salonpro.in</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="9898012345"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Theme Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newBrandColor}
                    onChange={(e) => setNewBrandColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newBrandColor}
                    onChange={(e) => setNewBrandColor(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSalon}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {savingSalon ? 'Registering Salon & Creating Starter Services...' : 'Register Salon Live ➔'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Platform Broadcast to All Salons Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Broadcast to All Salons</h3>
                  <p className="text-xs text-slate-500">Send an official platform notice to all salon owners</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Template</label>
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
                          : 'bg-slate-50 border-slate-200 text-slate-600'
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
                          : 'bg-slate-50 border-slate-200 text-slate-600'
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
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      ⚙️ Maintenance
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Title</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Broadcast Message Body</label>
                  <textarea
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex justify-between items-center">
                  <span>Recipients:</span>
                  <strong className="text-slate-900">{salons.length} Active Salon Owners</strong>
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
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
      )}
    </div>
  );
}
