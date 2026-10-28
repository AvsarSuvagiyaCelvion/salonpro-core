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
  RotateCcw,
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billing_interval: 'monthly' | 'yearly';
  features: string[];
  max_staff: number;
  is_popular: boolean;
  is_active: boolean;
  active_salons_count?: number;
  created_at: string;
}

interface PlanStats {
  active_trials_count: number;
  expired_trials_count: number;
  active_paid_count: number;
  total_salons_count: number;
}

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
  const [price, setPrice] = useState('1999');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState(
    'Unlimited Stylists & Staff\nWhatsApp Marketing Broadcast Studio\nStaff Commission Payroll\nInstant WhatsApp Digital Bills\nLive Waiting Area Queue'
  );
  const [maxStaff, setMaxStaff] = useState('0');
  const [isPopular, setIsPopular] = useState(false);

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

  function handleOpenCreate() {
    setEditingPlan(null);
    setName('');
    setPrice('1499');
    setBillingInterval('monthly');
    setDescription('Comprehensive salon management package.');
    setFeaturesText(
      'Unlimited Bookings & Calendar\nWhatsApp Digital Invoices\nStaff Commission Tracking\nLive Waiting Area\nAnalytics Reports'
    );
    setMaxStaff('0');
    setIsPopular(false);
    setIsModalOpen(true);
  }

  function handleOpenEdit(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(String(plan.price));
    setBillingInterval(plan.billing_interval);
    setDescription(plan.description || '');
    setFeaturesText(Array.isArray(plan.features) ? plan.features.join('\n') : '');
    setMaxStaff(String(plan.max_staff || 0));
    setIsPopular(Boolean(plan.is_popular));
    setIsModalOpen(true);
  }

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedFeatures = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        name,
        price: Number(price),
        billing_interval: billingInterval,
        description,
        features: parsedFeatures,
        max_staff: Number(maxStaff),
        is_popular: isPopular,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-pink-600">
            Platform Monetization
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            SaaS Subscription Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage pricing tiers, 7-day free trial rules, and salon membership subscriptions
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white font-extrabold text-xs shadow-md shadow-pink-900/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Paid Subscribers
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.active_paid_count || 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            Active Paid Salons
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              7-Day Trials Active
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.active_trials_count || 0}
          </div>
          <span className="text-[11px] text-purple-600 font-semibold mt-0.5 block">
            Evaluating Trial Period
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Expired Trials
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.expired_trials_count || 0}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
            Access Locked (Ready to Convert)
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Workspaces
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.total_salons_count || 0}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
            Registered Salons
          </span>
        </div>
      </div>

      {/* Trial Auto-Expiry Policy Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">
              7-Day Automatic Evaluation Policy
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Every salon that signs up gets exactly <strong>7 calendar days</strong> of free trial.
              When day 7 expires, their portal displays the paywall lockout until an official plan is paid.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            ✓ Auto-Lockout Active
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-[#b3135b] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading subscription plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No subscription plans configured</h3>
          <p className="text-xs text-slate-500 mt-1">Create your first plan to start charging salons.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl border-2 transition-all p-6 flex flex-col justify-between shadow-xs ${
                plan.is_popular
                  ? 'border-[#b3135b] ring-4 ring-pink-50 shadow-md'
                  : 'border-slate-200'
              } ${!plan.is_active ? 'opacity-60 bg-slate-50' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900">{plan.name}</h3>
                    {plan.is_popular && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#b3135b] text-[10px] font-black uppercase">
                        Popular
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      plan.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {plan.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4 min-h-[32px]">
                  {plan.description || 'Standard salon subscription plan'}
                </p>

                <div className="mb-4">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{Number(plan.price).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">
                    /{plan.billing_interval}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4 text-xs flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Active Salons:</span>
                  <span className="font-extrabold text-slate-900">
                    {plan.active_salons_count || 0} Salons
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">
                    Plan Features:
                  </span>
                  {(Array.isArray(plan.features) ? plan.features : []).map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(plan)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Edit Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleActive(plan)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    plan.is_active
                      ? 'border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title={plan.is_active ? 'Disable plan' : 'Enable plan'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Configure price, billing cycle, and feature checklist for salons
            </p>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Plan Name <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Starter Studio, Growth Professional"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#b3135b] outline-none text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price (₹) <span className="text-pink-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1999"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#b3135b] outline-none text-sm text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Billing Interval
                  </label>
                  <select
                    value={billingInterval}
                    onChange={(e: any) => setBillingInterval(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#b3135b] outline-none text-sm text-slate-900 bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Best for busy salons needing multi-chair coordination"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#b3135b] outline-none text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Features (One per line)
                </label>
                <textarea
                  rows={5}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Unlimited Bookings&#10;WhatsApp Bills&#10;Staff Commissions"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#b3135b] outline-none text-xs text-slate-900 font-mono leading-relaxed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Each line appears as a checkmark bullet on the plan card
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-4 h-4 text-[#b3135b] rounded-sm focus:ring-[#b3135b]"
                />
                <label htmlFor="isPopular" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Highlight as &quot;Popular / Recommended&quot; plan
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#b3135b] hover:bg-[#9c0f4e] text-white text-xs font-extrabold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

