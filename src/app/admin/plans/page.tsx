'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Calendar,
  Sparkles,
  Zap,
  Check,
  Edit2,
  Clock,
  ShieldCheck,
  Power,
  Scissors,
  MessageSquare,
  Lock,
  Layers,
  X,
  Trash2,
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  yearly_price?: number;
  billing_interval: 'monthly' | 'yearly';
  features: string[];
  max_staff: number;
  limits?: {
    max_staff?: number;
    max_services?: number;
    wa_per_month?: number;
  };
  flags?: Record<string, boolean>;
  is_popular: boolean;
  is_active: boolean;
  sort_order?: number;
  active_salons_count?: number;
  created_at: string;
}

interface PlanStats {
  active_trials_count: number;
  expired_trials_count: number;
  active_paid_count: number;
  total_salons_count: number;
}

const ALL_FLAGS: { key: string; label: string; desc: string; category: string }[] = [
  { key: 'logo_upload', label: 'Custom Logo Upload', desc: 'Allow salon to upload brand logo on receipts & portal', category: 'General' },
  { key: 'commission_report', label: 'Staff Commission & Payroll', desc: 'Auto-compute stylist earnings and commission sheets', category: 'Staff & Payroll' },
  { key: 'memberships', label: 'VIP Memberships & Packages', desc: 'Create prepaid discount passes & client loyalty tiers', category: 'Marketing' },
  { key: 'calendar_view', label: 'Calendar Grid View', desc: 'Visual timeline view for staff and chair bookings', category: 'Operations' },
  { key: 'customer_cancel', label: 'Customer Reschedule / Cancel', desc: 'Permit clients to manage their appointments online', category: 'Operations' },
  { key: 'export', label: 'Excel / CSV Data Export', desc: 'Download invoices, reports, and customer profiles', category: 'Data & Reporting' },
  { key: 'coupons', label: 'Promotional Coupons', desc: 'Generate discount codes for festival campaigns', category: 'Marketing' },
  { key: 'reviews', label: 'Client Feedback & Reviews', desc: 'Collect Google/custom ratings after appointment billing', category: 'Marketing' },
  { key: 'loyalty', label: 'Loyalty Reward Points', desc: 'Auto-credit points for customer bill totals', category: 'Marketing' },
  { key: 'custom_domain', label: 'Custom Domain Mapping', desc: 'Host on custom salon domain (requires verified DNS)', category: 'Enterprise' },
  { key: 'multi_branch', label: 'Multi-Branch Support', desc: 'Manage multiple branches under single owner entity', category: 'Enterprise' },
  { key: 'priority_support', label: '24/7 Priority Support', desc: 'Direct WhatsApp hotline & dedicated account manager', category: 'Support' },
];

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('999');
  const [yearlyPrice, setYearlyPrice] = useState('9990');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [maxStaff, setMaxStaff] = useState('10');
  const [maxServices, setMaxServices] = useState('100');
  const [waPerMonth, setWaPerMonth] = useState('200');
  const [sortOrder, setSortOrder] = useState('1');
  const [isPopular, setIsPopular] = useState(false);
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  async function fetchPlans() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      if (res.ok) {
        setPlans(data.plans || []);
        setStats(data.stats || null);
      } else {
        setError(data.error || 'Failed to load plans');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching plans');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  // Lock body scroll when modal is open so background does not scroll
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  function handleOpenCreate() {
    setEditingPlan(null);
    setName('');
    setPrice('999');
    setYearlyPrice('9990');
    setBillingInterval('monthly');
    setDescription('Comprehensive salon management tier.');
    setFeaturesText(
      'Up to 10 Stylists & Staff\nUp to 100 Services in Catalog\n200 WhatsApp Messages / month\nStaff Commission Payroll\nMemberships & Packages\nCalendar Grid View\nData Export'
    );
    setMaxStaff('10');
    setMaxServices('100');
    setMaxWa('200');
    setSortOrder('1');
    setIsPopular(false);

    const defaultFlags: Record<string, boolean> = {};
    ALL_FLAGS.forEach((f) => {
      defaultFlags[f.key] = ['logo_upload', 'commission_report', 'memberships', 'calendar_view', 'customer_cancel', 'export', 'coupons'].includes(f.key);
    });
    setFlags(defaultFlags);
    setIsModalOpen(true);
  }

  function setMaxWa(val: string) {
    setWaPerMonth(val);
  }

  function handleOpenEdit(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(String(plan.price));
    setYearlyPrice(String(plan.yearly_price || Number(plan.price) * 10));
    setBillingInterval(plan.billing_interval);
    setDescription(plan.description || '');
    setFeaturesText(Array.isArray(plan.features) ? plan.features.join('\n') : '');
    setMaxStaff(String(plan.limits?.max_staff ?? plan.max_staff ?? 10));
    setMaxServices(String(plan.limits?.max_services ?? 100));
    setWaPerMonth(String(plan.limits?.wa_per_month ?? 200));
    setSortOrder(String(plan.sort_order ?? 0));
    setIsPopular(Boolean(plan.is_popular));

    const curFlags: Record<string, boolean> = {};
    ALL_FLAGS.forEach((f) => {
      curFlags[f.key] = Boolean(plan.flags?.[f.key]);
    });
    setFlags(curFlags);
    setIsModalOpen(true);
  }

  function handleToggleFlag(key: string) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedFeatures = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const limits = {
        max_staff: Number(maxStaff),
        max_services: Number(maxServices),
        wa_per_month: Number(waPerMonth),
      };

      const payload = {
        name,
        price: Number(price),
        yearly_price: Number(yearlyPrice),
        billing_interval: billingInterval,
        description,
        features: parsedFeatures,
        max_staff: Number(maxStaff),
        limits,
        flags,
        is_popular: isPopular,
        sort_order: Number(sortOrder) || 0,
      };

      let res;
      if (editingPlan) {
        res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save plan');
      }

      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Error saving plan');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(plan: SubscriptionPlan) {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeletePlan(plan: SubscriptionPlan) {
    if (!window.confirm(`Are you sure you want to permanently delete plan "${plan.name}" from the database?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      let res = await fetch(`/api/admin/plans/${plan.id}`, { method: 'DELETE' });
      let data = await res.json();

      if (res.status === 409 && data.requires_force) {
        const forceDelete = window.confirm(
          `Notice: ${data.active_salons_count} salon(s) are currently attached to this plan.\n\nDo you want to unlink those salons and PERMANENTLY delete this plan from the database?`
        );
        if (forceDelete) {
          res = await fetch(`/api/admin/plans/${plan.id}?force=true`, { method: 'DELETE' });
          data = await res.json();
        } else {
          return;
        }
      }

      if (res.ok) {
        alert(data.message || 'Plan permanently deleted from database.');
        fetchPlans();
      } else {
        alert(data.error || 'Failed to delete plan.');
      }
    } catch (err: any) {
      alert(`Error deleting plan: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-pink-600">
            Platform Monetization
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
            Subscription Plans & Limits Engine
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">
            Configure SaaS tiers, server-side limits (staff, services, WhatsApp), and 12-feature gate flags
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A77F] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#D4A77F] text-white font-extrabold text-xs shadow-md shadow-pink-900/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A]/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] uppercase tracking-wider">
              Paid Subscribers
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1F2937] dark:text-[#FFFFFF]">
            {stats?.active_paid_count || 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            Active Paid Salons
          </span>
        </div>

        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A]/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] uppercase tracking-wider">
              7-Day Trials Active
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1F2937] dark:text-[#FFFFFF]">
            {stats?.active_trials_count || 0}
          </div>
          <span className="text-[11px] text-purple-600 font-semibold mt-0.5 block">
            Evaluating Trial Period
          </span>
        </div>

        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A]/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] uppercase tracking-wider">
              Expired Trials
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D4A77F]/15 text-[#D4A77F] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1F2937] dark:text-[#FFFFFF]">
            {stats?.expired_trials_count || 0}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
            Access Locked (Paywall)
          </span>
        </div>

        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A]/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] uppercase tracking-wider">
              Total Workspaces
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1F2937] dark:text-[#FFFFFF]">
            {stats?.total_salons_count || 0}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
            Registered Salons
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-[#D4A77F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#6B7280] dark:text-[#A0A8B8]">Loading subscription plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1F2937] dark:text-[#FFFFFF]">No subscription plans configured</h3>
          <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">Create your first plan to start charging salons.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const enabledFlagsCount = ALL_FLAGS.filter((f) => Boolean(plan.flags?.[f.key])).length;
            const staffLim = plan.limits?.max_staff === 0 ? 'Unlimited' : `${plan.limits?.max_staff || plan.max_staff || 3} Staff`;
            const servicesLim = plan.limits?.max_services === 0 ? 'Unlimited' : `${plan.limits?.max_services || 30} Services`;
            const waLim = plan.limits?.wa_per_month === 0 ? '0 WA/mo' : `${plan.limits?.wa_per_month || 200} WA/mo`;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl border-2 transition-all p-6 flex flex-col justify-between shadow-xs ${
                  plan.is_popular
                    ? 'border-[#D4A77F] ring-4 ring-pink-50 shadow-md'
                    : 'border-slate-200'
                } ${!plan.is_active ? 'opacity-60 bg-slate-50' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg text-[#1F2937] dark:text-[#FFFFFF]">{plan.name}</h3>
                      {plan.is_popular && (
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#D4A77F] text-[10px] font-black uppercase">
                          Popular
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        plan.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-[#6B7280] dark:text-[#A0A8B8]'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mb-3 min-h-[32px]">
                    {plan.description || 'Standard salon subscription plan'}
                  </p>

                  <div className="mb-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-black text-[#1F2937] dark:text-[#FFFFFF]">
                        ₹{Number(plan.price).toLocaleString()}
                      </span>
                      <span className="text-xs text-[#6B7280] dark:text-[#A0A8B8] ml-1">/mo</span>
                      {plan.yearly_price && (
                        <span className="block text-[11px] text-emerald-600 font-bold">
                          ₹{Number(plan.yearly_price).toLocaleString()} /year
                        </span>
                      )}
                    </div>

                    {/* Subscriber Count */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-[#9CA3AF] dark:text-[#747D8D] block">Subscribers</span>
                      <span className="text-lg font-black text-purple-700">
                        {plan.active_salons_count || 0} Salons
                      </span>
                    </div>
                  </div>

                  {/* Resource Limits Badge */}
                  <div className="bg-slate-50 rounded-2xl p-3 mb-4 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280] dark:text-[#A0A8B8]">Staff Limit:</span>
                      <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-bold">{staffLim}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280] dark:text-[#A0A8B8]">Services Limit:</span>
                      <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-bold">{servicesLim}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280] dark:text-[#A0A8B8]">WhatsApp Quota:</span>
                      <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-bold">{waLim}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[#6B7280] dark:text-[#A0A8B8]">Active Flags:</span>
                      <strong className="text-emerald-700 font-bold">{enabledFlagsCount} of {ALL_FLAGS.length} enabled</strong>
                    </div>
                  </div>

                  {/* Human-readable feature bullets */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    {(Array.isArray(plan.features) ? plan.features : []).slice(0, 5).map((feat, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-[#6B7280] dark:text-[#A0A8B8] truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                    {(Array.isArray(plan.features) ? plan.features.length : 0) > 5 && (
                      <span className="text-[10px] text-[#9CA3AF] dark:text-[#747D8D] font-bold block pt-1">
                        +{(plan.features.length - 5)} more features
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(plan)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1F2937] dark:text-[#FFFFFF] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Plan & Gates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(plan)}
                    title={plan.is_active ? 'Deactivate Plan' : 'Activate Plan'}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      plan.is_active
                        ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        : 'border-slate-200 text-[#9CA3AF] dark:text-[#747D8D] hover:bg-slate-100'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan)}
                    title="Delete Plan Permanently"
                    className="p-2 rounded-xl border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Plan Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#080B12]/80 backdrop-blur-xs p-4 sm:p-6 animate-fade-in">
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="relative z-10 bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[85vh] min-h-0 flex flex-col my-auto text-left animate-scale-in">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                <div>
                  <h3 className="text-lg font-black text-[#1F2937] dark:text-[#FFFFFF]">
                    {editingPlan ? `Edit Subscription Plan: ${editingPlan.name}` : 'Create New Subscription Plan'}
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                    Set prices, resource limits (0 = unlimited), and server-side feature access flags
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#9CA3AF] dark:text-[#747D8D] hover:text-[#1F2937] dark:text-[#FFFFFF] hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4 overflow-y-auto min-h-0 pr-1.5 flex-1">
              {/* Plan Name & Popular Flag */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pro Studio"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>

                <div className="flex items-center sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF]">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="w-4 h-4 text-[#D4A77F] rounded border-slate-300 focus:ring-[#D4A77F]"
                    />
                    <span>Highlight as Popular</span>
                  </label>
                </div>
              </div>

              {/* Monthly Price & Yearly Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-1">
                    Monthly Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-1">
                    Yearly Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              </div>

              {/* Description & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Ideal for expanding multi-chair salons"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    placeholder="1, 2, 3..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              </div>

              {/* Resource Limits (0 = Unlimited) */}
              <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-3">
                <div className="text-xs font-black uppercase text-[#1F2937] dark:text-[#FFFFFF] tracking-wider">
                  Resource Limits (0 = Unlimited)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] mb-1">
                      Max Staff (Stylists)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={maxStaff}
                      onChange={(e) => setMaxStaff(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] bg-white"
                    />
                    <span className="text-[10px] text-[#9CA3AF] dark:text-[#747D8D] mt-0.5 block">0 = unlimited</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] mb-1">
                      Max Services Catalog
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={maxServices}
                      onChange={(e) => setMaxServices(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] bg-white"
                    />
                    <span className="text-[10px] text-[#9CA3AF] dark:text-[#747D8D] mt-0.5 block">0 = unlimited</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] mb-1">
                      WhatsApp Quota / Month
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={waPerMonth}
                      onChange={(e) => setWaPerMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F] bg-white"
                    />
                    <span className="text-[10px] text-[#9CA3AF] dark:text-[#747D8D] mt-0.5 block">0 = blocked (no WA)</span>
                  </div>
                </div>
              </div>

              {/* 12 Feature Flag Toggles */}
              <div>
                <label className="block text-xs font-black text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-2">
                  Feature Gate Flags (12 Gates)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {ALL_FLAGS.map((f) => {
                    const isChecked = Boolean(flags[f.key]);
                    return (
                      <div
                        key={f.key}
                        onClick={() => handleToggleFlag(f.key)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-pink-50/60 border-pink-300 text-[#1F2937] dark:text-[#FFFFFF]'
                            : 'bg-white border-slate-200 text-[#6B7280] dark:text-[#A0A8B8] hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-xs block truncate leading-tight">
                            {f.label}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF] dark:text-[#747D8D] block truncate">
                            {f.desc}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="w-4 h-4 text-[#D4A77F] rounded border-slate-300 focus:ring-[#D4A77F] shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Display Feature Bullets */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] uppercase tracking-wider mb-1">
                  Marketing Feature Bullets (One per line)
                </label>
                <textarea
                  rows={3}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Unlimited client appointments&#10;10-second GST billing&#10;WhatsApp digital receipts"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              {/* Submit / Cancel / Delete */}
              <div className="flex items-center justify-between gap-2.5 pt-4 mt-2 border-t border-slate-100 shrink-0">
                {editingPlan ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      handleDeletePlan(editingPlan);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Plan</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B7280] dark:text-[#A0A8B8] hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl text-xs font-extrabold bg-[#D4A77F] hover:bg-[#9c0f4e] text-white shadow-md shadow-pink-900/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingPlan ? 'Update Plan & Limits' : 'Create Plan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
