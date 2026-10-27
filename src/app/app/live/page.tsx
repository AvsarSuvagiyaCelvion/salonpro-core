'use client';

import { useState, useEffect } from 'react';
import {
  Radio,
  Clock,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Scissors,
  Package,
  Sparkles,
  ArrowRight,
  Receipt,
  RefreshCw,
  Send,
  CreditCard,
  Phone,
  Search,
} from 'lucide-react';

interface WaitingCustomer {
  id: string;
  created_at: string;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
}

interface SessionItem {
  id: string;
  session_id: string;
  kind: 'service' | 'product';
  ref_id: string;
  name: string;
  qty: number;
  unit_price: string | number;
  staff_id: string | null;
  staff_name: string | null;
}

interface ActiveSession {
  id: string;
  started_at: string;
  status: string;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  items: SessionItem[];
}

interface ToCollectInvoice {
  id: string;
  number: string;
  session_id: string;
  subtotal: string | number;
  discount_type: string;
  discount_value: string | number;
  discount_amount: string | number;
  total: string | number;
  paid_amount: string | number;
  due_amount: string | number;
  created_at: string;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
}

interface ServiceOption {
  id: string;
  name: string;
  price: string | number;
  duration_min: number;
}

interface StaffOption {
  id: string;
  name: string;
  role_title: string;
}

interface ProductOption {
  id: string;
  name: string;
  price: string | number;
  stock: number;
}

export default function LiveStudioPage() {
  const [waiting, setWaiting] = useState<WaitingCustomer[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [toCollect, setToCollect] = useState<ToCollectInvoice[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal 1: Add to Waiting
  const [isWaitModalOpen, setIsWaitModalOpen] = useState(false);
  const [waitMobile, setWaitMobile] = useState('');
  const [waitName, setWaitName] = useState('');
  const [waitSubmitting, setWaitSubmitting] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);

  // Modal 2: Add Service to Session
  const [serviceModalSession, setServiceModalSession] = useState<ActiveSession | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Modal 3: Add Product to Session
  const [productModalSession, setProductModalSession] = useState<ActiveSession | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQty, setProductQty] = useState(1);

  // Modal 4: Complete Session
  const [completeModalSession, setCompleteModalSession] = useState<ActiveSession | null>(null);
  const [srvDiscType, setSrvDiscType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [srvDiscValue, setSrvDiscValue] = useState('0');
  const [prodDiscType, setProdDiscType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [prodDiscValue, setProdDiscValue] = useState('0');
  const [completing, setCompleting] = useState(false);

  // Modal 5: Collect Payment
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<ToCollectInvoice | null>(null);
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'card' | 'online'>('upi');
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Modal 6: WhatsApp Bill Preview
  const [whatsappInvoice, setWhatsappInvoice] = useState<ToCollectInvoice | null>(null);
  const [whatsappSent, setWhatsappSent] = useState(false);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  async function fetchLiveData() {
    try {
      const res = await fetch('/api/live');
      const data = await res.json();
      if (res.ok) {
        setWaiting(data.waiting || []);
        setActiveSessions(data.activeSessions || []);
        setToCollect(data.toCollect || []);
        setServices(data.services || []);
        setStaff(data.staff || []);
        setProducts(data.products || []);
      }
    } catch {
      // silent on poll
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // --- Waiting handlers ---
  async function handleSearchCustomers(q: string) {
    setWaitMobile(q);
    if (q.length >= 2) {
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setCustomerSuggestions(data.customers || []);
      } catch {
        setCustomerSuggestions([]);
      }
    } else {
      setCustomerSuggestions([]);
    }
  }

  async function handleAddToWaiting(e: React.FormEvent) {
    e.preventDefault();
    setWaitSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/live/waiting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: waitMobile,
          name: waitName || 'Walk-in Guest',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add customer');

      await fetchLiveData();
      setIsWaitModalOpen(false);
      setWaitMobile('');
      setWaitName('');
      setMessage({ type: 'success', text: 'Customer added to waiting queue' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setWaitSubmitting(false);
    }
  }

  async function handleRemoveWaiting(id: string) {
    try {
      await fetch(`/api/live/waiting/${id}`, { method: 'DELETE' });
      await fetchLiveData();
    } catch {}
  }

  // --- Session handlers ---
  async function handleStartSession(customerId: string, waitingId?: string) {
    setMessage(null);
    try {
      const res = await fetch('/api/live/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, waiting_id: waitingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start session');

      await fetchLiveData();
      setMessage({ type: 'success', text: 'Beauty session started!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleAddServiceToSession(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceModalSession || !selectedServiceId) return;

    try {
      const res = await fetch(`/api/live/sessions/${serviceModalSession.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'service',
          ref_id: selectedServiceId,
          staff_id: selectedStaffId || null,
          qty: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchLiveData();
      setServiceModalSession(null);
      setMessage({ type: 'success', text: 'Service added to session' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleAddProductToSession(e: React.FormEvent) {
    e.preventDefault();
    if (!productModalSession || !selectedProductId) return;

    try {
      const res = await fetch(`/api/live/sessions/${productModalSession.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'product',
          ref_id: selectedProductId,
          qty: Number(productQty),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchLiveData();
      setProductModalSession(null);
      setMessage({ type: 'success', text: 'Product added to session (Stock adjusted on completion)' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleRemoveSessionItem(sessionId: string, itemId: string) {
    try {
      await fetch(`/api/live/sessions/${sessionId}/items/${itemId}`, { method: 'DELETE' });
      await fetchLiveData();
    } catch {}
  }

  async function handleCompleteSession(e: React.FormEvent) {
    e.preventDefault();
    if (!completeModalSession) return;
    setCompleting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/live/sessions/${completeModalSession.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services_discount_type: srvDiscType,
          services_discount_value: parseFloat(srvDiscValue) || 0,
          products_discount_type: prodDiscType,
          products_discount_value: parseFloat(prodDiscValue) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete session');

      await fetchLiveData();
      setCompleteModalSession(null);
      setMessage({
        type: 'success',
        text: `Session completed! Invoice ${data.invoice.number} is now in "To Collect".`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCompleting(false);
    }
  }

  // --- Payment handlers ---
  async function handleProcessPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    setPaySubmitting(true);

    try {
      const res = await fetch('/api/billing/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: paymentModalInvoice.id,
          method: payMethod,
          amount: parseFloat(payAmount),
          reference: payRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchLiveData();
      setPaymentModalInvoice(null);
      setMessage({ type: 'success', text: 'Payment collected successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPaySubmitting(false);
    }
  }

  function formatDuration(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m ago`;
  }

  return (
    <div className="space-y-5">
      {/* Top Studio Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#b3135b] flex items-center justify-center">
            <Radio className="w-5 h-5 animate-pulse text-[#b3135b]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#2a1630]">
                Live Studio Floor
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Manage client lifecycle from arrival to treatment and checkout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchLiveData();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setWaitMobile('');
              setWaitName('');
              setIsWaitModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#b3135b] hover:bg-[#960f4c] text-white text-xs font-semibold shadow-md shadow-[#b3135b]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer to Waiting</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="cursor-pointer text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3 COLUMNS WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ================= COLUMN 1: WAITING AREA ================= */}
        <div className="bg-neutral-50/70 rounded-2xl border border-neutral-200/80 p-4 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h2 className="text-sm font-bold text-[#2a1630] uppercase tracking-wider">
                1. Waiting Area
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {waiting.length} Waiting
            </span>
          </div>

          {waiting.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
              <User className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">Waiting lounge is empty</p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Click "+ Add Customer to Waiting" when a client arrives
              </p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {waiting.map((w) => (
                <div
                  key={w.id}
                  className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#2a1630]">
                        {w.customer_name}
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>+91 {w.customer_mobile}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveWaiting(w.id)}
                      className="text-neutral-300 hover:text-red-500 cursor-pointer"
                      title="Remove from waiting"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 text-[11px]">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(w.created_at)}</span>
                    </span>

                    <button
                      onClick={() => handleStartSession(w.customer_id, w.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b3135b] hover:bg-[#960f4c] text-white font-semibold cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Start Session</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= COLUMN 2: IN SERVICE (ACTIVE SESSIONS) ================= */}
        <div className="bg-neutral-50/70 rounded-2xl border border-neutral-200/80 p-4 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h2 className="text-sm font-bold text-[#2a1630] uppercase tracking-wider">
                2. In Service
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {activeSessions.length} Active
            </span>
          </div>

          {activeSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
              <Scissors className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No sessions in progress</p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Start a session from the waiting queue to begin service
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto">
              {activeSessions.map((s) => {
                const total = s.items.reduce(
                  (acc, item) => acc + Number(item.qty) * Number(item.unit_price),
                  0
                );

                return (
                  <div
                    key={s.id}
                    className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs ring-1 ring-neutral-100"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between pb-2 border-b border-neutral-100">
                      <div>
                        <div className="font-bold text-sm text-[#2a1630]">
                          {s.customer_name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          +91 {s.customer_mobile}
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(s.started_at)}</span>
                      </span>
                    </div>

                    {/* Added Items List */}
                    <div className="py-2.5 space-y-1.5 min-h-[40px]">
                      {s.items.length === 0 ? (
                        <p className="text-[11px] text-neutral-400 italic py-1">
                          No services or products added yet. Click buttons below.
                        </p>
                      ) : (
                        s.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs bg-neutral-50 px-2 py-1.5 rounded-lg border border-neutral-100"
                          >
                            <div className="truncate mr-2">
                              <span className="font-semibold text-neutral-800">
                                {item.name}
                              </span>
                              {item.kind === 'service' && item.staff_name && (
                                <span className="text-[10px] text-neutral-400 block">
                                  by {item.staff_name}
                                </span>
                              )}
                              {item.kind === 'product' && (
                                <span className="text-[10px] text-purple-600 block">
                                  Qty: {item.qty}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-bold text-neutral-900">
                                ₹{Number(item.unit_price) * Number(item.qty)}
                              </span>
                              <button
                                onClick={() => handleRemoveSessionItem(s.id, item.id)}
                                className="text-neutral-300 hover:text-red-500 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Running Total & Action Buttons */}
                    <div className="pt-2 border-t border-neutral-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-500">Running Total:</span>
                        <span className="font-black text-sm text-[#2a1630]">
                          ₹{total.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setServiceModalSession(s);
                            setSelectedServiceId(services[0]?.id || '');
                            setSelectedStaffId(staff[0]?.id || '');
                          }}
                          className="py-1.5 px-2 rounded-lg border border-pink-200 bg-pink-50/50 hover:bg-pink-100/60 text-[#b3135b] font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>+ Service</span>
                        </button>
                        <button
                          onClick={() => {
                            setProductModalSession(s);
                            setSelectedProductId(products[0]?.id || '');
                            setProductQty(1);
                          }}
                          className="py-1.5 px-2 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-purple-700 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>+ Product</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setCompleteModalSession(s);
                          setSrvDiscType('none');
                          setSrvDiscValue('0');
                          setProdDiscType('none');
                          setProdDiscValue('0');
                        }}
                        disabled={s.items.length === 0}
                        className="w-full py-2 px-3 rounded-lg bg-[#2a1630] hover:bg-[#3f2248] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                        <span>Complete Session</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= COLUMN 3: TO COLLECT (INVOICES) ================= */}
        <div className="bg-neutral-50/70 rounded-2xl border border-neutral-200/80 p-4 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-sm font-bold text-[#2a1630] uppercase tracking-wider">
                3. To Collect
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {toCollect.filter((inv) => Number(inv.due_amount) > 0).length} Unsettled
            </span>
          </div>

          {toCollect.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
              <Receipt className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">All invoices settled</p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Completed sessions will appear here for payment settlement
              </p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {toCollect.map((inv) => {
                const isPaid = Number(inv.due_amount) <= 0;

                return (
                  <div
                    key={inv.id}
                    className={`bg-white p-4 rounded-xl border shadow-2xs transition-all ${
                      isPaid ? 'border-emerald-200 bg-emerald-50/20' : 'border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs font-mono text-[#b3135b]">
                            {inv.number}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isPaid ? 'PAID' : 'DUE'}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-[#2a1630] mt-0.5">
                          {inv.customer_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[#2a1630]">
                          ₹{Number(inv.total).toLocaleString('en-IN')}
                        </div>
                        {Number(inv.discount_amount) > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            -₹{Number(inv.discount_amount)} off
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <div>
                        {!isPaid && (
                          <span className="text-red-600 font-bold text-xs">
                            Due: ₹{Number(inv.due_amount).toLocaleString('en-IN')}
                          </span>
                        )}
                        {isPaid && (
                          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid in full</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isPaid ? (
                          <button
                            onClick={() => {
                              setPaymentModalInvoice(inv);
                              setPayAmount(inv.due_amount.toString());
                              setPayMethod('upi');
                              setPayRef('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                          >
                            Collect Payment
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setWhatsappInvoice(inv);
                              setWhatsappSent(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp Bill</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: ADD CUSTOMER TO WAITING ================= */}
      {isWaitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-base font-bold text-[#2a1630] flex items-center gap-2">
                <User className="w-4 h-4 text-[#b3135b]" />
                <span>Add Customer to Waiting Lounge</span>
              </h2>
              <button
                onClick={() => setIsWaitModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddToWaiting} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={waitMobile}
                  onChange={(e) => handleSearchCustomers(e.target.value)}
                  placeholder="e.g. 9825012345"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                />

                {/* Suggestions Dropdown */}
                {customerSuggestions.length > 0 && (
                  <div className="mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-36 overflow-y-auto divide-y divide-neutral-100">
                    {customerSuggestions.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          setWaitMobile(cust.mobile);
                          setWaitName(cust.name);
                          setCustomerSuggestions([]);
                        }}
                        className="w-full p-2 text-left hover:bg-pink-50/50 flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="font-semibold text-neutral-800">{cust.name}</span>
                        <span className="text-neutral-500 font-mono">+91 {cust.mobile}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={waitName}
                  onChange={(e) => setWaitName(e.target.value)}
                  placeholder="e.g. Neha Mehta"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsWaitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={waitSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-[#b3135b] hover:bg-[#960f4c] text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {waitSubmitting ? 'Adding...' : 'Add to Waiting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD SERVICE ================= */}
      {serviceModalSession && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-base font-bold text-[#2a1630] flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#b3135b]" />
                <span>Add Service ({serviceModalSession.customer_name})</span>
              </h2>
              <button
                onClick={() => setServiceModalSession(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceToSession} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select Service *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (₹{s.price} - {s.duration_min} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Assign Staff / Stylist *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none bg-white"
                >
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role_title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setServiceModalSession(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#b3135b] hover:bg-[#960f4c] text-white rounded-xl shadow-md cursor-pointer"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD PRODUCT ================= */}
      {productModalSession && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-base font-bold text-[#2a1630] flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <span>Add Product ({productModalSession.customer_name})</span>
              </h2>
              <button
                onClick={() => setProductModalSession(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductToSession} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Select Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} (₹{p.price}) {p.stock <= 0 ? '❌ OUT OF STOCK' : `[In stock: ${p.stock}]`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={productQty}
                  onChange={(e) => setProductQty(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setProductModalSession(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: COMPLETE SESSION & BILLING ================= */}
      {completeModalSession && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-base font-bold text-[#2a1630] flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#b3135b]" />
                <span>Complete Session & Apply Discounts</span>
              </h2>
              <button
                onClick={() => setCompleteModalSession(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calculate breakdown */}
            {(() => {
              const servicesTotal = completeModalSession.items
                .filter((i) => i.kind === 'service')
                .reduce((a, b) => a + Number(b.qty) * Number(b.unit_price), 0);

              const productsTotal = completeModalSession.items
                .filter((i) => i.kind === 'product')
                .reduce((a, b) => a + Number(b.qty) * Number(b.unit_price), 0);

              let srvDisc = 0;
              if (srvDiscType === 'percent') srvDisc = (servicesTotal * (parseFloat(srvDiscValue) || 0)) / 100;
              if (srvDiscType === 'fixed') srvDisc = parseFloat(srvDiscValue) || 0;

              let prodDisc = 0;
              if (prodDiscType === 'percent') prodDisc = (productsTotal * (parseFloat(prodDiscValue) || 0)) / 100;
              if (prodDiscType === 'fixed') prodDisc = parseFloat(prodDiscValue) || 0;

              const grandTotal = Math.max(0, servicesTotal + productsTotal - srvDisc - prodDisc);

              return (
                <form onSubmit={handleCompleteSession} className="space-y-4 pt-4">
                  {/* Items summary */}
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/80 text-xs space-y-1">
                    <div className="flex justify-between text-neutral-600">
                      <span>Services Subtotal:</span>
                      <span className="font-semibold text-neutral-800">₹{servicesTotal}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Products Subtotal:</span>
                      <span className="font-semibold text-neutral-800">₹{productsTotal}</span>
                    </div>
                  </div>

                  {/* Services Discount */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Services Discount
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={srvDiscType}
                        onChange={(e: any) => setSrvDiscType(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 outline-none bg-white"
                      >
                        <option value="none">No Discount</option>
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed (₹)</option>
                      </select>
                      {srvDiscType !== 'none' && (
                        <input
                          type="number"
                          min="0"
                          placeholder="Value"
                          value={srvDiscValue}
                          onChange={(e) => setSrvDiscValue(e.target.value)}
                          className="col-span-2 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Products Discount */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Products Discount
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={prodDiscType}
                        onChange={(e: any) => setProdDiscType(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 outline-none bg-white"
                      >
                        <option value="none">No Discount</option>
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed (₹)</option>
                      </select>
                      {prodDiscType !== 'none' && (
                        <input
                          type="number"
                          min="0"
                          placeholder="Value"
                          value={prodDiscValue}
                          onChange={(e) => setProdDiscValue(e.target.value)}
                          className="col-span-2 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#2a1630] uppercase">
                        Invoice Total:
                      </span>
                      <div className="text-[11px] text-emerald-700">
                        Discounts applied: ₹{(srvDisc + prodDisc).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-2xl font-black text-[#b3135b]">
                      ₹{grandTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setCompleteModalSession(null)}
                      className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={completing}
                      className="px-4 py-2 text-xs font-semibold bg-[#b3135b] hover:bg-[#960f4c] text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {completing ? 'Generating Bill...' : 'Complete & Generate Invoice'}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ================= MODAL: PROCESS PAYMENT ================= */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-base font-bold text-[#2a1630] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Collect Payment ({paymentModalInvoice.number})</span>
              </h2>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 pt-4">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs space-y-1">
                <div className="flex justify-between text-neutral-600">
                  <span>Customer:</span>
                  <span className="font-semibold text-neutral-800">{paymentModalInvoice.customer_name}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Invoice Total:</span>
                  <span className="font-semibold text-neutral-800">₹{paymentModalInvoice.total}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Amount Due:</span>
                  <span className="font-bold text-red-600">₹{paymentModalInvoice.due_amount}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['upi', 'cash', 'card', 'online'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`py-2 text-xs font-semibold uppercase rounded-xl border transition-all cursor-pointer ${
                        payMethod === m
                          ? 'border-[#b3135b] bg-pink-50 text-[#b3135b] shadow-xs'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/12345678 or Cash"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {paySubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: WHATSAPP BILL PREVIEW ================= */}
      {whatsappInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#e5ddd5] rounded-2xl border border-neutral-300 shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95">
            {/* WhatsApp Header */}
            <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold">
                  GS
                </div>
                <div>
                  <h3 className="text-xs font-bold leading-tight">Glow Studio</h3>
                  <p className="text-[10px] text-emerald-200">Official Salon WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappInvoice(null)}
                className="text-emerald-100 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-3">
              <div className="bg-white rounded-xl p-3.5 shadow-xs text-xs space-y-2 border border-neutral-200/50">
                <p className="font-bold text-[#075e54]">
                  ✨ Glow Studio - Bill Receipt
                </p>
                <p className="text-neutral-700 text-[11px]">
                  Dear <strong>{whatsappInvoice.customer_name}</strong>, thank you for your visit today!
                </p>
                <div className="bg-neutral-50 p-2 rounded-lg text-[10px] space-y-1 font-mono text-neutral-600">
                  <div className="flex justify-between">
                    <span>Invoice:</span>
                    <span className="font-bold">{whatsappInvoice.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(whatsappInvoice.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-1 text-neutral-900 font-bold">
                    <span>Total Paid:</span>
                    <span>₹{whatsappInvoice.total}</span>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 italic text-center pt-1">
                  We look forward to pampering you again soon! 💖
                </p>
                <div className="text-right text-[10px] text-neutral-400 flex items-center justify-end gap-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={whatsappSent ? 'text-blue-500 font-bold' : 'text-neutral-400'}>
                    ✓✓
                  </span>
                </div>
              </div>

              {whatsappSent ? (
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp message marked as Sent (Two Blue Ticks)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setWhatsappSent(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Mark as Sent on WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
