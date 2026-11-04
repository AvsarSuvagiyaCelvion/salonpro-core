'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Receipt,
  Scissors,
  MessageSquare,
  Clock,
  CheckCircle2,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

type TabKey = 'kanban' | 'booking' | 'billing' | 'whatsapp';

export default function InteractiveProductPreview() {
  const [activeTab, setActiveTab] = useState<TabKey>('kanban');

  return (
    <div className="relative z-10 max-w-5xl mx-auto mt-10 sm:mt-14 px-2 sm:px-4">
      {/* Outer Glow Ring */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 rounded-3xl blur-xl opacity-70 pointer-events-none" />

      {/* Main Container Window */}
      <div className="relative bg-white border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden">
        {/* Top Browser / App Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-3 px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono">
              <span className="text-emerald-400">https://</span>
              <span>salonpro.in/app/live</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Studio Active · Real-time Sync</span>
            </span>
            <Link
              href="/dixa-beauty-salon"
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Test Live Demo</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tab Switcher Bar */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-3 sm:px-6 pt-3 flex overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-white text-[#b3135b] border-[#b3135b] shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>1. Live Studio Kanban</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'booking'
                ? 'bg-white text-[#b3135b] border-[#b3135b] shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>2. Client Booking Wizard</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white text-[#b3135b] border-[#b3135b] shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>3. 10-Sec GST POS Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white text-[#b3135b] border-[#b3135b] shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>4. WhatsApp Digital Bills</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="p-4 sm:p-7 min-h-[380px] bg-slate-50/50">
          {/* TAB 1: KANBAN STUDIO */}
          {activeTab === 'kanban' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Live Studio Floor</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      3 Chairs Occupied
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">Real-time walk-in tracker and seat assignment queue</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-[#b3135b]" />
                  <span>Today: 14 Completed · ₹18,450 Revenue</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Waiting Column */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Waiting Lounge (1)
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Est. 10m wait</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Pooja Patel</span>
                      <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">Token #08</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Hair Keratin Spa · 60 min</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Stylist: Rahul V.</span>
                    </div>
                  </div>
                </div>

                {/* In Service Column */}
                <div className="bg-white border border-pink-300 rounded-2xl p-4 shadow-xs ring-2 ring-pink-100/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#b3135b] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#b3135b] animate-ping" />
                      In Chair (2 Active)
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 font-bold">● Running</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-pink-50/70 border border-pink-200/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Sneha Shah</span>
                        <span className="text-[10px] font-bold text-[#b3135b] bg-pink-100 px-2 py-0.5 rounded-full">Chair 1 · 25m elapsed</span>
                      </div>
                      <p className="text-[11px] text-slate-600">Hydra Glow Facial + Threading</p>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                        <span>Stylist: Priya</span>
                        <span className="font-mono font-bold text-slate-800">₹1,850</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Rhea Kapoor</span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Chair 2 · 15m elapsed</span>
                      </div>
                      <p className="text-[11px] text-slate-600">Global Hair Color & Styling</p>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                        <span>Stylist: Kajal</span>
                        <span className="font-mono font-bold text-slate-800">₹3,400</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ready for Bill Column */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Ready for Checkout (1)
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600">1-Click Bill</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Anita Sharma</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">₹1,200</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Gel Nail Extensions & Polish</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('billing')}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Create POS Invoice ➔</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENT BOOKING WIZARD */}
          {activeTab === 'booking' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Client Online Booking Flow</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#b3135b]">
                      Zero Overlaps Guaranteed
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">Public customer booking page linked on Instagram & Google Maps</p>
                </div>
                <Link
                  href="/dixa-beauty-salon"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#b3135b] hover:underline"
                >
                  <span>Open Real Client View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">Dixa Beauty Salon</h5>
                    <p className="text-xs text-slate-500">Select Treatment & Preferred Specialist</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                    ★ 4.9 (128 Client Reviews)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border-2 border-[#b3135b] bg-pink-50/50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">Bridal Glow Facial</div>
                      <div className="text-[11px] text-slate-500">60 mins · Deep Cleansing</div>
                    </div>
                    <span className="font-mono font-extrabold text-xs text-[#b3135b]">₹2,500</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">Keratin Hair Therapy</div>
                      <div className="text-[11px] text-slate-500">90 mins · Anti-Frizz</div>
                    </div>
                    <span className="font-mono font-extrabold text-xs text-slate-900">₹3,200</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Available Time Slots (Today):</label>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-400 line-through bg-slate-50">10:00 AM (Booked)</span>
                    <span className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-400 line-through bg-slate-50">11:30 AM (Booked)</span>
                    <span className="px-3 py-1.5 rounded-xl border-2 border-[#b3135b] bg-[#b3135b] text-white text-xs font-bold shadow-xs">02:30 PM (Selected)</span>
                    <span className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-700 hover:border-[#b3135b] font-medium cursor-pointer">04:00 PM</span>
                    <span className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-700 hover:border-[#b3135b] font-medium cursor-pointer">05:30 PM</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Advisory Transaction Locking Active:</strong> Slots are protected from race conditions and double-bookings.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POS BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>10-Second GST POS Terminal</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Tax Compliant · Thermal Print Ready
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">Instant split payment, CGST+SGST auto-calc, and staff commission attribution</p>
                </div>
              </div>

              <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-900">Client: Anita Sharma (VIP Gold Member - 10% Off)</span>
                  <span className="font-mono text-slate-500">Invoice #INV-2026-1042</span>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex items-center justify-between pt-1">
                    <span>Hair Cut & Blowdry (Stylist: Priya)</span>
                    <span className="font-mono font-bold text-slate-800">₹800.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span>Moroccanoil Treatment Serum 100ml (Retail)</span>
                    <span className="font-mono font-bold text-slate-800">₹1,200.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-emerald-700 font-semibold">
                    <span>VIP Member Discount (-10%)</span>
                    <span className="font-mono">-₹200.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-slate-500">
                    <span>Taxes: CGST 9% (₹162) + SGST 9% (₹162)</span>
                    <span className="font-mono">+₹324.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-sm font-extrabold text-slate-900">
                    <span>Grand Total Payable</span>
                    <span className="font-mono text-[#b3135b] text-base">₹2,124.00</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-pink-50 border border-pink-200 text-[#b3135b] font-bold text-xs">UPI / GPay</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs">Cash</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs">Card</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('whatsapp')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Complete & Send WhatsApp Bill</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP RECEIPT */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Automated Meta WhatsApp Cloud Bills</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      100% Delivery Rate
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">Clients receive interactive WhatsApp confirmations and digital PDF bills immediately</p>
                </div>
              </div>

              <div className="max-w-md mx-auto bg-[#e5ddd5] rounded-3xl p-4 shadow-md border-4 border-slate-800 space-y-3">
                <div className="bg-[#075e54] text-white px-3 py-2 rounded-2xl flex items-center gap-2 text-xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-400 text-slate-900 font-black flex items-center justify-center text-xs">
                    D
                  </div>
                  <div>
                    <div className="font-bold">Dixa Beauty Salon (Verified)</div>
                    <div className="text-[10px] text-emerald-200">Official WhatsApp Business Account</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3.5 shadow-xs space-y-2 text-xs text-slate-800">
                  <p className="font-bold text-slate-900">Dear Anita,</p>
                  <p className="text-[11px] leading-relaxed">
                    Thank you for visiting <strong>Dixa Beauty Salon</strong>! Your appointment has been completed by <strong>Priya</strong>.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1">
                    <div>Invoice: #INV-2026-1042</div>
                    <div>Paid: ₹2,124.00 (via UPI)</div>
                    <div>Rewards: 21 VIP Points Earned</div>
                  </div>
                  <div className="pt-1">
                    <span className="w-full block py-2 text-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs hover:bg-emerald-100 cursor-pointer">
                      📄 View & Download Digital PDF Receipt
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Proof Strip */}
        <div className="bg-white border-t border-slate-200/90 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-600">
            <span className="flex items-center gap-1 text-slate-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full Source Code Included</span>
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Next.js 16 + Supabase Multi-Tenant</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
            >
              Owner Portal Login ➔
            </Link>
            <Link
              href="/dixa-beauty-salon"
              target="_blank"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#b3135b] to-[#d62475] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all"
            >
              Open Live Salon Demo ➔
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
