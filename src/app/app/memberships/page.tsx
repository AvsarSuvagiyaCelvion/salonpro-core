'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Package,
  Plus,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  AlertCircle,
  Tag,
  Clock,
  DollarSign,
  Gift,
  Search,
} from 'lucide-react';

interface MembershipPlan {
  id: string;
  name: string;
  services_discount_pct: number;
  products_discount_pct: number;
  price: number;
  validity_days: number;
  active: boolean;
}

interface PackagePlan {
  id: string;
  name: string;
  price: number;
  validity_days: number;
  active: boolean;
  items: { id: string; kind: string; name: string; qty: number }[];
}

interface Subscription {
  id: string;
  customer_id: string;
  kind: string;
  plan_name: string;
  customer_name: string;
  customer_mobile: string;
  starts_on: string;
  expires_on: string;
  amount_paid: number;
  is_active: boolean;
  services_discount_pct?: number;
  products_discount_pct?: number;
}

interface Customer {
  id: string;
  name: string;
  mobile: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

export default function MembershipsPage() {
  const [activeTab, setActiveTab] = useState<'memberships' | 'packages' | 'subscriptions'>('memberships');
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [packagePlans, setPackagePlans] = useState<PackagePlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal 1: Assign to customer
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignCustomerId, setAssignCustomerId] = useState('');
  const [assignKind, setAssignKind] = useState<'membership' | 'package'>('membership');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [assignAmountPaid, setAssignAmountPaid] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Modal 2: Create Plan
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createKind, setCreateKind] = useState<'membership' | 'package'>('membership');
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formValidity, setFormValidity] = useState('365');
  const [formSvcDiscount, setFormSvcDiscount] = useState('15');
  const [formProdDiscount, setFormProdDiscount] = useState('10');
  const [formSelectedServices, setFormSelectedServices] = useState<{ ref_id: string; qty: number }[]>([]);
  const [creating, setCreating] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [plansRes, custRes, svcRes] = await Promise.all([
        fetch('/api/memberships'),
        fetch('/api/customers'),
        fetch('/api/services'),
      ]);

      const plansData = await plansRes.json();
      const custData = await custRes.json();
      const svcData = await svcRes.json();

      setMembershipPlans(plansData.membershipPlans || []);
      setPackagePlans(plansData.packagePlans || []);
      setSubscriptions(plansData.subscriptions || []);
      setCustomers(custData.customers || []);
      setServices(svcData.services || []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load membership and package data' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenAssign(plan?: { id: string; kind: 'membership' | 'package'; price: number }) {
    if (customers.length > 0) setAssignCustomerId(customers[0].id);
    if (plan) {
      setAssignKind(plan.kind);
      setAssignPlanId(plan.id);
      setAssignAmountPaid(plan.price.toString());
    } else {
      setAssignKind('membership');
      if (membershipPlans.length > 0) {
        setAssignPlanId(membershipPlans[0].id);
        setAssignAmountPaid(membershipPlans[0].price.toString());
      }
    }
    setIsAssignModalOpen(true);
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAssigning(true);
    setMessage(null);

    try {
      const res = await fetch('/api/memberships/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: assignCustomerId,
          kind: assignKind,
          plan_id: assignPlanId,
          amount_paid: Number(assignAmountPaid) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign plan');

      await loadData();
      setIsAssignModalOpen(false);
      setMessage({ type: 'success', text: 'Plan assigned to customer! Discounts will auto-apply in sessions.' });
      setTimeout(() => setMessage(null), 4000);
      setActiveTab('subscriptions');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setAssigning(false);
    }
  }

  async function handleCreatePlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      const payload: any = {
        plan_type: createKind,
        name: formName,
        price: Number(formPrice),
        validity_days: parseInt(formValidity, 10),
      };

      if (createKind === 'membership') {
        payload.services_discount_pct = Number(formSvcDiscount);
        payload.products_discount_pct = Number(formProdDiscount);
      } else {
        payload.items = formSelectedServices.map((s) => ({
          kind: 'service',
          ref_id: s.ref_id,
          qty: s.qty,
        }));
      }

      const res = await fetch('/api/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create plan');
      }

      await loadData();
      setIsCreateModalOpen(false);
      setMessage({ type: 'success', text: 'New plan created successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a1630] tracking-tight">
            Memberships & Packages
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            VIP client membership tiers, service bundle packages, and auto-discounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAssign()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#b3135b] hover:bg-[#99104e] text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Assign to Customer</span>
          </button>

          <button
            onClick={() => {
              setFormName('');
              setFormPrice('');
              setFormValidity('365');
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-neutral-200 text-neutral-700 hover:text-neutral-900 text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2 font-medium animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('memberships')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'memberships'
              ? 'border-[#b3135b] text-[#b3135b]'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Membership Tiers ({membershipPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'packages'
              ? 'border-[#b3135b] text-[#b3135b]'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Package Bundles ({packagePlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'subscriptions'
              ? 'border-[#b3135b] text-[#b3135b]'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Subscriptions ({subscriptions.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: MEMBERSHIP TIERS ================= */}
      {activeTab === 'memberships' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {membershipPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-[#b3135b]/40 transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-bl-full pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-pink-50 text-[#b3135b] px-3 py-1 rounded-full border border-pink-100">
                    VIP Plan
                  </span>
                  <span className="text-xs text-neutral-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {plan.validity_days} days
                  </span>
                </div>

                <h3 className="text-xl font-black text-[#2a1630]">{plan.name}</h3>

                <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-neutral-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Services Discount:
                    </span>
                    <span className="font-extrabold text-[#b3135b] text-sm">
                      {plan.services_discount_pct}% OFF
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Gift className="w-3.5 h-3.5 text-purple-500" />
                      Products Discount:
                    </span>
                    <span className="font-extrabold text-purple-700 text-sm">
                      {plan.products_discount_pct}% OFF
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Subscription Fee</span>
                  <span className="text-xl font-black text-[#2a1630]">
                    ₹{Number(plan.price).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAssign({ id: plan.id, kind: 'membership', price: Number(plan.price) })}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all"
                >
                  Assign to Client →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TAB 2: PACKAGE BUNDLES ================= */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packagePlans.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-purple-400/40 transition-all relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">
                    Service Bundle
                  </span>
                  <span className="text-xs text-neutral-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {pkg.validity_days} days
                  </span>
                </div>

                <h3 className="text-xl font-black text-[#2a1630]">{pkg.name}</h3>

                <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Included Treatments & Items
                  </span>
                  <div className="space-y-1.5">
                    {pkg.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-neutral-50 p-2 rounded-xl">
                        <span className="font-semibold text-neutral-800">{it.name}</span>
                        <span className="font-mono text-purple-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-neutral-200">
                          {it.qty}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Package Price</span>
                  <span className="text-xl font-black text-[#2a1630]">
                    ₹{Number(pkg.price).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAssign({ id: pkg.id, kind: 'package', price: Number(pkg.price) })}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all"
                >
                  Assign to Client →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TAB 3: CUSTOMER SUBSCRIPTIONS ================= */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-4">Plan Name</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4 text-center">Benefits</th>
                  <th className="py-4 px-4">Validity Range</th>
                  <th className="py-4 px-4 text-right">Paid</th>
                  <th className="py-4 px-6 text-center">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      No active member subscriptions. Click &quot;Assign to Customer&quot; above.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#2a1630] text-sm">{sub.customer_name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">+91 {sub.customer_mobile}</div>
                      </td>

                      <td className="py-4 px-4 font-bold text-neutral-800">
                        {sub.plan_name}
                      </td>

                      <td className="py-4 px-4">
                        <span className="capitalize font-semibold text-neutral-600">
                          {sub.kind}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {sub.kind === 'membership' ? (
                          <span className="text-[11px] font-bold text-[#b3135b] bg-pink-50 px-2 py-1 rounded-lg border border-pink-100">
                            {sub.services_discount_pct}% Svc / {sub.products_discount_pct}% Prod
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-500 font-medium">Bundled Services</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-neutral-600">
                        {new Date(sub.starts_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' → '}
                        <span className="font-semibold text-neutral-800">
                          {new Date(sub.expires_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right font-extrabold text-[#2a1630]">
                        ₹{Number(sub.amount_paid).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            sub.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-400'
                          }`}
                        >
                          {sub.is_active ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: ASSIGN PLAN TO CUSTOMER ================= */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-5">
              <h2 className="text-lg font-bold text-[#2a1630] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#b3135b]" />
                <span>Assign Plan to Client</span>
              </h2>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Select Customer <span className="text-pink-600">*</span>
                </label>
                <select
                  required
                  value={assignCustomerId}
                  onChange={(e) => setAssignCustomerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (+91 {c.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Plan Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignKind('membership');
                      if (membershipPlans[0]) {
                        setAssignPlanId(membershipPlans[0].id);
                        setAssignAmountPaid(membershipPlans[0].price.toString());
                      }
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      assignKind === 'membership'
                        ? 'bg-[#b3135b] text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    VIP Membership
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignKind('package');
                      if (packagePlans[0]) {
                        setAssignPlanId(packagePlans[0].id);
                        setAssignAmountPaid(packagePlans[0].price.toString());
                      }
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      assignKind === 'package'
                        ? 'bg-[#b3135b] text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    Package Bundle
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Select Specific Plan <span className="text-pink-600">*</span>
                </label>
                <select
                  required
                  value={assignPlanId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setAssignPlanId(id);
                    if (assignKind === 'membership') {
                      const p = membershipPlans.find((m) => m.id === id);
                      if (p) setAssignAmountPaid(p.price.toString());
                    } else {
                      const p = packagePlans.find((m) => m.id === id);
                      if (p) setAssignAmountPaid(p.price.toString());
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                >
                  {assignKind === 'membership'
                    ? membershipPlans.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (₹{m.price} · {m.services_discount_pct}% off)
                        </option>
                      ))
                    : packagePlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.price})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Subscription Fee Paid (₹) <span className="text-pink-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={assignAmountPaid}
                  onChange={(e) => setAssignAmountPaid(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-bold text-[#2a1630] focus:outline-none focus:border-[#b3135b]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-6 py-2.5 text-xs font-bold bg-[#b3135b] hover:bg-[#99104e] text-white rounded-2xl shadow-md disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE PLAN ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-5">
              <h2 className="text-lg font-bold text-[#2a1630]">
                Create New Plan
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setCreateKind('membership')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    createKind === 'membership'
                      ? 'bg-[#b3135b] text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  Membership Plan
                </button>
                <button
                  type="button"
                  onClick={() => setCreateKind('package')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    createKind === 'package'
                      ? 'bg-[#b3135b] text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  Package Plan
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Plan Name <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={createKind === 'membership' ? 'e.g. Platinum VIP Member' : 'e.g. Total Bridal Glow'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Price (₹) <span className="text-pink-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="2999"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-bold focus:outline-none focus:border-[#b3135b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formValidity}
                    onChange={(e) => setFormValidity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                  />
                </div>
              </div>

              {createKind === 'membership' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-pink-50/60 rounded-2xl border border-pink-100">
                  <div>
                    <label className="block text-xs font-bold text-[#b3135b] mb-1">
                      Services Discount %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formSvcDiscount}
                      onChange={(e) => setFormSvcDiscount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm font-bold text-[#b3135b] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-700 mb-1">
                      Products Discount %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formProdDiscount}
                      onChange={(e) => setFormProdDiscount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-sm font-bold text-purple-700 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 text-xs font-bold bg-[#b3135b] hover:bg-[#99104e] text-white rounded-2xl shadow-md disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
