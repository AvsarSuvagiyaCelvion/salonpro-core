'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, ExternalLink, Calendar, Users, Scissors, Search, Phone } from 'lucide-react';

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Salon Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">All Registered Salons</h1>
          <p className="text-xs text-slate-500">View branding, configured working hours, and operational capacity</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search salon or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

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
          <h3 className="text-lg font-black text-slate-900">0 Salons Registered (Clean State)</h3>
          <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">
            All fake demo salons have been permanently removed. Register your client&apos;s real salon live below to start the demo!
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
        {filtered.map((s) => (
          <div key={s.id} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm text-base"
                  style={{ backgroundColor: s.brand_color || '#b3135b' }}
                >
                  {s.name.charAt(0)}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Tenant
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900">{s.name}</h3>
              <div className="font-mono text-xs text-pink-700 font-semibold mt-0.5">/{s.slug}</div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
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
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Hours</span>
                  <strong className="text-slate-700">{s.open_time?.slice(0, 5)} - {s.close_time?.slice(0, 5)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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
            </div>
          </div>
        ))}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Public URL Slug *</label>
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-500 font-mono">
                  <span>salonpro/</span>
                  <input
                    type="text"
                    required
                    placeholder="priya-salon"
                    value={newSalonSlug}
                    onChange={(e) => setNewSalonSlug(e.target.value)}
                    className="w-full bg-transparent text-slate-900 focus:outline-none font-mono font-semibold"
                  />
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
    </div>
  );
}
