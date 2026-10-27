'use client';

import React, { useState, useEffect } from 'react';
import { Users, Building2, ShieldCheck, Mail, Phone, Scissors } from 'lucide-react';

export default function AdminOwnersPage() {
  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/salons');
        const data = await res.json();
        setSalons(data.salons || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Salon Owners & Staff Directory</h1>
        <p className="text-xs text-neutral-400">Master account directory of all registered salon owners and assigned stylists</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {salons.map((s) => (
          <div key={s.id} className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md"
                style={{ backgroundColor: s.brand_color || '#b3135b' }}
              >
                {s.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">{s.name}</h3>
                <span className="text-[10px] uppercase font-bold text-amber-400">Primary Tenant</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Assigned Owner Email</div>
                  <div className="font-mono text-white font-semibold">avsarsuvagiya968@gmail.com</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                  Verified Owner
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Staff Team Size</div>
                  <div className="text-white font-semibold">{s.staff_count} Stylists & Receptionists</div>
                </div>
                <a
                  href="/app/staff"
                  target="_blank"
                  className="text-xs text-pink-400 hover:underline font-semibold"
                >
                  Manage Team ➔
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
