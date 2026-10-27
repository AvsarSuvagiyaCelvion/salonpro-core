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
          <h1 className="text-2xl font-black text-white">All Registered Salons</h1>
          <p className="text-xs text-neutral-400">View branding, configured working hours, and operational capacity</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search salon or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md"
                  style={{ backgroundColor: s.brand_color || '#b3135b' }}
                >
                  {s.name.charAt(0)}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active Tenant
                </span>
              </div>

              <h3 className="font-extrabold text-base text-white">{s.name}</h3>
              <div className="font-mono text-xs text-pink-400 mt-0.5">/{s.slug}</div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-xs text-neutral-400">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500">Stylists</span>
                  <strong className="text-white">{s.staff_count} Active</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500">Services</span>
                  <strong className="text-white">{s.services_count} Listed</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500">Clients</span>
                  <strong className="text-white">{s.customer_count}</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500">Hours</span>
                  <strong className="text-neutral-200">{s.open_time?.slice(0, 5)} - {s.close_time?.slice(0, 5)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
              <a
                href={`/${s.slug}`}
                target="_blank"
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-center text-xs font-semibold transition-all"
              >
                Public Booking ↗
              </a>
              <a
                href="/app"
                target="_blank"
                className="flex-1 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-center text-xs font-bold transition-all"
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
