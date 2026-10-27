'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CreditCard, Building2, Calendar, Award } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/overview');
        const json = await res.json();
        setData(json);
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
        <h1 className="text-2xl font-black text-white">Platform Financials & Analytics</h1>
        <p className="text-xs text-neutral-400">Consolidated revenue, appointment volumes, and customer growth across all salons</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            Total Billed Revenue
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            ₹{Number(data?.metrics?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-neutral-500 mt-2">Cumulative invoices generated across all salon tenants</p>
        </div>

        <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            Total Completed Payments
          </div>
          <div className="text-3xl font-black text-white font-mono">
            ₹{Number(data?.metrics?.totalPaid || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-neutral-500 mt-2">Collected via Cash, UPI, and Card</p>
        </div>

        <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            Total Appointments Booked
          </div>
          <div className="text-3xl font-black text-pink-400 font-mono">
            {data?.metrics?.totalAppointments || 0}
          </div>
          <p className="text-xs text-neutral-500 mt-2">Online bookings and in-store walk-in sessions</p>
        </div>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6">
        <h2 className="text-base font-bold text-white mb-4">Branch Performance Breakdown</h2>
        <div className="space-y-4">
          {(data?.salons || []).map((s: any) => (
            <div key={s.id} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: s.brand_color || '#b3135b' }}
                >
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white">{s.name}</div>
                  <div className="text-xs text-neutral-500 font-mono">/{s.slug}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-neutral-300">
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold">Clients</span>
                  <span className="font-bold text-white">{s.customer_count}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold">Appointments</span>
                  <span className="font-bold text-white">{s.appointment_count}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold">Revenue</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{Number(s.total_revenue || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
