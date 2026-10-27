'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, ExternalLink, Calendar, Users, Scissors, Search, Phone } from 'lucide-react';

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      </div>

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
    </div>
  );
}
