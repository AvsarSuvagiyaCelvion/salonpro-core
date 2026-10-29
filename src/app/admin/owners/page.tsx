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
        <h1 className="text-2xl font-black text-slate-900">Salon Owners & Staff Directory</h1>
        <p className="text-xs text-slate-500">Master account directory of all registered salon owners and assigned stylists</p>
      </div>
      {salons.length === 0 && !loading && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            👥
          </div>
          <h3 className="text-lg font-black text-slate-900">0 Salon Owners Listed</h3>
          <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">
            Register your client&apos;s salon in the Salons Directory to assign an owner and manage their staff team!
          </p>
          <a
            href="/admin/salons"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
          >
            <span>Go to Salons Directory ➔</span>
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {salons.map((s) => (
          <div key={s.id} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center gap-3.5 mb-5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm text-base"
                style={{ backgroundColor: s.brand_color || '#b3135b' }}
              >
                {s.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{s.name}</h3>
                <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Primary Tenant Salon
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Assigned Owner Email</div>
                  <div className="font-mono text-slate-900 font-semibold">{s.owner_email || 'Owner account pending'}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Verified Owner
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Staff Team Size</div>
                  <div className="text-slate-900 font-semibold">{s.staff_count} Stylists & Receptionists</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold border border-slate-200">
                  Salon Managed
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
