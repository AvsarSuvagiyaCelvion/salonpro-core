'use client';

import { useState, useEffect } from 'react';
import BrandLoader from '@/components/ui/BrandLoader';
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
  Printer,
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
  membership_plan_name?: string | null;
  membership_services_discount?: number | string | null;
  membership_products_discount?: number | string | null;
}

interface ToCollectInvoice {
  id: string;
  number: string;
  receipt_token?: string;
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
      const updatedInv = {
        ...paymentModalInvoice,
        paid_amount: (Number(paymentModalInvoice.paid_amount || 0) + parseFloat(payAmount)).toString(),
      };
      setPaymentModalInvoice(null);
      setWhatsappInvoice(updatedInv);
      setWhatsappSent(false);
      setMessage({ type: 'success', text: 'Payment collected successfully! Ready to dispatch WhatsApp bill.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPaySubmitting(false);
    }
  }

  async function handleSendWhatsappBill(invoice: ToCollectInvoice) {
    try {
      const rawPhone = (invoice.customer_mobile || '').replace(/[^0-9]/g, '');
      const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const receiptLink = `${origin}/b/${invoice.receipt_token || invoice.number}`;
      const total = Number(invoice.total || 0).toLocaleString('en-IN');
      const paid = Number(invoice.paid_amount || invoice.total || 0).toLocaleString('en-IN');

      const msg = [
        `Dear ${invoice.customer_name}, thank you for visiting us today!`,
        `Invoice #: ${invoice.number}`,
        `Total Amount: ₹${total}`,
        `Payment Received: ₹${paid}`,
        `View & Download your official PDF receipt: ${receiptLink}`,
        `We look forward to welcoming you again!`,
      ].join('\n');

      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');

      await fetch('/api/billing/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id }),
      });

      setWhatsappSent(true);
    } catch {
      // Continue
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#141926] p-4 rounded-2xl border border-neutral-200/80 dark:border-[#2A2F3A] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4A77F]/10 text-[#D4A77F] flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 animate-pulse text-[#D4A77F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#1F2937] dark:text-white">
                Live Studio Floor
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Manage client lifecycle from arrival to treatment and checkout
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchLiveData();
            }}
            disabled={refreshing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] hover:bg-neutral-50 dark:hover:bg-[#252C3D] text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer whitespace-nowrap transition-colors"
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
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs shadow-md shadow-[#D4A77F]/20 transition-all cursor-pointer whitespace-nowrap"
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
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="cursor-pointer text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3 COLUMNS WORKSPACE */}
      {loading ? (
        <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200/80 dark:border-[#2A2F3A] p-12">
          <BrandLoader
            message="Loading Live Studio Floor & Active Sessions..."
            submessage="Syncing styling chairs, waiting lounge, and ready checkouts"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ================= COLUMN 1: WAITING AREA ================= */}
        <div className="bg-neutral-50/80 dark:bg-[#10141E] rounded-2xl border border-neutral-200/80 dark:border-[#222838] p-4 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-[#222838] mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h2 className="text-sm font-bold text-[#1F2937] dark:text-white uppercase tracking-wider">
                1. Waiting Area
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {waiting.length} Waiting
            </span>
          </div>

          {waiting.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 dark:text-neutral-500">
              <User className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">Waiting lounge is empty</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                Click "+ Add Customer to Waiting" when a client arrives
              </p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {waiting.map((w) => (
                <div
                  key={w.id}
                  className="bg-white dark:bg-[#141926] p-4 rounded-xl border border-neutral-200/90 dark:border-[#2A2F3A] shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#1F2937] dark:text-white">
                        {w.customer_name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>+91 {w.customer_mobile}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveWaiting(w.id)}
                      className="text-neutral-300 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 cursor-pointer p-1"
                      title="Remove from waiting"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-[#2A2F3A] text-[11px]">
                    <span className="text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(w.created_at)}</span>
                    </span>

                    <button
                      onClick={() => handleStartSession(w.customer_id, w.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <Play className="w-3 h-3 fill-[#080B12]" />
                      <span>Start Session</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= COLUMN 2: IN SERVICE (ACTIVE SESSIONS) ================= */}
        <div className="bg-neutral-50/80 dark:bg-[#10141E] rounded-2xl border border-neutral-200/80 dark:border-[#222838] p-4 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-[#222838] mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h2 className="text-sm font-bold text-[#1F2937] dark:text-white uppercase tracking-wider">
                2. In Service
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {activeSessions.length} Active
            </span>
          </div>

          {activeSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 dark:text-neutral-500">
              <Scissors className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No sessions in progress</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
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
                    className="bg-white dark:bg-[#141926] p-4 rounded-xl border border-neutral-200/90 dark:border-[#2A2F3A] shadow-xs"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between pb-2 border-b border-neutral-100 dark:border-[#2A2F3A]">
                      <div>
                        <div className="font-bold text-sm text-[#1F2937] dark:text-white">
                          {s.customer_name}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                          +91 {s.customer_mobile}
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(s.started_at)}</span>
                      </span>
                    </div>

                    {/* Added Items List */}
                    <div className="py-2.5 space-y-1.5 min-h-[40px]">
                      {s.items.length === 0 ? (
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 py-1">
                          No services or products added yet. Click buttons below.
                        </p>
                      ) : (
                        s.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs bg-neutral-50 dark:bg-[#1C2230] px-2.5 py-1.5 rounded-lg border border-neutral-100 dark:border-[#2A2F3A]"
                          >
                            <div className="truncate mr-2">
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                {item.name}
                              </span>
                              {item.kind === 'service' && item.staff_name && (
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                                  by {item.staff_name}
                                </span>
                              )}
                              {item.kind === 'product' && (
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-medium">
                                  Qty: {item.qty}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-bold text-neutral-900 dark:text-white">
                                ₹{Number(item.unit_price) * Number(item.qty)}
                              </span>
                              <button
                                onClick={() => handleRemoveSessionItem(s.id, item.id)}
                                className="text-neutral-300 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 cursor-pointer p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Running Total & Action Buttons */}
                    <div className="pt-2 border-t border-neutral-100 dark:border-[#2A2F3A] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-500 dark:text-neutral-400">Running Total:</span>
                        <span className="font-black text-sm text-[#1F2937] dark:text-white">
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
                          className="py-1.5 px-2 rounded-lg border border-[#D4A77F]/30 bg-[#D4A77F]/15 dark:bg-[#D4A77F]/10 hover:bg-pink-100/60 dark:hover:bg-[#D4A77F]/20 text-[#D4A77F] font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
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
                          className="py-1.5 px-2 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>+ Product</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setCompleteModalSession(s);
                          if (s.membership_plan_name) {
                            if (Number(s.membership_services_discount) > 0) {
                              setSrvDiscType('percent');
                              setSrvDiscValue(Number(s.membership_services_discount).toString());
                            } else {
                              setSrvDiscType('none');
                              setSrvDiscValue('0');
                            }
                            if (Number(s.membership_products_discount) > 0) {
                              setProdDiscType('percent');
                              setProdDiscValue(Number(s.membership_products_discount).toString());
                            } else {
                              setProdDiscType('none');
                              setProdDiscValue('0');
                            }
                          } else {
                            setSrvDiscType('none');
                            setSrvDiscValue('0');
                            setProdDiscType('none');
                            setProdDiscValue('0');
                          }
                        }}
                        disabled={s.items.length === 0}
                        className="w-full py-2 px-3 rounded-lg bg-[#10141F] dark:bg-[#D4A77F] hover:bg-[#3f2248] dark:hover:bg-[#B8905F] text-white dark:text-[#080B12] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 dark:text-[#080B12]" />
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
        <div className="bg-neutral-50/80 dark:bg-[#10141E] rounded-2xl border border-neutral-200/80 dark:border-[#222838] p-4 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-[#222838] mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-sm font-bold text-[#1F2937] dark:text-white uppercase tracking-wider">
                3. To Collect
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {toCollect.filter((inv) => Number(inv.due_amount) > 0).length} Unsettled
            </span>
          </div>

          {toCollect.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 dark:text-neutral-500">
              <Receipt className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">All invoices settled</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
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
                    className={`p-4 rounded-xl border shadow-2xs transition-all ${
                      isPaid
                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'bg-white dark:bg-[#141926] border-neutral-200/90 dark:border-[#2A2F3A]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs font-mono text-[#D4A77F]">
                            {inv.number}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {isPaid ? 'PAID' : 'DUE'}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-[#1F2937] dark:text-white mt-0.5">
                          {inv.customer_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[#1F2937] dark:text-white">
                          ₹{Number(inv.total).toLocaleString('en-IN')}
                        </div>
                        {Number(inv.discount_amount) > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            -₹{Number(inv.discount_amount)} off
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-[#2A2F3A] flex items-center justify-between text-xs">
                      <div>
                        {!isPaid && (
                          <span className="text-red-600 dark:text-red-400 font-bold text-xs">
                            Due: ₹{Number(inv.due_amount).toLocaleString('en-IN')}
                          </span>
                        )}
                        {isPaid && (
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1">
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
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                          >
                            Collect Payment
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setWhatsappInvoice(inv);
                              setWhatsappSent(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold text-xs border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Send className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
      )}

      {/* ================= MODAL: ADD CUSTOMER TO WAITING ================= */}
      {isWaitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926]">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4A77F]" />
                <span>Add Customer to Waiting Lounge</span>
              </h2>
              <button
                onClick={() => setIsWaitModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddToWaiting} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 touch-scroll">
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={waitMobile}
                  onChange={(e) => handleSearchCustomers(e.target.value)}
                  placeholder="e.g. 9825012345"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-[#D4A77F] outline-none"
                />

                {/* Suggestions Dropdown */}
                {customerSuggestions.length > 0 && (
                  <div className="mt-1 bg-white dark:bg-[#1C2230] border border-neutral-200 dark:border-[#2A2F3A] rounded-xl shadow-lg max-h-36 overflow-y-auto divide-y divide-neutral-100 dark:divide-[#2A2F3A]">
                    {customerSuggestions.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          setWaitMobile(cust.mobile);
                          setWaitName(cust.name);
                          setCustomerSuggestions([]);
                        }}
                        className="w-full p-2 text-left hover:bg-[#D4A77F]/15 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{cust.name}</span>
                        <span className="text-neutral-500 dark:text-neutral-400 font-mono">+91 {cust.mobile}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={waitName}
                  onChange={(e) => setWaitName(e.target.value)}
                  placeholder="e.g. Neha Mehta"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-[#2A2F3A]">
                <button
                  type="button"
                  onClick={() => setIsWaitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2230] rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={waitSubmitting}
                  className="px-5 py-2 text-xs bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926]">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] dark:text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#D4A77F]" />
                <span>Add Service ({serviceModalSession.customer_name})</span>
              </h2>
              <button
                onClick={() => setServiceModalSession(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceToSession} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 touch-scroll">
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Select Service *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (₹{s.price} - {s.duration_min} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Assign Staff / Stylist *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none"
                >
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role_title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-[#2A2F3A]">
                <button
                  type="button"
                  onClick={() => setServiceModalSession(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2230] rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold rounded-xl shadow-md cursor-pointer transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926]">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Add Product ({productModalSession.customer_name})</span>
              </h2>
              <button
                onClick={() => setProductModalSession(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductToSession} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 touch-scroll">
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Select Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} (₹{p.price}) {p.stock <= 0 ? '❌ OUT OF STOCK' : `[In stock: ${p.stock}]`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={productQty}
                  onChange={(e) => setProductQty(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-[#2A2F3A]">
                <button
                  type="button"
                  onClick={() => setProductModalSession(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2230] rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-md cursor-pointer transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-lg w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926] flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#D4A77F]" />
                <span>Complete Session & Apply Discounts</span>
              </h2>
              <button
                onClick={() => setCompleteModalSession(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
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
                <form onSubmit={handleCompleteSession} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 touch-scroll">
                  {/* Items summary */}
                  <div className="bg-neutral-50 dark:bg-[#1C2230] p-3 rounded-xl border border-neutral-200/80 dark:border-[#2A2F3A] text-xs space-y-1">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Services Subtotal:</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{servicesTotal}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Products Subtotal:</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{productsTotal}</span>
                    </div>
                  </div>

                  {/* VIP Membership Banner if active */}
                  {completeModalSession.membership_plan_name && (
                    <div className="bg-gradient-to-r from-amber-50 to-pink-50 dark:from-amber-950/40 dark:to-pink-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 p-2.5 rounded-xl text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold">⭐ VIP Member: {completeModalSession.membership_plan_name}</span>
                        <span className="block text-[11px] text-amber-700 dark:text-amber-300">
                          Auto-applied {completeModalSession.membership_services_discount}% on services & {completeModalSession.membership_products_discount}% on products!
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Services Discount */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Services Discount
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={srvDiscType}
                        onChange={(e: any) => setSrvDiscType(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-[#2A2F3A] outline-none bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white"
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
                          className="col-span-2 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-[#2A2F3A] outline-none bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white font-medium"
                        />
                      )}
                    </div>
                  </div>

                  {/* Products Discount */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Products Discount
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={prodDiscType}
                        onChange={(e: any) => setProdDiscType(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-[#2A2F3A] outline-none bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white"
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
                          className="col-span-2 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-[#2A2F3A] outline-none bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white font-medium"
                        />
                      )}
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="p-3 bg-[#D4A77F]/15 border border-[#D4A77F]/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase">
                        Invoice Total:
                      </span>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        Discounts applied: ₹{(srvDisc + prodDisc).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-2xl font-black text-[#D4A77F]">
                      ₹{grandTotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-[#2A2F3A]">
                    <button
                      type="button"
                      onClick={() => setCompleteModalSession(null)}
                      className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2230] rounded-xl cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={completing}
                      className="px-4 py-2 text-xs bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926] flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Collect Payment ({paymentModalInvoice.number})</span>
              </h2>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 touch-scroll">
              <div className="bg-neutral-50 dark:bg-[#1C2230] p-3 rounded-xl border border-neutral-200/80 dark:border-[#2A2F3A] text-xs space-y-1">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Customer:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{paymentModalInvoice.customer_name}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Invoice Total:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{paymentModalInvoice.total}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Amount Due:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">₹{paymentModalInvoice.due_amount}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
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
                          ? 'border-[#D4A77F] bg-[#D4A77F]/10 text-[#D4A77F] shadow-xs'
                          : 'border-neutral-200 dark:border-[#2A2F3A] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#1C2230]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/12345678 or Cash"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-[#2A2F3A]">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2230] rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-[#e5ddd5] dark:bg-[#0B141A] rounded-2xl border border-neutral-300 dark:border-[#222E35] shadow-2xl max-w-sm w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            {/* WhatsApp Header */}
            <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold">
                  SP
                </div>
                <div>
                  <h3 className="text-xs font-bold leading-tight">Salon Operating System</h3>
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
            <div className="overflow-y-auto flex-1 p-3 sm:p-4 space-y-3 touch-scroll">
              <div className="bg-white dark:bg-[#111B21] rounded-xl p-3.5 shadow-xs text-xs space-y-2 border border-neutral-200/50 dark:border-[#222E35]">
                <p className="font-bold text-[#075e54] dark:text-emerald-400 text-xs">
                  ✨ Official Salon WhatsApp Receipt
                </p>
                <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-[#202C33] text-[11px] font-sans text-neutral-800 dark:text-neutral-200 space-y-1 border border-neutral-200/60 dark:border-[#2A3942] whitespace-pre-line">
                  {`Dear ${whatsappInvoice.customer_name}, thank you for visiting us today!
Invoice #: ${whatsappInvoice.number}
Total Amount: ₹${Number(whatsappInvoice.total || 0).toLocaleString('en-IN')}
Payment Received: ₹${Number(whatsappInvoice.paid_amount || whatsappInvoice.total || 0).toLocaleString('en-IN')}
View & Download your official PDF receipt: ${typeof window !== 'undefined' ? window.location.origin : ''}/b/${whatsappInvoice.receipt_token || whatsappInvoice.number}
We look forward to welcoming you again!`}
                </div>

                <div className="text-right text-[10px] text-neutral-400 flex items-center justify-end gap-1 pt-0.5">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={whatsappSent ? 'text-blue-500 font-bold' : 'text-neutral-400'}>
                    ✓✓
                  </span>
                </div>
              </div>

              {/* Action Buttons: Open Original Bill PDF + Send on WhatsApp */}
              <div className="space-y-2">
                <a
                  href={`/b/${whatsappInvoice.receipt_token || whatsappInvoice.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-[#111B21] hover:bg-neutral-50 dark:hover:bg-[#202C33] text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-300 dark:border-[#222E35] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  <span>📥 Download PDF Bill (to attach in chat) ↗</span>
                </a>

                {whatsappSent ? (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold text-center flex items-center justify-center gap-1.5 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>WhatsApp Bill Sent (Confirmed with Two Blue Ticks ✓✓)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsappBill(whatsappInvoice)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#111B21] hover:bg-neutral-50 dark:hover:bg-[#202C33] text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-300 dark:border-[#222E35] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Resend to Customer on WhatsApp ↗</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendWhatsappBill(whatsappInvoice)}
                    className="w-full py-3 px-4 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Bill to Customer on WhatsApp ➔</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
