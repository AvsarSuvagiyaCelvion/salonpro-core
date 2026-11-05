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
      <div className="absolute -inset-1.5 bg-gradient-to-r from-[#D4A77F]/20 via-[#B8905F]/15 to-[#D4A77F]/20 rounded-3xl blur-xl opacity-70 pointer-events-none" />

      {/* Main Container Window */}
      <div className="relative bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/40 overflow-hidden transition-colors duration-300">
        {/* Top Browser / App Header */}
        <div className="bg-[#10141F] text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 border-b border-[#2A2F3A]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#EF4444] inline-block" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F59E0B] inline-block" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#10B981] inline-block" />
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-2 px-2.5 py-1 rounded-xl bg-black/20 text-[#A0A8B8] text-xs font-mono truncate">
              <span className="text-[#10B981]">https://</span>
              <span>salonpro.in/app/live</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="hidden min-[400px]:inline">Studio Active</span>
              <span className="min-[400px]:hidden">Active</span>
            </span>
            <Link
              href="/dixa-beauty-salon"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-[11px] sm:text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <span>Demo</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tab Switcher Bar */}
        <div className="bg-[#F8F9FA] dark:bg-[#10141F] border-b border-[#E5E7EB] dark:border-[#2A2F3A] px-3 sm:px-6 pt-3 flex overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-white dark:bg-[#141926] text-[#D4A77F] border-[#D4A77F] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] border-transparent hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>1. Live Studio Kanban</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'booking'
                ? 'bg-white dark:bg-[#141926] text-[#D4A77F] border-[#D4A77F] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] border-transparent hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>2. Client Booking Wizard</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white dark:bg-[#141926] text-[#D4A77F] border-[#D4A77F] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] border-transparent hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>3. 10-Sec GST POS Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white dark:bg-[#141926] text-[#D4A77F] border-[#D4A77F] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] border-transparent hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#10B981]" />
            <span>4. WhatsApp Digital Bills</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="p-4 sm:p-7 min-h-[380px] bg-[#F8F9FA] dark:bg-[#080B12] transition-colors duration-300">
          {/* TAB 1: KANBAN STUDIO */}
          {activeTab === 'kanban' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1F2937] dark:text-[#FFFFFF] flex items-center gap-2">
                    <span>Live Studio Floor</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                      3 Chairs Occupied
                    </span>
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Real-time walk-in tracker and seat assignment queue</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1F2937] dark:text-[#FFFFFF] bg-white dark:bg-[#141926] px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A]">
                  <Clock className="w-3.5 h-3.5 text-[#D4A77F]" />
                  <span>Today: 14 Completed · ₹18,450 Revenue</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Waiting Column */}
                <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4A77F] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#D4A77F]" />
                      Waiting Lounge (1)
                    </span>
                    <span className="text-[10px] font-semibold text-[#6B7280] dark:text-[#A0A8B8]">Est. 10m wait</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">Pooja Patel</span>
                      <span className="text-[10px] font-mono font-semibold text-[#D4A77F] bg-white dark:bg-[#080B12] px-1.5 py-0.5 rounded border border-[#E5E7EB] dark:border-[#2A2F3A]">Token #08</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Hair Keratin Spa · 60 min</p>
                    <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center gap-1 pt-1">
                      <User className="w-3 h-3 text-[#D4A77F]" />
                      <span>Stylist: Rahul V.</span>
                    </div>
                  </div>
                </div>

                {/* In Service Column */}
                <div className="bg-white dark:bg-[#141926] border-2 border-[#D4A77F] rounded-2xl p-4 shadow-xs ring-2 ring-[#D4A77F]/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4A77F] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#D4A77F] animate-ping" />
                      In Chair (2 Active)
                    </span>
                    <span className="text-[10px] text-[#10B981] font-bold">● Running</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">Sneha Shah</span>
                        <span className="text-[10px] font-bold text-[#D4A77F] bg-white dark:bg-[#080B12] px-2 py-0.5 rounded-full border border-[#E5E7EB] dark:border-[#2A2F3A]">Chair 1 · 25m elapsed</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Hydra Glow Facial + Threading</p>
                      <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-between pt-1">
                        <span>Stylist: Priya</span>
                        <span className="font-mono font-bold text-[#1F2937] dark:text-[#FFFFFF]">₹1,850</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">Rhea Kapoor</span>
                        <span className="text-[10px] font-bold text-[#D4A77F] bg-white dark:bg-[#080B12] px-2 py-0.5 rounded-full border border-[#E5E7EB] dark:border-[#2A2F3A]">Chair 2 · 15m elapsed</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Global Hair Color & Styling</p>
                      <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-between pt-1">
                        <span>Stylist: Kajal</span>
                        <span className="font-mono font-bold text-[#1F2937] dark:text-[#FFFFFF]">₹3,400</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ready for Bill Column */}
                <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      Ready for Checkout (1)
                    </span>
                    <span className="text-[10px] font-semibold text-[#10B981]">1-Click Bill</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">Anita Sharma</span>
                      <span className="text-[10px] font-mono font-bold text-[#10B981] bg-white dark:bg-[#080B12] px-2 py-0.5 rounded border border-[#E5E7EB] dark:border-[#2A2F3A]">₹1,200</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Gel Nail Extensions & Polish</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('billing')}
                      className="w-full py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1F2937] dark:text-[#FFFFFF] flex items-center gap-2">
                    <span>Client Online Booking Flow</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                      Zero Overlaps Guaranteed
                    </span>
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Public customer booking page linked on Instagram & Google Maps</p>
                </div>
                <Link
                  href="/dixa-beauty-salon"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#D4A77F] hover:underline"
                >
                  <span>Open Real Client View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="max-w-2xl mx-auto bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                  <div>
                    <h5 className="font-extrabold text-sm text-[#1F2937] dark:text-[#FFFFFF]">Dixa Beauty Salon</h5>
                    <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Select Treatment & Preferred Specialist</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    ★ 4.9 (128 Client Reviews)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border-2 border-[#D4A77F] bg-[#F3F4F6] dark:bg-[#1C2230] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#1F2937] dark:text-[#FFFFFF]">Bridal Glow Facial</div>
                      <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">60 mins · Deep Cleansing</div>
                    </div>
                    <span className="font-mono font-extrabold text-xs text-[#D4A77F]">₹2,500</span>
                  </div>

                  <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#080B12] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#1F2937] dark:text-[#FFFFFF]">Keratin Hair Therapy</div>
                      <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">90 mins · Anti-Frizz</div>
                    </div>
                    <span className="font-mono font-extrabold text-xs text-[#1F2937] dark:text-[#FFFFFF]">₹3,200</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-2">Available Time Slots (Today):</label>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs text-[#9CA3AF] line-through bg-[#F3F4F6] dark:bg-[#080B12]">10:00 AM (Booked)</span>
                    <span className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs text-[#9CA3AF] line-through bg-[#F3F4F6] dark:bg-[#080B12]">11:30 AM (Booked)</span>
                    <span className="px-3 py-1.5 rounded-xl border-2 border-[#D4A77F] bg-[#D4A77F] text-[#080B12] text-xs font-bold shadow-xs">02:30 PM (Selected)</span>
                    <span className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs text-[#1F2937] dark:text-[#FFFFFF] hover:border-[#D4A77F] font-medium cursor-pointer">04:00 PM</span>
                    <span className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs text-[#1F2937] dark:text-[#FFFFFF] hover:border-[#D4A77F] font-medium cursor-pointer">05:30 PM</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center gap-2 text-xs text-[#10B981]">
                  <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span><strong>Conflict-Free Slot Engine Active:</strong> Slots are protected from race conditions and double-bookings.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POS BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1F2937] dark:text-[#FFFFFF] flex items-center gap-2">
                    <span>10-Second GST POS Terminal</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                      Tax Compliant · Thermal Print Ready
                    </span>
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Instant split payment, CGST+SGST auto-calc, and staff commission attribution</p>
                </div>
              </div>

              <div className="max-w-2xl mx-auto bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A] text-xs">
                  <span className="font-bold text-[#1F2937] dark:text-[#FFFFFF]">Client: Anita Sharma (VIP Gold Member - 10% Off)</span>
                  <span className="font-mono text-[#6B7280] dark:text-[#A0A8B8]">Invoice #INV-2026-1042</span>
                </div>

                <div className="space-y-2 text-xs divide-y divide-[#E5E7EB] dark:divide-[#2A2F3A]">
                  <div className="flex items-center justify-between pt-1 text-[#1F2937] dark:text-[#FFFFFF]">
                    <span>Hair Cut & Blowdry (Stylist: Priya)</span>
                    <span className="font-mono font-bold">₹800.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[#1F2937] dark:text-[#FFFFFF]">
                    <span>Moroccanoil Treatment Serum 100ml (Retail)</span>
                    <span className="font-mono font-bold">₹1,200.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[#10B981] font-semibold">
                    <span>VIP Member Discount (-10%)</span>
                    <span className="font-mono">-₹200.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[#6B7280] dark:text-[#A0A8B8]">
                    <span>Taxes: CGST 9% (₹162) + SGST 9% (₹162)</span>
                    <span className="font-mono">+₹324.00</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-sm font-extrabold text-[#1F2937] dark:text-[#FFFFFF]">
                    <span>Grand Total Payable</span>
                    <span className="font-mono text-[#D4A77F] text-base">₹2,124.00</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#D4A77F] text-[#080B12] font-bold text-xs">UPI / GPay</span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#6B7280] dark:text-[#A0A8B8] font-semibold text-xs">Cash</span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#6B7280] dark:text-[#A0A8B8] font-semibold text-xs">Card</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('whatsapp')}
                    className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1F2937] dark:text-[#FFFFFF] flex items-center gap-2">
                    <span>Automated Meta WhatsApp Cloud Bills</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                      100% Delivery Rate
                    </span>
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Clients receive interactive WhatsApp confirmations and digital PDF bills immediately</p>
                </div>
              </div>

              <div className="max-w-md mx-auto bg-[#e5ddd5] dark:bg-[#1d2328] rounded-3xl p-4 shadow-md border-4 border-[#2A2F3A] space-y-3">
                <div className="bg-[#075e54] text-white px-3 py-2 rounded-2xl flex items-center gap-2 text-xs">
                  <div className="w-7 h-7 rounded-full bg-[#10B981] text-slate-950 font-black flex items-center justify-center text-xs">
                    D
                  </div>
                  <div>
                    <div className="font-bold">Dixa Beauty Salon (Verified)</div>
                    <div className="text-[10px] text-emerald-200">Official WhatsApp Business Account</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#141926] rounded-2xl p-3.5 shadow-xs space-y-2 text-xs text-[#1F2937] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                  <p className="font-bold text-[#1F2937] dark:text-[#FFFFFF]">Dear Anita,</p>
                  <p className="text-[11px] leading-relaxed text-[#6B7280] dark:text-[#A0A8B8]">
                    Thank you for visiting <strong className="text-[#1F2937] dark:text-[#FFFFFF]">Dixa Beauty Salon</strong>! Your appointment has been completed by <strong className="text-[#1F2937] dark:text-[#FFFFFF]">Priya</strong>.
                  </p>
                  <div className="p-2.5 rounded-xl bg-[#F3F4F6] dark:bg-[#080B12] border border-[#E5E7EB] dark:border-[#2A2F3A] font-mono text-[11px] space-y-1 text-[#1F2937] dark:text-[#FFFFFF]">
                    <div>Invoice: #INV-2026-1042</div>
                    <div>Paid: ₹2,124.00 (via UPI)</div>
                    <div>Rewards: 21 VIP Points Earned</div>
                  </div>
                  <div className="pt-1">
                    <span className="w-full block py-2 text-center rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-bold text-xs hover:opacity-90 cursor-pointer">
                      📄 View & Download Digital PDF Receipt
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Proof Strip */}
        <div className="bg-white dark:bg-[#141926] border-t border-[#E5E7EB] dark:border-[#2A2F3A] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors duration-300">
          <div className="flex items-center gap-3 text-[#6B7280] dark:text-[#A0A8B8]">
            <span className="flex items-center gap-1 text-[#1F2937] dark:text-[#FFFFFF] font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>100% Secure & Cloud-Hosted</span>
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#D4A77F]" />
              <span>99.9% Uptime · Automated WhatsApp Sync</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Link
              href="/login"
              className="text-center px-3 py-1.5 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] dark:bg-[#1C2230] dark:hover:bg-[#2A2F3A] text-[#1F2937] dark:text-[#FFFFFF] font-bold text-xs transition-all"
            >
              Owner Portal Login ➔
            </Link>
            <Link
              href="/dixa-beauty-salon"
              target="_blank"
              className="text-center px-3.5 py-1.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-black text-xs shadow-xs transition-all"
            >
              Open Live Salon Demo ➔
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
