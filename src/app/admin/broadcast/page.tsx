'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Building2,
  Users,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  Square,
  ShieldCheck,
  Loader2,
  X,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { showToast } from '@/lib/toast';

interface SalonItem {
  id: string;
  salon_name: string;
  slug: string;
  phone: string;
  owner_name: string;
  owner_email: string;
  plan: string;
  subscription_status: string;
  is_active: boolean;
  is_trial: boolean;
  trial_days_remaining: number;
}

interface CampaignItem {
  id: string;
  title: string;
  audience_filter: string;
  message_body: string;
  total_recipients: number;
  delivered_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

const ADMIN_TEMPLATES = [
  {
    id: 'trial_reminder',
    name: 'Trial Expiring Soon (Renew Pass)',
    title: 'Trial Expiry & Seamless Upgrade Notice',
    body: '👋 Hi {owner_name}, your 14-day StudioDesk Pro trial for {salon_name} is concluding in 3 days. To keep your online booking, billing POS, and live queue running without interruption, upgrade your plan today at https://studiodeskapp.com/app/subscription. Need help? Reply directly to this message!',
  },
  {
    id: 'new_feature',
    name: 'New Feature Announcement (WhatsApp & Expenses)',
    title: 'New Feature Announcement for Salon Partners',
    body: '🎉 Good news for {salon_name}! We just launched 2 major upgrades on your StudioDesk dashboard: (1) WhatsApp Bulk Marketing to boost client re-visits at zero markup, and (2) Real-Time Petty Cash & Net Profit tracker. Log in now at https://studiodeskapp.com/app to explore!',
  },
  {
    id: 'weekend_tips',
    name: 'Peak Weekend Booking Preparation',
    title: 'Weekend Booking Maximizer Tips',
    body: '✨ Dear {owner_name}, weekend client appointments are surging! Check your stylist duty roster and ensure all services are active on your public booking link at https://studiodeskapp.com/book/{slug}. Have a profitable weekend with StudioDesk!',
  },
];

export default function AdminBroadcastPage() {
  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState<SalonItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    active_paid: 0,
    trial_expiring: 0,
    trial_active: 0,
    inactive: 0,
  });
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);

  // Filter & Selection State
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active_paid' | 'trial_expiring' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form State
  const [title, setTitle] = useState(ADMIN_TEMPLATES[0].title);
  const [messageBody, setMessageBody] = useState(ADMIN_TEMPLATES[0].body);
  const [sending, setSending] = useState(false);
  const [successModal, setSuccessModal] = useState<{ open: boolean; count: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/broadcast');
      if (res.ok) {
        const json = await res.json();
        setSalons(json.salons || []);
        setCounts(json.counts || { all: 0, active_paid: 0, trial_expiring: 0, trial_active: 0, inactive: 0 });
        setCampaigns(json.campaigns || []);

        // Pre-select all matching IDs by default
        const allIds = new Set<string>((json.salons || []).map((s: SalonItem) => s.id));
        setSelectedIds(allIds);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  }

  // Filter salons based on segment and search query
  const filteredSalons = salons.filter((s) => {
    // 1. Audience segment filter
    if (selectedFilter === 'active_paid') {
      if (s.is_trial || s.subscription_status !== 'active') return false;
    } else if (selectedFilter === 'trial_expiring') {
      if (!s.is_trial || s.trial_days_remaining > 3) return false;
    } else if (selectedFilter === 'inactive') {
      if (s.is_active && s.subscription_status !== 'expired') return false;
    }

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.salon_name.toLowerCase().includes(q) ||
        s.owner_name.toLowerCase().includes(q) ||
        s.phone.includes(q);
      if (!match) return false;
    }

    return true;
  });

  function handleSelectAll() {
    if (selectedIds.size === filteredSalons.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSalons.map((s) => s.id)));
    }
  }

  function handleToggleSalon(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handleApplyTemplate(tpl: typeof ADMIN_TEMPLATES[0]) {
    setTitle(tpl.title);
    setMessageBody(tpl.body);
    showToast(`Loaded template: "${tpl.name}"`, 'success');
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !messageBody.trim()) {
      showToast('Please enter broadcast title and message.', 'error');
      return;
    }

    const targetIds = Array.from(selectedIds);
    if (targetIds.length === 0) {
      showToast('Please select at least one salon to receive the broadcast.', 'error');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          audienceFilter: selectedFilter,
          messageBody,
          selectedSalonIds: targetIds,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to dispatch broadcast.');

      setSuccessModal({ open: true, count: json.totalRecipients });
      showToast('WhatsApp Broadcast dispatched successfully to salon owners!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error sending broadcast', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* 1. Header */}
      <div className="bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F]">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              Super Admin WhatsApp Broadcast Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#A0A8B8] mt-1.5 flex items-center gap-2">
            <span>Direct Meta WhatsApp Cloud API Gateway</span>
            <span className="inline-block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Platform-wide Salon Partner Broadcasts
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] hover:bg-neutral-50 dark:hover:bg-[#10141F] text-neutral-600 dark:text-neutral-300 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Target Audience Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { id: 'all', label: 'All Salons', count: counts.all, color: 'text-neutral-900 dark:text-white' },
          { id: 'active_paid', label: 'Active Paid Salons', count: counts.active_paid, color: 'text-emerald-600 dark:text-emerald-400' },
          { id: 'trial_expiring', label: 'Trial Ending in 3d', count: counts.trial_expiring, color: 'text-amber-600 dark:text-amber-400' },
          { id: 'inactive', label: 'Inactive / Expired', count: counts.inactive, color: 'text-rose-600 dark:text-rose-400' },
        ].map((seg) => {
          const isSelected = selectedFilter === seg.id;
          return (
            <button
              key={seg.id}
              onClick={() => {
                setSelectedFilter(seg.id as any);
                // Auto-select all in new segment
                const matches = salons.filter((s) => {
                  if (seg.id === 'active_paid') return !s.is_trial && s.subscription_status === 'active';
                  if (seg.id === 'trial_expiring') return s.is_trial && s.trial_days_remaining <= 3;
                  if (seg.id === 'inactive') return !s.is_active || s.subscription_status === 'expired';
                  return true;
                });
                setSelectedIds(new Set(matches.map((m) => m.id)));
              }}
              className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#D4A77F] bg-[#D4A77F]/10 dark:bg-[#D4A77F]/15 ring-2 ring-[#D4A77F]/20'
                  : 'bg-white dark:bg-[#141926] border-neutral-200 dark:border-[#2A2F3A] hover:bg-neutral-50 dark:hover:bg-[#10141F]'
              }`}
            >
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{seg.label}</div>
              <div className={`text-2xl font-black mt-1 ${seg.color}`}>
                {loading ? '...' : seg.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Main Broadcast Composer & Salon Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Message Composer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSendBroadcast} className="space-y-5">
            {/* Template Selector */}
            <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                Quick Platform Broadcast Templates
              </label>
              <div className="space-y-2">
                {ADMIN_TEMPLATES.map((tpl) => (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full p-2.5 text-left rounded-xl border border-neutral-200 dark:border-[#2A2F3A] hover:border-[#D4A77F] dark:hover:border-[#D4A77F] hover:bg-neutral-50 dark:hover:bg-[#10141F] text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>{tpl.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Details */}
            <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Broadcast Campaign Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Plan Expiry Warning"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-medium focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  WhatsApp Message Body
                </label>
                <textarea
                  rows={6}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  required
                  placeholder="Type broadcast text..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-medium focus:outline-none focus:border-[#D4A77F] resize-none"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Dynamic placeholders: {'{owner_name}'}, {'{salon_name}'}, {'{slug}'}.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-[#2A2F3A] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Selected: {selectedIds.size} salons
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Est. Cost: ₹{(selectedIds.size * 0.85).toFixed(2)}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending || selectedIds.size === 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Broadcast...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right: Salon Partner Directory Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs overflow-hidden">
            {/* Search & Bulk Select Toolbar */}
            <div className="p-4 border-b border-neutral-200 dark:border-[#2A2F3A] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search salon or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-neutral-50 dark:bg-[#10141F] text-neutral-900 dark:text-white focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <button
                type="button"
                onClick={handleSelectAll}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] hover:bg-neutral-50 dark:hover:bg-[#10141F] text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                {selectedIds.size === filteredSalons.length ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Select All ({filteredSalons.length})</span>
                  </>
                )}
              </button>
            </div>

            {/* Salons Table */}
            <div className="overflow-x-auto max-h-[460px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-[#10141F] sticky top-0 border-b border-neutral-200 dark:border-[#2A2F3A] text-neutral-500 font-bold uppercase tracking-wider text-[10px] z-10">
                  <tr>
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-3">Salon & Owner</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-[#2A2F3A]">
                  {filteredSalons.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-400">
                        No salons found in this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSalons.map((s) => {
                      const isChecked = selectedIds.has(s.id);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleToggleSalon(s.id)}
                          className={`cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#D4A77F]/5 dark:bg-[#D4A77F]/10'
                              : 'hover:bg-neutral-50/50 dark:hover:bg-[#10141F]/50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSalon(s.id)}
                              className="w-4 h-4 rounded text-emerald-600 accent-[#D4A77F] cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-neutral-900 dark:text-white">
                              {s.salon_name}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              {s.owner_name} ({s.slug})
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-neutral-600 dark:text-neutral-300">
                            {s.phone || 'No phone'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
                            {s.plan}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {s.is_trial ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Trial ({s.trial_days_remaining}d)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Active Paid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Past Broadcast History */}
      <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-200 dark:border-[#2A2F3A]">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Past Admin Broadcast History
          </h3>
          <p className="text-xs text-neutral-500">
            Audit log of all platform-level WhatsApp messages sent to salon partners
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-[#10141F] border-b border-neutral-200 dark:border-[#2A2F3A] text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5">Broadcast Title</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4 text-center">Salons Delivered</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-[#2A2F3A]">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    No broadcasts sent yet.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3.5 px-5 font-bold text-neutral-900 dark:text-white max-w-sm">
                      <div>{c.title}</div>
                      <div className="text-[11px] text-neutral-400 font-normal truncate mt-0.5">{c.message_body}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-neutral-600 dark:text-neutral-300 capitalize">
                      {c.audience_filter.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                      {c.delivered_count} / {c.total_recipients}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500">
                      {new Date(c.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Modal */}
      {successModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#10141F] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              WhatsApp Broadcast Dispatched!
            </h3>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Your platform broadcast was sent successfully to <strong>{successModal.count} salon partners</strong> via Meta Cloud API Gateway.
            </p>

            <button
              onClick={() => setSuccessModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-black text-xs font-bold cursor-pointer transition-all"
            >
              Done & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
