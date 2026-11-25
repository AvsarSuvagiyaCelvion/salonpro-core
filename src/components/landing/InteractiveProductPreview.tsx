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
  Sparkles,
  Phone,
  Columns3,
  Check,
  Play,
  X,
  MessageCircle,
} from 'lucide-react';

type TabKey = 'calendar' | 'kanban' | 'booking' | 'billing' | 'whatsapp';

interface DemoAppointment {
  id: string;
  customerName: string;
  phone: string;
  service: string;
  stylist: string;
  time: string;
  price: number;
  duration: string;
  status: 'arrived' | 'scheduled' | 'done';
  statusLabel: string;
  vipTier?: string;
  visitCount?: number;
}

export default function InteractiveProductPreview() {
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  const [selectedStylistFilter, setSelectedStylistFilter] = useState<'all' | 'priya' | 'neha' | 'rahul'>('all');
  const [selectedDemoAppt, setSelectedDemoAppt] = useState<DemoAppointment | null>(null);

  const demoAppointments: DemoAppointment[] = [
    {
      id: 'd1',
      customerName: 'Ananya Iyer',
      phone: '98201 45890',
      service: 'Hydra-Gloss Hair Spa',
      stylist: 'Priya Sharma',
      time: '10:00 AM - 11:00 AM',
      price: 2800,
      duration: '60 min',
      status: 'arrived',
      statusLabel: 'In Chair',
      vipTier: 'Gold Member',
      visitCount: 7,
    },
    {
      id: 'd2',
      customerName: 'Rhea Kapoor',
      phone: '98190 32145',
      service: 'Champagne Balayage & Gloss',
      stylist: 'Neha Patel',
      time: '10:30 AM - 12:30 PM',
      price: 4500,
      duration: '120 min',
      status: 'arrived',
      statusLabel: 'In Chair',
      vipTier: 'Diamond VIP',
      visitCount: 14,
    },
    {
      id: 'd3',
      customerName: 'Vikram Malhotra',
      phone: '98700 88219',
      service: 'Royal Beard Sculpt & Fade',
      stylist: 'Rahul Verma',
      time: '11:00 AM - 11:45 AM',
      price: 1200,
      duration: '45 min',
      status: 'done',
      statusLabel: 'Completed',
      vipTier: 'Regular',
      visitCount: 4,
    },
    {
      id: 'd4',
      customerName: 'Sneha Desai',
      phone: '98212 90123',
      service: 'Keratin Smooth Infusion',
      stylist: 'Priya Sharma',
      time: '01:00 PM - 02:30 PM',
      price: 3800,
      duration: '90 min',
      status: 'scheduled',
      statusLabel: 'Confirmed',
      vipTier: 'Silver Member',
      visitCount: 3,
    },
    {
      id: 'd5',
      customerName: 'Pooja Mehta',
      phone: '99205 67431',
      service: 'Bridal Radiance Facial',
      stylist: 'Neha Patel',
      time: '02:00 PM - 03:15 PM',
      price: 3200,
      duration: '75 min',
      status: 'scheduled',
      statusLabel: 'Confirmed',
      vipTier: 'Gold Member',
      visitCount: 6,
    },
    {
      id: 'd6',
      customerName: 'Arjun Singh',
      phone: '98330 11299',
      service: 'Precision Fade & Scalp Refresh',
      stylist: 'Rahul Verma',
      time: '02:30 PM - 03:15 PM',
      price: 1500,
      duration: '45 min',
      status: 'scheduled',
      statusLabel: 'Confirmed',
      vipTier: 'Regular',
      visitCount: 2,
    },
  ];

  return (
    <div className="relative z-10 max-w-5xl mx-auto mt-10 sm:mt-14 px-2 sm:px-4">
      {/* Outer Glow Ring */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-[#D4A77F]/25 via-[#B8905F]/20 to-[#D4A77F]/25 rounded-3xl blur-xl opacity-75 pointer-events-none" />

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
            <div className="hidden sm:flex items-center gap-2 ml-2 px-2.5 py-1 rounded-xl bg-black/30 text-[#A0A8B8] text-xs font-mono truncate">
              <span className="text-[#10B981]">https://</span>
              <span>studiodeskapp.com/app/appointments</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Live Salon Floor</span>
            </span>
            <Link
              href="/dixa-beauty-salon"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-[11px] sm:text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <span>Live Demo</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tab Switcher Bar */}
        <div className="bg-[#F8F9FA] dark:bg-[#10141F] border-b border-[#E5E7EB] dark:border-[#2A2F3A] px-3 sm:px-6 pt-3 flex overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-white dark:bg-[#141926] text-[#D4A77F] border-[#D4A77F] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] border-transparent hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#D4A77F]" />
            <span>1. Multi-Stylist Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-white dark:bg-[#141926] text-[#D4A77F] border-[#D4A77F] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] border-transparent hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>2. Live Studio Kanban</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'booking'
                ? 'bg-white dark:bg-[#141926] text-[#D4A77F] border-[#D4A77F] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] border-transparent hover:text-[#1F2937] dark:hover:text-[#FFFFFF]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>3. Client Booking Wizard</span>
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
            <span>4. 10-Sec GST POS Billing</span>
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
            <span>5. WhatsApp Digital Bills</span>
          </button>
        </div>

        {/* Tab Content Canvas */}
        <div className="p-3 sm:p-6 min-h-[420px] bg-[#F8F9FA] dark:bg-[#080B12] transition-colors duration-300">
          {/* TAB 1: LUXURY MULTI-STYLIST CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1F2937] dark:text-white flex items-center gap-2">
                    <span>Stylist Chair Schedule &amp; Day Lanes</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4A77F]/15 text-[#8C5E35] dark:text-[#D4A77F] border border-[#D4A77F]/30">
                      Live Studio View
                    </span>
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                    Click any appointment card to preview VIP profile, send WhatsApp or jump to POS
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#1F2937] dark:text-white bg-white dark:bg-[#141926] px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C5E2E] dark:text-[#D4A77F]" />
                  <span>Today: 12 Bookings · <strong className="text-[#8C5E2E] dark:text-[#D4A77F] font-variant-numeric tabular-nums">₹17,000</strong></span>
                </div>
              </div>

              {/* Stylist Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] mr-1">Chairs:</span>
                <button
                  type="button"
                  onClick={() => setSelectedStylistFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedStylistFilter === 'all'
                      ? 'bg-[#D4A77F] text-[#080B12] shadow-xs'
                      : 'bg-white dark:bg-[#141926] text-[#6B7280] dark:text-[#A0A8B8] border border-[#E5E7EB] dark:border-[#2A2F3A]'
                  }`}
                >
                  All Stylists (3)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStylistFilter('priya')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedStylistFilter === 'priya'
                      ? 'bg-[#D4A77F] text-[#080B12] shadow-xs'
                      : 'bg-white dark:bg-[#141926] text-[#6B7280] dark:text-[#A0A8B8] border border-[#E5E7EB] dark:border-[#2A2F3A]'
                  }`}
                >
                  Priya Sharma (Senior)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStylistFilter('neha')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedStylistFilter === 'neha'
                      ? 'bg-[#D4A77F] text-[#080B12] shadow-xs'
                      : 'bg-white dark:bg-[#141926] text-[#6B7280] dark:text-[#A0A8B8] border border-[#E5E7EB] dark:border-[#2A2F3A]'
                  }`}
                >
                  Neha Patel (Color)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStylistFilter('rahul')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedStylistFilter === 'rahul'
                      ? 'bg-[#D4A77F] text-[#080B12] shadow-xs'
                      : 'bg-white dark:bg-[#141926] text-[#6B7280] dark:text-[#A0A8B8] border border-[#E5E7EB] dark:border-[#2A2F3A]'
                  }`}
                >
                  Rahul Verma (Barber)
                </button>
              </div>

              {/* Stylist Lanes Grid */}
              <div className="bg-white dark:bg-[#141926] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-md overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB] dark:divide-[#2A2F3A]">
                  {/* Stylist 1: Priya Sharma */}
                  {(selectedStylistFilter === 'all' || selectedStylistFilter === 'priya') && (
                    <div className="flex flex-col">
                      <div className="p-3.5 bg-[#F9FAFB] dark:bg-[#10141F] border-b border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#D4A77F] text-[#080B12] font-black text-xs flex items-center justify-center shadow-xs">
                            PS
                          </div>
                          <div>
                            <div className="font-extrabold text-xs sm:text-sm text-[#1F2937] dark:text-white">
                              Priya Sharma
                            </div>
                            <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8]">
                              Master Stylist · Chair #1
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#8C5E2E] dark:text-[#D4A77F] bg-white dark:bg-[#141926] px-2 py-0.5 rounded-full border border-[#E5E7EB] dark:border-[#2A2F3A] font-variant-numeric tabular-nums">
                          4 Appts · ₹6,600
                        </span>
                      </div>

                      <div className="p-3 space-y-2.5 flex-1">
                        {/* Appt 1: Ananya */}
                        <div
                          onClick={() => setSelectedDemoAppt(demoAppointments[0])}
                          className="p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/25 hover:border-amber-400 cursor-pointer transition-all shadow-2xs group"
                        >
                          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-black/5 dark:border-white/5">
                            <span className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] font-variant-numeric tabular-nums flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>10:00 - 11:00 AM</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 animate-pulse">
                              In Chair
                            </span>
                          </div>
                          <div className="mt-1.5 font-extrabold text-xs text-[#1F2937] dark:text-white group-hover:text-[#8C5E2E] dark:group-hover:text-[#D4A77F] transition-colors">
                            Ananya Iyer
                          </div>
                          <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-between mt-0.5">
                            <span className="truncate">Hydra-Gloss Hair Spa</span>
                            <span className="font-black text-[#8C5E2E] dark:text-[#D4A77F] font-variant-numeric tabular-nums">₹2,800</span>
                          </div>
                        </div>

                        {/* Appt 2: Sneha */}
                        <div
                          onClick={() => setSelectedDemoAppt(demoAppointments[3])}
                          className="p-3 rounded-xl border border-[#D4A77F]/30 dark:border-[#D4A77F]/30 bg-gradient-to-br from-white to-[#FFFBF7] dark:from-[#141926] dark:to-[#1A2030] hover:border-[#D4A77F] cursor-pointer transition-all shadow-2xs group"
                        >
                          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-black/5 dark:border-white/5">
                            <span className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] font-variant-numeric tabular-nums flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>01:00 - 02:30 PM</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              Confirmed
                            </span>
                          </div>
                          <div className="mt-1.5 font-extrabold text-xs text-[#1F2937] dark:text-white group-hover:text-[#8C5E2E] dark:group-hover:text-[#D4A77F] transition-colors">
                            Sneha Desai
                          </div>
                          <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-between mt-0.5">
                            <span className="truncate">Keratin Smooth Infusion</span>
                            <span className="font-black text-[#8C5E2E] dark:text-[#D4A77F] font-variant-numeric tabular-nums">₹3,800</span>
                          </div>
                        </div>

                        {/* Empty Slot */}
                        <div className="h-14 border border-dashed border-[#E5E7EB] dark:border-[#2A2F3A] hover:border-[#D4A77F] rounded-xl flex items-center justify-center text-[10px] text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#D4A77F] transition-colors cursor-pointer bg-[#F9FAFB]/40 dark:bg-[#10141F]/40">
                          + 03:00 PM Slot Available
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stylist 2: Neha Patel */}
                  {(selectedStylistFilter === 'all' || selectedStylistFilter === 'neha') && (
                    <div className="flex flex-col">
                      <div className="p-3.5 bg-[#F9FAFB] dark:bg-[#10141F] border-b border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#B8905F] text-white font-black text-xs flex items-center justify-center shadow-xs">
                            NP
                          </div>
                          <div>
                            <div className="font-extrabold text-xs sm:text-sm text-[#1F2937] dark:text-white">
                              Neha Patel
                            </div>
                            <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8]">
                              Color Specialist · Chair #2
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#8C5E2E] dark:text-[#D4A77F] bg-white dark:bg-[#141926] px-2 py-0.5 rounded-full border border-[#E5E7EB] dark:border-[#2A2F3A] font-variant-numeric tabular-nums">
                          3 Appts · ₹7,700
                        </span>
                      </div>

                      <div className="p-3 space-y-2.5 flex-1">
                        {/* Appt 1: Rhea */}
                        <div
                          onClick={() => setSelectedDemoAppt(demoAppointments[1])}
                          className="p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/25 hover:border-amber-400 cursor-pointer transition-all shadow-2xs group"
                        >
                          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-black/5 dark:border-white/5">
                            <span className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] font-variant-numeric tabular-nums flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>10:30 - 12:30 PM</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 animate-pulse">
                              In Chair
                            </span>
                          </div>
                          <div className="mt-1.5 font-extrabold text-xs text-[#1F2937] dark:text-white group-hover:text-[#8C5E2E] dark:group-hover:text-[#D4A77F] transition-colors">
                            Rhea Kapoor
                          </div>
                          <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-between mt-0.5">
                            <span className="truncate">Champagne Balayage</span>
                            <span className="font-black text-[#8C5E2E] dark:text-[#D4A77F] font-variant-numeric tabular-nums">₹4,500</span>
                          </div>
                        </div>

                        {/* Appt 2: Pooja */}
                        <div
                          onClick={() => setSelectedDemoAppt(demoAppointments[4])}
                          className="p-3 rounded-xl border border-[#D4A77F]/30 dark:border-[#D4A77F]/30 bg-gradient-to-br from-white to-[#FFFBF7] dark:from-[#141926] dark:to-[#1A2030] hover:border-[#D4A77F] cursor-pointer transition-all shadow-2xs group"
                        >
                          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-black/5 dark:border-white/5">
                            <span className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] font-variant-numeric tabular-nums flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>02:00 - 03:15 PM</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              Confirmed
                            </span>
                          </div>
                          <div className="mt-1.5 font-extrabold text-xs text-[#1F2937] dark:text-white group-hover:text-[#8C5E2E] dark:group-hover:text-[#D4A77F] transition-colors">
                            Pooja Mehta
                          </div>
                          <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-between mt-0.5">
                            <span className="truncate">Bridal Radiance Facial</span>
                            <span className="font-black text-[#8C5E2E] dark:text-[#D4A77F] font-variant-numeric tabular-nums">₹3,200</span>
                          </div>
                        </div>

                        {/* Empty Slot */}
                        <div className="h-14 border border-dashed border-[#E5E7EB] dark:border-[#2A2F3A] hover:border-[#D4A77F] rounded-xl flex items-center justify-center text-[10px] text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#D4A77F] transition-colors cursor-pointer bg-[#F9FAFB]/40 dark:bg-[#10141F]/40">
                          + 04:00 PM Slot Available
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stylist 3: Rahul Verma */}
                  {(selectedStylistFilter === 'all' || selectedStylistFilter === 'rahul') && (
                    <div className="flex flex-col">
                      <div className="p-3.5 bg-[#F9FAFB] dark:bg-[#10141F] border-b border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#10141F] dark:bg-[#2A2F3A] text-[#D4A77F] border border-[#D4A77F]/30 font-black text-xs flex items-center justify-center shadow-xs">
                            RV
                          </div>
                          <div>
                            <div className="font-extrabold text-xs sm:text-sm text-[#1F2937] dark:text-white">
                              Rahul Verma
                            </div>
                            <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8]">
                              Senior Barber · Chair #3
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#D4A77F] bg-white dark:bg-[#141926] px-2 py-0.5 rounded-full border border-[#E5E7EB] dark:border-[#2A2F3A] font-variant-numeric tabular-nums">
                          5 Appts · ₹2,700
                        </span>
                      </div>

                      <div className="p-3 space-y-2.5 flex-1">
                        {/* Appt 1: Vikram (Done) */}
                        <div
                          onClick={() => setSelectedDemoAppt(demoAppointments[2])}
                          className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/25 hover:border-emerald-400 cursor-pointer transition-all shadow-2xs group"
                        >
                          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-black/5 dark:border-white/5">
                            <span className="font-bold text-[#D4A77F] font-variant-numeric tabular-nums flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>11:00 - 11:45 AM</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
                              Completed
                            </span>
                          </div>
                          <div className="mt-1.5 font-extrabold text-xs text-[#1F2937] dark:text-white group-hover:text-[#D4A77F] transition-colors">
                            Vikram Malhotra
                          </div>
                          <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-between mt-0.5">
                            <span className="truncate">Royal Beard &amp; Fade</span>
                            <span className="font-black text-[#D4A77F] font-variant-numeric tabular-nums">₹1,200</span>
                          </div>
                        </div>

                        {/* Appt 2: Arjun */}
                        <div
                          onClick={() => setSelectedDemoAppt(demoAppointments[5])}
                          className="p-3 rounded-xl border border-[#D4A77F]/30 dark:border-[#D4A77F]/30 bg-gradient-to-br from-white to-[#FFFBF7] dark:from-[#141926] dark:to-[#1A2030] hover:border-[#D4A77F] cursor-pointer transition-all shadow-2xs group"
                        >
                          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-black/5 dark:border-white/5">
                            <span className="font-bold text-[#D4A77F] font-variant-numeric tabular-nums flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>02:30 - 03:15 PM</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                              Confirmed
                            </span>
                          </div>
                          <div className="mt-1.5 font-extrabold text-xs text-[#1F2937] dark:text-white group-hover:text-[#D4A77F] transition-colors">
                            Arjun Singh
                          </div>
                          <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-between mt-0.5">
                            <span className="truncate">Fade &amp; Scalp Refresh</span>
                            <span className="font-black text-[#D4A77F] font-variant-numeric tabular-nums">₹1,500</span>
                          </div>
                        </div>

                        {/* Empty Slot */}
                        <div className="h-14 border border-dashed border-[#E5E7EB] dark:border-[#2A2F3A] hover:border-[#D4A77F] rounded-xl flex items-center justify-center text-[10px] text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#D4A77F] transition-colors cursor-pointer bg-[#F9FAFB]/40 dark:bg-[#10141F]/40">
                          + 03:30 PM Slot Available
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Modal Preview for Appointment Click */}
              {selectedDemoAppt && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#141926] rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#D4A77F]" />
                        <h3 className="font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-white">
                          Appointment Details
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedDemoAppt(null)}
                        className="text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-[#1F2937] dark:text-white">
                            {selectedDemoAppt.customerName}
                          </div>
                          <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">
                            +91 {selectedDemoAppt.phone}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#D4A77F]/15 border border-[#D4A77F]/30 text-[#8C5E35] dark:text-[#D4A77F] text-xs font-bold">
                          {selectedDemoAppt.vipTier || 'VIP Client'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-[#6B7280] dark:text-[#A0A8B8]">Service:</span>
                          <span className="font-bold text-[#1F2937] dark:text-white">{selectedDemoAppt.service}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-[#6B7280] dark:text-[#A0A8B8]">Assigned Stylist:</span>
                          <span className="font-bold text-[#1F2937] dark:text-white">{selectedDemoAppt.stylist}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-[#6B7280] dark:text-[#A0A8B8]">Time &amp; Duration:</span>
                          <span className="font-bold text-[#D4A77F] font-variant-numeric tabular-nums">{selectedDemoAppt.time} ({selectedDemoAppt.duration})</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#6B7280] dark:text-[#A0A8B8]">Estimated Price:</span>
                          <span className="font-extrabold text-[#D4A77F] text-sm font-variant-numeric tabular-nums">₹{selectedDemoAppt.price.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDemoAppt(null);
                          setActiveTab('billing');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Instant 10-Sec POS Bill</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDemoAppt(null);
                          setActiveTab('whatsapp');
                        }}
                        className="py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] font-bold text-xs flex items-center gap-1 cursor-pointer"
                        title="WhatsApp Receipt"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KANBAN STUDIO */}
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
                <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                      In Chair (2)
                    </span>
                    <span className="text-[10px] font-semibold text-[#6B7280] dark:text-[#A0A8B8]">24 min avg</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] border-l-4 border-l-[#3B82F6] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">Aarav Shah</span>
                        <span className="text-[10px] font-semibold text-[#10B981] bg-[#10B981]/15 px-1.5 py-0.5 rounded">Chair 1</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Skin Fade + Beard Trim · ₹700</p>
                      <div className="w-full bg-[#E5E7EB] dark:bg-[#2A2F3A] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#3B82F6] h-full w-3/4 rounded-full" />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F3F4F6] dark:bg-[#1C2230] border-l-4 border-l-[#D4A77F] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">Meera Joshi</span>
                        <span className="text-[10px] font-semibold text-[#10B981] bg-[#10B981]/15 px-1.5 py-0.5 rounded">Chair 3</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Hydra Facial · ₹1,800</p>
                      <div className="w-full bg-[#E5E7EB] dark:bg-[#2A2F3A] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#D4A77F] h-full w-1/2 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing / Completed Column */}
                <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      Ready to Bill (1)
                    </span>
                    <span className="text-[10px] font-semibold text-[#10B981]">Instant POS</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">Anita Sharma</span>
                      <span className="text-xs font-mono font-bold text-[#10B981]">₹2,124</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Balayage Touchup + Wash</p>
                    <button
                      onClick={() => setActiveTab('billing')}
                      className="w-full py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Generate Bill</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLIENT BOOKING WIZARD */}
          {activeTab === 'booking' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1F2937] dark:text-[#FFFFFF] flex items-center gap-2">
                    <span>Branded Client Booking Experience</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4A77F]/15 text-[#8C5E35] dark:text-[#D4A77F]">
                      Zero App Download Required
                    </span>
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Give clients a frictionless link via WhatsApp bio or Instagram</p>
                </div>
                <Link
                  href="/dixa-beauty-salon"
                  target="_blank"
                  className="text-xs font-bold text-[#D4A77F] hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Open Full Client Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="max-w-xl mx-auto bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                  <div className="w-10 h-10 rounded-xl bg-[#D4A77F] text-[#080B12] font-black flex items-center justify-center text-base">
                    ✂
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-[#1F2937] dark:text-[#FFFFFF]">Dixa Beauty Salon &amp; Spa</h5>
                    <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">4.9 ★ (340+ reviews) · Race Course, Rajkot</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#6B7280] dark:text-[#A0A8B8] uppercase tracking-wider">Select Treatment</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl border-2 border-[#D4A77F] bg-[#D4A77F]/10 space-y-1 cursor-pointer">
                      <div className="font-bold text-xs text-[#1F2937] dark:text-[#FFFFFF]">Bridal Glow Facial</div>
                      <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">60 min · ₹1,800</div>
                    </div>
                    <div className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F8F9FA] dark:bg-[#1C2230] opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="font-bold text-xs text-[#1F2937] dark:text-[#FFFFFF]">Keratin Hair Spa</div>
                      <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">75 min · ₹2,400</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#6B7280] dark:text-[#A0A8B8] uppercase tracking-wider">Select Time Slot (Conflict-Free)</span>
                  <div className="flex flex-wrap gap-2">
                    {['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'].map((slot, i) => (
                      <span
                        key={slot}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          i === 1
                            ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-xs'
                            : 'bg-[#F3F4F6] dark:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2F3A]'
                        }`}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button className="w-full py-2.5 rounded-xl bg-[#D4A77F] text-[#080B12] font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Confirm Slot · Automated SMS &amp; WhatsApp Receipt</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 10-SEC GST POS BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1F2937] dark:text-[#FFFFFF] flex items-center gap-2">
                    <span>10-Second Quick GST POS Checkout</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4A77F]/15 text-[#8C5E35] dark:text-[#D4A77F]">
                      Dynamic UPI QR Integrated
                    </span>
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Zero math, automated GST slab calculator and one-click WhatsApp dispatch</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bill Summary */}
                <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <div>
                      <div className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">Customer: Anita Sharma</div>
                      <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8]">+91 98201 44521 · VIP Tier 2</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#D4A77F]">#INV-2026-1042</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#1F2937] dark:text-[#FFFFFF]">
                      <span>Balayage Color Touchup</span>
                      <span className="font-mono">₹1,800.00</span>
                    </div>
                    <div className="flex justify-between text-[#6B7280] dark:text-[#A0A8B8]">
                      <span>CGST (9%)</span>
                      <span className="font-mono">₹162.00</span>
                    </div>
                    <div className="flex justify-between text-[#6B7280] dark:text-[#A0A8B8]">
                      <span>SGST (9%)</span>
                      <span className="font-mono">₹162.00</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#E5E7EB] dark:border-[#2A2F3A] font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">
                      <span>Grand Total</span>
                      <span className="text-[#10B981] font-mono">₹2,124.00</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <span className="p-2 rounded-xl border-2 border-[#10B981] bg-[#10B981]/10 text-center font-bold text-xs text-[#10B981] cursor-pointer">
                      UPI QR
                    </span>
                    <span className="p-2 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F8F9FA] dark:bg-[#1C2230] text-center font-bold text-xs text-[#6B7280] dark:text-[#A0A8B8] cursor-pointer">
                      Cash
                    </span>
                    <span className="p-2 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-[#F8F9FA] dark:bg-[#1C2230] text-center font-bold text-xs text-[#6B7280] dark:text-[#A0A8B8] cursor-pointer">
                      Card / POS
                    </span>
                  </div>
                </div>

                {/* Instant Dynamic QR */}
                <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-32 h-32 rounded-2xl bg-[#080B12] p-2 flex items-center justify-center border-2 border-[#D4A77F]">
                    <div className="w-full h-full bg-white rounded-xl p-2 flex flex-col items-center justify-center">
                      <div className="text-[10px] font-black tracking-tighter text-black">STUDIODESK UPI</div>
                      <div className="text-[32px] leading-none my-1">🏁</div>
                      <div className="text-[9px] font-mono font-bold text-black">SCAN TO PAY ₹2,124</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">Auto-Reconciles Upon Payment</div>
                    <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Triggers WhatsApp receipt in under 2 seconds</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WHATSAPP RECEIPT */}
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
                      📄 View &amp; Download Digital PDF Receipt
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
              <span>100% Conflict-Free Roster</span>
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#D4A77F]" />
              <span>99.9% Uptime · Multi-Stylist Tracking</span>
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
              href="/register-salon"
              className="text-center px-3.5 py-1.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-black text-xs shadow-xs transition-all"
            >
              Start 7-Day Free Trial ➔
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
