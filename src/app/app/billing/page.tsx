'use client';

import { useState, useEffect } from 'react';
import SkeletonTable from '@/components/ui/SkeletonTable';
import {
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Send,
  Check,
  Calendar,
  Phone,
  FileText,
  DollarSign,
  TrendingUp,
  Eye,
  Printer,
} from 'lucide-react';

interface InvoiceItem {
  name: string;
  qty: number;
  unit_price: string | number;
}

interface Invoice {
  id: string;
  number: string;
  receipt_token?: string;
  customer_name: string;
  customer_mobile: string;
  subtotal: string | number;
  discount_amount: string | number;
  total: string | number;
  paid_amount: string | number;
  due_amount: string | number;
  status: 'paid' | 'partial' | 'pending';
  whatsapp_sent: boolean;
  created_at: string;
  items: InvoiceItem[];
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Payment Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'card' | 'online'>('upi');
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  // WhatsApp Preview Modal
  const [whatsappInvoice, setWhatsappInvoice] = useState<Invoice | null>(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  // Full Receipt View Modal
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchInvoices(page);
  }, [page, search, statusFilter]);

  async function fetchInvoices(targetPage = page) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(targetPage));
      params.set('pageSize', '50');

      const res = await fetch(`/api/billing?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.invoices || []);
        if (data.pagination) {
          setPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.total);
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load invoices' });
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    setPaying(true);

    try {
      const res = await fetch('/api/billing/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: paymentModalInvoice.id,
          method: payMethod,
          amount: parseFloat(payAmount),
          reference: payRef,
          note: payNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchInvoices();
      const updated = {
        ...paymentModalInvoice,
        paid_amount: (Number(paymentModalInvoice.paid_amount || 0) + parseFloat(payAmount)).toString(),
      };
      setPaymentModalInvoice(null);
      setWhatsappInvoice(updated);
      setMessage({ type: 'success', text: 'Payment recorded! Ready to send WhatsApp receipt & bill.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPaying(false);
    }
  }

  async function handleMarkWhatsappSent(invoiceId: string) {
    setSendingWhatsapp(true);
    try {
      // 1. Open real WhatsApp with customer number, exact requested template & digital receipt link
      if (whatsappInvoice) {
        const rawPhone = (whatsappInvoice.customer_mobile || '').replace(/[^0-9]/g, '');
        const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
        const receiptLink = `${window.location.origin}/b/${whatsappInvoice.receipt_token || whatsappInvoice.number}`;
        const total = Number(whatsappInvoice.total || 0).toLocaleString('en-IN');
        const paid = Number(whatsappInvoice.paid_amount || whatsappInvoice.total || 0).toLocaleString('en-IN');

        const msg = [
          `Dear ${whatsappInvoice.customer_name}, thank you for visiting us today!`,
          `Invoice #: ${whatsappInvoice.number}`,
          `Total Amount: ₹${total}`,
          `Payment Received: ₹${paid}`,
          `View & Download your official PDF receipt: ${receiptLink}`,
          `We look forward to welcoming you again!`,
        ].join('\n');

        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }

      // 2. Mark sent in DB
      const res = await fetch('/api/billing/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      if (!res.ok) throw new Error();

      setInvoices((prev) =>
        prev.map((i) => (i.id === invoiceId ? { ...i, whatsapp_sent: true } : i))
      );
      if (whatsappInvoice && whatsappInvoice.id === invoiceId) {
        setWhatsappInvoice({ ...whatsappInvoice, whatsapp_sent: true });
      }
      setMessage({
        type: 'success',
        text: 'Bill opened on WhatsApp & marked as sent (Confirmed with two blue ticks ✓✓)',
      });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update WhatsApp status' });
    } finally {
      setSendingWhatsapp(false);
    }
  }

  // Summary Metrics
  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.total), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + Number(i.paid_amount), 0);
  const totalDue = invoices.reduce((acc, i) => acc + Number(i.due_amount), 0);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage customer bills, settlements, and automated WhatsApp invoice receipts
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#141926] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-[#2A2F3A] shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
            Total Invoiced
          </span>
          <div className="text-2xl font-black text-[#1F2937] dark:text-white mt-1">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-neutral-500 dark:text-[#747D8D] mt-1">
            Across {invoices.length} invoices
          </div>
        </div>

        <div className="bg-white dark:bg-[#141926] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-[#2A2F3A] shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
            Collected Revenue
          </span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settled payments</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#141926] p-4.5 rounded-2xl border border-neutral-200/80 dark:border-[#2A2F3A] shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
            Pending / Due
          </span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            ₹{totalDue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-neutral-500 dark:text-[#747D8D] mt-1">
            Uncollected balance
          </div>
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

      {/* Search & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, client name or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#D4A77F]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {(['all', 'pending', 'partial', 'paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#10141F] dark:bg-[#D4A77F] text-white dark:text-[#080B12] shadow-xs'
                  : 'bg-white dark:bg-[#141926] border border-neutral-200 dark:border-[#2A2F3A] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1C2230]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200/80 dark:border-[#2A2F3A] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={6} columns={8} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-sm">
            No invoices found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 dark:bg-[#10141F] border-b border-neutral-200/80 dark:border-[#2A2F3A] text-neutral-500 dark:text-[#A0A8B8] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Due</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-center">WhatsApp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#2A2F3A]">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'paid';

                  return (
                    <tr key={inv.id} className="hover:bg-[#D4A77F]/10 dark:hover:bg-[#1C2230]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#D4A77F]">
                        {inv.number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-100">
                          {inv.customer_name}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-[#A0A8B8] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>+91 {inv.customer_mobile}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                          {new Date(inv.created_at).toLocaleDateString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-[#A0A8B8] font-mono">
                          {new Date(inv.created_at).toLocaleTimeString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-neutral-900 dark:text-white">
                        ₹{Number(inv.total).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-700 dark:text-emerald-400">
                        ₹{Number(inv.paid_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600 dark:text-red-400">
                        {Number(inv.due_amount) > 0 ? `₹${Number(inv.due_amount).toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            isPaid
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                              : inv.status === 'partial'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40'
                          }`}
                        >
                          {isPaid && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                          <span>{inv.status}</span>
                        </span>
                      </td>
                      {/* WhatsApp status column with blue ticks indicator */}
                      <td className="py-3 px-4 text-center">
                        {inv.whatsapp_sent ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 cursor-pointer"
                            onClick={() => setWhatsappInvoice(inv)}
                            title="Sent on WhatsApp - Click to view preview"
                          >
                            <span className="text-blue-500 font-extrabold text-xs tracking-tighter">✓✓</span>
                            <span>Sent</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-500 dark:text-[#A0A8B8]">
                            Not Sent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setViewInvoice(inv)}
                          className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-[#D4A77F] dark:hover:text-[#D4A77F] hover:bg-[#D4A77F]/10 rounded-lg inline-flex items-center cursor-pointer transition-colors"
                          title="View Full Bill Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {!isPaid && (
                          <button
                            onClick={() => {
                              setPaymentModalInvoice(inv);
                              setPayAmount(inv.due_amount.toString());
                              setPayMethod('upi');
                              setPayRef('');
                              setPayNotes('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Add Payment</span>
                          </button>
                        )}

                        {isPaid && (
                          <button
                            onClick={() => setWhatsappInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold text-xs border border-emerald-300 dark:border-emerald-800/60 shadow-2xs cursor-pointer transition-colors"
                          >
                            <Send className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Send on WhatsApp</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-[#2A2F3A] bg-neutral-50/50 dark:bg-[#10141F]">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Showing page <span className="font-semibold text-neutral-900 dark:text-white">{page}</span> of{' '}
                  <span className="font-semibold text-neutral-900 dark:text-white">{totalPages}</span> ({totalRecords} invoices)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#1C2230] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#1C2230] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= PAYMENT MODAL ================= */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926]">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Process Payment ({paymentModalInvoice.number})</span>
              </h2>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 touch-scroll">
              <div className="bg-neutral-50 dark:bg-[#10141F] p-3 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] text-xs space-y-1">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Client:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">{paymentModalInvoice.customer_name}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Total Amount:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">₹{paymentModalInvoice.total}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Already Paid:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">₹{paymentModalInvoice.paid_amount}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-200 dark:border-[#2A2F3A]">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">Remaining Due:</span>
                  <span className="font-black text-red-600 dark:text-red-400 text-sm">₹{paymentModalInvoice.due_amount}</span>
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
                          : 'border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1C2230]'
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Reference / Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/12345678 or Card auth code"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Settled at counter"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-[#2A2F3A]">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2230] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {paying ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= WHATSAPP PREVIEW MODAL ================= */}
      {whatsappInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-[#e5ddd5] dark:bg-[#0B141A] rounded-2xl border border-neutral-300 dark:border-[#222E35] shadow-2xl max-w-sm w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            {/* WhatsApp Header */}
            <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold ring-1 ring-white/30">
                  SP
                </div>
                <div>
                  <h3 className="text-xs font-bold leading-tight">Salon Operating System</h3>
                  <p className="text-[10px] text-emerald-200">
                    Recipient: +91 {whatsappInvoice.customer_mobile}
                  </p>
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
            <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 touch-scroll">
              <div className="bg-white dark:bg-[#1F2C34] rounded-xl p-3.5 shadow-xs text-xs space-y-2 border border-neutral-200/50 dark:border-[#2A3942]">
                <p className="font-bold text-[#075e54] dark:text-[#25D366] text-sm">
                  ✨ Salon Bill Receipt
                </p>
                <p className="text-neutral-700 dark:text-neutral-200 text-xs">
                  Dear <strong>{whatsappInvoice.customer_name}</strong>, thank you for your visit today!
                </p>

                <div className="bg-neutral-50 dark:bg-[#111B21] p-2.5 rounded-lg text-xs space-y-1.5 font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-[#2A3942]">
                  <div className="flex justify-between">
                    <span>Invoice #:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{whatsappInvoice.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(whatsappInvoice.created_at).toLocaleDateString('en-IN')}</span>
                  </div>

                  {whatsappInvoice.items && whatsappInvoice.items.length > 0 && (
                    <div className="py-1 border-t border-b border-neutral-200/80 dark:border-[#2A3942] space-y-1 my-1">
                      {whatsappInvoice.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span>
                            {item.name} {item.qty > 1 ? `x${item.qty}` : ''}
                          </span>
                          <span>₹{Number(item.unit_price) * Number(item.qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-900 dark:text-white font-bold text-xs pt-0.5">
                    <span>Total Amount:</span>
                    <span className="text-[#D4A77F]">₹{whatsappInvoice.total}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                    <span>Payment Received:</span>
                    <span>₹{whatsappInvoice.paid_amount}</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 text-center pt-1 font-sans">
                  &quot;Thank you for your visit!&quot; 💖
                </p>

                <div className="text-right text-[10px] text-neutral-400 flex items-center justify-end gap-1 pt-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={whatsappInvoice.whatsapp_sent ? 'text-blue-500 font-black' : 'text-neutral-400'}>
                    ✓✓
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200/60 dark:border-[#2A3942] flex gap-2">
                <a
                  href={`/b/${whatsappInvoice.receipt_token || whatsappInvoice.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white dark:bg-[#1F2C34] hover:bg-neutral-50 dark:hover:bg-[#2A3942] text-neutral-800 dark:text-neutral-100 text-xs font-bold border border-neutral-300 dark:border-[#2A3942] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  <span>📥 Download PDF Bill (to attach in chat) ↗</span>
                </a>
              </div>

              {whatsappInvoice.whatsapp_sent ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Bill Sent on WhatsApp (Two Blue Ticks ✓✓)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkWhatsappSent(whatsappInvoice.id)}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#1F2C34] hover:bg-neutral-50 dark:hover:bg-[#2A3942] text-neutral-800 dark:text-neutral-100 text-xs font-bold border border-neutral-300 dark:border-[#2A3942] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Resend to Customer on WhatsApp ↗</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMarkWhatsappSent(whatsappInvoice.id)}
                  disabled={sendingWhatsapp}
                  className="w-full py-3 px-4 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingWhatsapp ? 'Opening WhatsApp...' : 'Send Bill to Customer on WhatsApp ➔'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL: FULL BILL RECEIPT ================= */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926]">
              <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Official Bill Receipt
              </span>
              <button
                onClick={() => setViewInvoice(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto touch-scroll">
              {/* Salon Brand Header */}
              <div className="text-center pb-3 border-b border-dashed border-neutral-200 dark:border-[#2A2F3A]">
                <h2 className="text-xl font-black text-[#1F2937] dark:text-white tracking-tight">
                  SALON BILL RECEIPT
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Authorized Payment Receipt
                </p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Tax Invoice & Client Statement
                </p>
              </div>

              {/* Invoice & Client Info */}
              <div className="bg-neutral-50 dark:bg-[#10141F] p-3 rounded-xl border border-neutral-200/80 dark:border-[#2A2F3A] text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Invoice:</span>
                  <span className="font-bold text-[#D4A77F]">{viewInvoice.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Date & Time:</span>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {new Date(viewInvoice.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(viewInvoice.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Client:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{viewInvoice.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Mobile:</span>
                  <span className="text-neutral-800 dark:text-neutral-200">+91 {viewInvoice.customer_mobile}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-[#2A2F3A]">
                  <span className="text-neutral-500 dark:text-neutral-400">Status:</span>
                  <span className={`font-bold uppercase ${viewInvoice.status === 'paid' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {viewInvoice.status}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-2">
                  Services & Products:
                </div>
                {viewInvoice.items && viewInvoice.items.length > 0 ? (
                  <div className="divide-y divide-neutral-100 dark:divide-[#2A2F3A] text-xs">
                    {viewInvoice.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-neutral-800 dark:text-neutral-100">{item.name}</p>
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                            Qty: {item.qty} × ₹{item.unit_price}
                          </p>
                        </div>
                        <span className="font-bold text-neutral-900 dark:text-white">
                          ₹{Number(item.unit_price) * Number(item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 py-2">
                    Standard Salon Treatment Service
                  </p>
                )}
              </div>

              {/* Bill Totals */}
              <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-[#2A2F3A] space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal:</span>
                  <span className="text-neutral-800 dark:text-neutral-200">₹{viewInvoice.subtotal}</span>
                </div>
                {Number(viewInvoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Discount Applied:</span>
                    <span>-₹{viewInvoice.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-[#1F2937] dark:text-white pt-1 border-t border-neutral-200 dark:border-[#2A2F3A]">
                  <span>Net Bill Total:</span>
                  <span className="text-[#D4A77F]">₹{Number(viewInvoice.total).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>Amount Paid:</span>
                  <span>₹{Number(viewInvoice.paid_amount).toLocaleString('en-IN')}</span>
                </div>
                {Number(viewInvoice.due_amount) > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400 font-bold">
                    <span>Balance Due:</span>
                    <span>₹{Number(viewInvoice.due_amount).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center pt-2">
                &quot;Thank you for your visit!&quot;
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-[#2A2F3A] flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#1C2230] text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="px-4 py-2 text-xs font-semibold bg-[#10141F] dark:bg-[#D4A77F] text-white dark:text-[#080B12] hover:bg-[#3f2248] dark:hover:bg-[#e0b892] rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
