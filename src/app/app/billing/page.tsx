'use client';

import { useState, useEffect } from 'react';
import SkeletonTable from '@/components/ui/SkeletonTable';
import ReportExportModal from '@/components/reports/ReportExportModal';
import { showToast } from '@/lib/toast';
import { dispatchSmartWhatsAppBill, downloadInvoicePdf } from '@/lib/whatsapp-bill';
import { generateUpiQrDataUrl, buildGPayUrl, buildPhonePeUrl, buildPaytmUrl, buildUpiPayUrl } from '@/lib/upi';
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
  Eye,
  Printer,
  Download,
  Loader2,
  Smartphone,
  Plus,
  Trash2,
  User,
  Scissors,
  Package,
  ArrowRight,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

interface InvoiceItem {
  id?: string;
  name: string;
  kind?: string;
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
  tax_amount?: string | number;
  total: string | number;
  paid_amount: string | number;
  due_amount: string | number;
  status: 'paid' | 'partial' | 'pending';
  whatsapp_sent: boolean;
  created_at: string;
  items: InvoiceItem[];
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  category?: string;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
  stock?: number;
}

interface CustomerOption {
  id: string;
  name: string;
  mobile: string;
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

  // Settlement Payment Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'card' | 'online'>('upi');
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  // WhatsApp Preview Modal
  const [whatsappInvoice, setWhatsappInvoice] = useState<Invoice | null>(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Full Minimalist Invoice View Modal
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // Salon UPI & Branding Info
  const [salonInfo, setSalonInfo] = useState<{
    upi_id?: string;
    upi_number?: string;
    upi_qr_url?: string;
    name?: string;
    phone?: string;
    address?: string;
    logo_url?: string;
  } | null>(null);
  const [dynamicUpiQrUrl, setDynamicUpiQrUrl] = useState<string | null>(null);

  // ================= NEW INVOICE POS CREATOR STATE =================
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [catalogServices, setCatalogServices] = useState<ServiceOption[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<ProductOption[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<CustomerOption[]>([]);

  // POS Form
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerMobile, setPosCustomerMobile] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [posItems, setPosItems] = useState<InvoiceItem[]>([
    { name: '', kind: 'service', qty: 1, unit_price: '' },
  ]);
  const [posDiscountType, setPosDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [posDiscountValue, setPosDiscountValue] = useState<string>('0');
  const [posTaxRate, setPosTaxRate] = useState<number>(18); // Default 18% GST (9% CGST + 9% SGST)
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [posPaidAmount, setPosPaidAmount] = useState<string>('');
  const [posPaymentRef, setPosPaymentRef] = useState<string>('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (message) {
      showToast(message.text, message.type);
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    async function loadSalonSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.salon) {
            setSalonInfo({
              upi_id: data.salon.upi_id || '',
              upi_number: data.salon.upi_number || '',
              upi_qr_url: data.salon.upi_qr_url || '',
              name: data.salon.name || 'Salon',
              phone: data.salon.phone || '',
              address: data.salon.address || '',
              logo_url: data.salon.logo_url || '',
            });
          }
        }
      } catch {}
    }
    loadSalonSettings();
  }, []);

  // Fetch catalog services, products, and customers when create modal opens
  useEffect(() => {
    if (createModalOpen) {
      async function loadCatalog() {
        try {
          const [servRes, prodRes, custRes] = await Promise.all([
            fetch('/api/services'),
            fetch('/api/products'),
            fetch('/api/customers'),
          ]);
          if (servRes.ok) {
            const d = await servRes.json();
            setCatalogServices(d.services || []);
          }
          if (prodRes.ok) {
            const d = await prodRes.json();
            setCatalogProducts(d.products || []);
          }
          if (custRes.ok) {
            const d = await custRes.json();
            setExistingCustomers(d.customers || []);
          }
        } catch {}
      }
      loadCatalog();
    }
  }, [createModalOpen]);

  // Generate dynamic QR for payment modal
  useEffect(() => {
    async function updateDynamicQr() {
      if (salonInfo?.upi_id && paymentModalInvoice && payMethod === 'upi') {
        const targetAmount = Number(payAmount) > 0 ? Number(payAmount) : Number(paymentModalInvoice.due_amount);
        try {
          const qrDataUrl = await generateUpiQrDataUrl({
            upiId: salonInfo.upi_id,
            name: salonInfo.name || 'Salon',
            amount: targetAmount,
            note: `Bill ${paymentModalInvoice.number}`,
          });
          setDynamicUpiQrUrl(qrDataUrl);
        } catch {
          setDynamicUpiQrUrl(null);
        }
      } else {
        setDynamicUpiQrUrl(null);
      }
    }
    updateDynamicQr();
  }, [salonInfo, paymentModalInvoice, payMethod, payAmount]);

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

  // POS Calculations
  const posSubtotal = posItems.reduce((acc, item) => {
    const qty = Math.max(1, item.qty || 1);
    const price = Math.max(0, parseFloat(String(item.unit_price)) || 0);
    return acc + qty * price;
  }, 0);

  let posDiscountAmount = 0;
  const numDiscVal = Math.max(0, parseFloat(posDiscountValue) || 0);
  if (posDiscountType === 'percent') {
    posDiscountAmount = (posSubtotal * Math.min(100, numDiscVal)) / 100;
  } else if (posDiscountType === 'fixed') {
    posDiscountAmount = Math.min(posSubtotal, numDiscVal);
  }

  const posTaxableSubtotal = Math.max(0, posSubtotal - posDiscountAmount);
  const posTaxAmount = (posTaxableSubtotal * (posTaxRate || 0)) / 100;
  const posGrandTotal = Math.round((posTaxableSubtotal + posTaxAmount) * 100) / 100;

  // Sync paid amount default
  useEffect(() => {
    if (posGrandTotal > 0 && !posPaidAmount) {
      setPosPaidAmount(posGrandTotal.toFixed(2));
    }
  }, [posGrandTotal, posPaidAmount]);

  function handleAddPosItem(type: 'service' | 'product', refItem?: any) {
    if (refItem) {
      setPosItems((prev) => [
        ...prev.filter((it) => it.name.trim() !== ''),
        {
          id: refItem.id,
          name: refItem.name,
          kind: type,
          qty: 1,
          unit_price: refItem.price,
        },
      ]);
    } else {
      setPosItems((prev) => [
        ...prev,
        { name: '', kind: type, qty: 1, unit_price: '' },
      ]);
    }
  }

  function handleRemovePosItem(index: number) {
    setPosItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ name: '', kind: 'service', qty: 1, unit_price: '' }]));
  }

  function handleUpdatePosItem(index: number, field: keyof InvoiceItem, value: any) {
    setPosItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  }

  async function handleCreateInvoiceSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = posItems.filter(
      (it) => it.name.trim() !== '' && Number(it.unit_price) >= 0
    );

    if (validItems.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one line item with a valid price.' });
      return;
    }

    setCreatingInvoice(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          customerName: posCustomerName.trim() || 'Valued Client',
          customerMobile: posCustomerMobile.trim(),
          items: validItems,
          discountType: posDiscountType,
          discountValue: numDiscVal,
          taxRate: posTaxRate,
          paymentMethod: posPaymentMethod,
          paidAmount: parseFloat(posPaidAmount) || 0,
          paymentReference: posPaymentRef.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      setMessage({ type: 'success', text: `Invoice ${data.invoice.number} created successfully!` });
      setCreateModalOpen(false);
      // Reset form
      setPosCustomerName('');
      setPosCustomerMobile('');
      setSelectedCustomerId(null);
      setPosItems([{ name: '', kind: 'service', qty: 1, unit_price: '' }]);
      setPosDiscountType('none');
      setPosDiscountValue('0');
      setPosPaidAmount('');
      setPosPaymentRef('');

      await fetchInvoices();
      // Instantly open the view modal for immediate preview/print
      setViewInvoice(data.invoice);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating invoice' });
    } finally {
      setCreatingInvoice(false);
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
        due_amount: Math.max(0, Number(paymentModalInvoice.due_amount) - parseFloat(payAmount)).toString(),
      };
      setPaymentModalInvoice(null);
      setWhatsappInvoice(updated);
      setMessage({ type: 'success', text: 'Payment recorded! Ready to dispatch WhatsApp bill.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPaying(false);
    }
  }

  async function handleMarkWhatsappSent(invoiceId: string) {
    setSendingWhatsapp(true);
    try {
      if (whatsappInvoice) {
        const shareResult = await dispatchSmartWhatsAppBill({
          id: whatsappInvoice.id,
          number: whatsappInvoice.number,
          receipt_token: whatsappInvoice.receipt_token,
          customer_name: whatsappInvoice.customer_name,
          customer_mobile: whatsappInvoice.customer_mobile,
          subtotal: whatsappInvoice.subtotal,
          discount_amount: whatsappInvoice.discount_amount,
          tax_amount: whatsappInvoice.tax_amount,
          total: whatsappInvoice.total,
          paid_amount: whatsappInvoice.paid_amount,
          created_at: whatsappInvoice.created_at,
          items: whatsappInvoice.items,
          salon_name: salonInfo?.name,
          salon_phone: salonInfo?.phone,
          salon_address: salonInfo?.address,
          salon_upi_id: salonInfo?.upi_id,
          logo_url: salonInfo?.logo_url,
        });

        if (shareResult.success) {
          setInvoices((prev) =>
            prev.map((i) => (i.id === invoiceId ? { ...i, whatsapp_sent: true } : i))
          );
          if (whatsappInvoice && whatsappInvoice.id === invoiceId) {
            setWhatsappInvoice({ ...whatsappInvoice, whatsapp_sent: true });
          }
          setMessage({
            type: 'success',
            text: shareResult.message,
          });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to dispatch WhatsApp bill' });
    } finally {
      setSendingWhatsapp(false);
    }
  }

  async function handleDownloadPdfClick(inv: Invoice) {
    setDownloadingPdf(true);
    try {
      const ok = await downloadInvoicePdf({
        id: inv.id,
        number: inv.number,
        receipt_token: inv.receipt_token,
        customer_name: inv.customer_name,
        customer_mobile: inv.customer_mobile,
        subtotal: inv.subtotal,
        discount_amount: inv.discount_amount,
        tax_amount: inv.tax_amount,
        total: inv.total,
        paid_amount: inv.paid_amount,
        created_at: inv.created_at,
        items: inv.items,
        salon_name: salonInfo?.name,
        salon_phone: salonInfo?.phone,
        salon_address: salonInfo?.address,
        salon_upi_id: salonInfo?.upi_id,
        logo_url: salonInfo?.logo_url,
      });
      if (ok) {
        showToast('Minimalist A4 PDF Invoice downloaded successfully!', 'success');
      } else {
        window.open(`/b/${inv.receipt_token || inv.number}`, '_blank');
      }
    } catch {
      window.open(`/b/${inv.receipt_token || inv.number}`, '_blank');
    } finally {
      setDownloadingPdf(false);
    }
  }

  // Summary Metrics
  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.total), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + Number(i.paid_amount), 0);
  const totalDue = invoices.reduce((acc, i) => acc + Number(i.due_amount), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* ================= PAGE TITLE & ACTION BUTTONS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Minimalist POS invoicing, settlements, and verified commercial A4 tax receipts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Register</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* ================= EXECUTIVE KPI CARDS (B&W Minimalist) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Total Invoiced
          </span>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
            ₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-neutral-400 font-mono">
            Across {invoices.length} transactions
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Collected Revenue
          </span>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            <span>Fully settled &amp; authorized</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Pending / Due Balance
          </span>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
            ₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-neutral-400 font-mono">
            Awaiting client settlement
          </div>
        </div>
      </div>

      {/* ================= SEARCH & STATUS FILTER ================= */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, client name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {(['all', 'pending', 'partial', 'paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {st === 'all' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* ================= INVOICE REGISTER TABLE ================= */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={6} columns={8} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 text-sm">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">No invoices found</p>
            <p className="text-xs text-neutral-400 mt-1">
              Click &quot;Create New Invoice&quot; to generate your first commercial tax bill.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">WhatsApp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const isPartial = inv.status === 'partial';

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                        {inv.number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {inv.customer_name}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          +91 {inv.customer_mobile}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(inv.created_at).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-900 dark:text-white">
                        ₹{Number(inv.total).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-neutral-700 dark:text-neutral-300">
                        ₹{Number(inv.paid_amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {Number(inv.due_amount) > 0 ? (
                          <span className="text-neutral-900 dark:text-white">
                            ₹{Number(inv.due_amount).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-normal">₹0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isPaid
                              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                              : isPartial
                              ? 'border-neutral-400 text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900'
                              : 'border-neutral-300 text-neutral-500 bg-transparent'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setWhatsappInvoice(inv)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                            inv.whatsapp_sent
                              ? 'border-neutral-300 text-neutral-800 dark:text-neutral-200'
                              : 'border-neutral-200 text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                          title="Preview or dispatch WhatsApp bill"
                        >
                          <Send className="w-3 h-3" />
                          <span>{inv.whatsapp_sent ? 'Sent ✓✓' : 'Send'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                            title="View A4 Minimalist Tax Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdfClick(inv)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                            title="Download A4 PDF Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setPaymentModalInvoice(inv);
                                setPayAmount(String(inv.due_amount));
                                setPayRef('');
                                setPayNotes('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[11px] font-bold hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: CREATE NEW INVOICE POS ================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#111111] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-4xl w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[92vh] overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  <span>New Commercial Tax Invoice (POS)</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Generate instant itemized invoice with A4 PDF and digital receipt
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateInvoiceSubmit} className="flex-1 overflow-y-auto touch-scroll p-5 sm:p-6 space-y-6">
              {/* Customer Selector & Quick Info */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Details</span>
                  </span>
                  {existingCustomers.length > 0 && (
                    <select
                      onChange={(e) => {
                        const cid = e.target.value;
                        if (!cid) {
                          setSelectedCustomerId(null);
                          return;
                        }
                        const found = existingCustomers.find((c) => c.id === cid);
                        if (found) {
                          setSelectedCustomerId(found.id);
                          setPosCustomerName(found.name);
                          setPosCustomerMobile(found.mobile);
                        }
                      }}
                      className="text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    >
                      <option value="">Quick Select Existing Client...</option>
                      {existingCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (+91 {c.mobile})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                      Customer Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={posCustomerName}
                      onChange={(e) => setPosCustomerName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                      Mobile Number (for WhatsApp Receipt)
                    </label>
                    <input
                      type="tel"
                      value={posCustomerMobile}
                      onChange={(e) => setPosCustomerMobile(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Bill Items (Services &amp; Retail Products)</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Add from Services Dropdown */}
                    {catalogServices.length > 0 && (
                      <select
                        onChange={(e) => {
                          const sid = e.target.value;
                          if (!sid) return;
                          const serv = catalogServices.find((s) => s.id === sid);
                          if (serv) handleAddPosItem('service', serv);
                          e.target.value = '';
                        }}
                        className="text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                      >
                        <option value="">+ Add Salon Service...</option>
                        {catalogServices.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (₹{s.price})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Add from Retail Products Dropdown */}
                    {catalogProducts.length > 0 && (
                      <select
                        onChange={(e) => {
                          const pid = e.target.value;
                          if (!pid) return;
                          const prod = catalogProducts.find((p) => p.id === pid);
                          if (prod) handleAddPosItem('product', prod);
                          e.target.value = '';
                        }}
                        className="text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                      >
                        <option value="">+ Add Retail Product...</option>
                        {catalogProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price})
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAddPosItem('service')}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer"
                    >
                      + Custom Item
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {posItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-neutral-50 dark:bg-[#161616] p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800"
                    >
                      <span className="font-mono text-xs text-neutral-400 w-6 text-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleUpdatePosItem(idx, 'name', e.target.value)}
                          placeholder="Service / Product Description"
                          className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900"
                        />
                      </div>
                      <select
                        value={item.kind || 'service'}
                        onChange={(e) => handleUpdatePosItem(idx, 'kind', e.target.value)}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 py-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                      >
                        <option value="service">Service</option>
                        <option value="product">Product</option>
                      </select>
                      <div className="w-16">
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.qty}
                          onChange={(e) => handleUpdatePosItem(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                          className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1.5 text-xs font-mono text-center text-neutral-900 dark:text-white"
                          title="Quantity"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          required
                          value={item.unit_price}
                          onChange={(e) => handleUpdatePosItem(idx, 'unit_price', e.target.value)}
                          placeholder="Price"
                          className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1.5 text-xs font-mono text-right text-neutral-900 dark:text-white"
                          title="Unit Price"
                        />
                      </div>
                      <div className="w-24 text-right font-mono font-bold text-xs text-neutral-900 dark:text-white px-2">
                        ₹{(Math.max(1, item.qty || 1) * Math.max(0, parseFloat(String(item.unit_price)) || 0)).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePosItem(idx)}
                        className="text-neutral-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts & Taxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 text-xs">
                {/* Discount */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
                    Special Discount
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={posDiscountType}
                      onChange={(e) => setPosDiscountType(e.target.value as any)}
                      className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200"
                    >
                      <option value="none">No Discount</option>
                      <option value="fixed">Fixed Flat (₹)</option>
                      <option value="percent">Percentage (%)</option>
                    </select>
                    {posDiscountType !== 'none' && (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={posDiscountValue}
                        onChange={(e) => setPosDiscountValue(e.target.value)}
                        placeholder="Value"
                        className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-mono text-neutral-900 dark:text-white"
                      />
                    )}
                  </div>
                </div>

                {/* Tax / GST Rate */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
                    Applicable GST / Tax Rate
                  </label>
                  <div className="flex gap-2">
                    {[
                      { rate: 0, label: '0% (Exempt)' },
                      { rate: 5, label: '5% GST' },
                      { rate: 18, label: '18% GST (9% CGST + 9% SGST)' },
                    ].map((t) => (
                      <button
                        key={t.rate}
                        type="button"
                        onClick={() => setPosTaxRate(t.rate)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                          posTaxRate === t.rate
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900'
                            : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Settlement & Grand Total Box */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 space-y-3">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-neutral-300 dark:text-neutral-600">Subtotal: ₹{posSubtotal.toFixed(2)}</span>
                  {posDiscountAmount > 0 && (
                    <span className="text-neutral-300 dark:text-neutral-600">
                      Discount: -₹{posDiscountAmount.toFixed(2)}
                    </span>
                  )}
                  {posTaxAmount > 0 && (
                    <span className="text-neutral-300 dark:text-neutral-600">Tax: ₹{posTaxAmount.toFixed(2)}</span>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/20 dark:border-black/20">
                  <span className="text-sm font-bold uppercase tracking-wider">Grand Total Amount</span>
                  <span className="text-2xl font-black font-mono">₹{posGrandTotal.toFixed(2)}</span>
                </div>

                {/* Payment Breakdown Inside Modal */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 dark:border-black/10 text-xs text-neutral-900 dark:text-white">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 dark:text-neutral-600 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={posPaymentMethod}
                      onChange={(e) => setPosPaymentMethod(e.target.value as any)}
                      className="w-full rounded-xl border border-white/30 dark:border-black/30 bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3 py-2 text-xs font-semibold cursor-pointer"
                    >
                      <option value="cash">Cash Settlement</option>
                      <option value="upi">UPI / QR Code</option>
                      <option value="card">Credit / Debit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 dark:text-neutral-600 mb-1">
                      Amount Paid Now
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={posPaidAmount}
                      onChange={(e) => setPosPaidAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-white/30 dark:border-black/30 bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 dark:text-neutral-600 mb-1">
                      Payment Ref / Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={posPaymentRef}
                      onChange={(e) => setPosPaymentRef(e.target.value)}
                      placeholder="e.g. UPI Ref / Cashier"
                      className="w-full rounded-xl border border-white/30 dark:border-black/30 bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInvoice || posGrandTotal <= 0}
                  className="px-8 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 text-xs font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Invoice...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Generate &amp; Preview Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: PAYMENT SETTLEMENT ================= */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#111111] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Settle Balance Payment
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Invoice {paymentModalInvoice.number} · {paymentModalInvoice.customer_name}
                </p>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto touch-scroll">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Outstanding Balance</span>
                  <span className="text-xl font-black font-mono text-neutral-900 dark:text-white">
                    ₹{Number(paymentModalInvoice.due_amount).toFixed(2)}
                  </span>
                </div>
                <div className="text-right text-neutral-400 font-mono text-[11px]">
                  Total: ₹{Number(paymentModalInvoice.total).toFixed(2)}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR' },
                    { id: 'cash', label: 'Cash' },
                    { id: 'card', label: 'Card' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        payMethod === m.id
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic QR Display if UPI */}
              {payMethod === 'upi' && dynamicUpiQrUrl && (
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                  <div className="w-20 h-20 bg-white p-1 rounded-lg border border-neutral-300 shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dynamicUpiQrUrl} alt="UPI QR" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-neutral-900 dark:text-white">Scan with any UPI App</p>
                    <p className="font-mono text-[11px] text-neutral-500">UPI: {salonInfo?.upi_id}</p>
                    <p className="text-[10px] text-neutral-400">Locked to ₹{payAmount || paymentModalInvoice.due_amount}</p>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Amount Received (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={Number(paymentModalInvoice.due_amount)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-mono font-bold text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI Txn ID / Card Approval"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={paying || !payAmount || parseFloat(payAmount) <= 0}
                  className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {paying ? 'Recording Payment...' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: FULL MINIMALIST INVOICE PREVIEW ================= */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#111111] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[92vh] overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Official Commercial Invoice Preview
              </span>
              <button
                onClick={() => setViewInvoice(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto touch-scroll text-xs">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-neutral-900 dark:border-white">
                <div>
                  <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">
                    {salonInfo?.name || 'Salon Studio'}
                  </h3>
                  <p className="text-neutral-500 text-[11px] max-w-xs">{salonInfo?.address || 'Premium Salon & Spa'}</p>
                  {salonInfo?.phone && <p className="text-neutral-500 font-mono text-[11px]">Tel: {salonInfo.phone}</p>}
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-neutral-900 dark:text-white block">TAX INVOICE</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white block">{viewInvoice.number}</span>
                  <span className="text-neutral-400 text-[11px]">
                    {new Date(viewInvoice.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Customer Box */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Billed To</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-sm">{viewInvoice.customer_name}</span>
                  <span className="block font-mono text-neutral-500 text-xs">+91 {viewInvoice.customer_mobile}</span>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded border border-neutral-900 dark:border-white font-bold text-[10px] uppercase tracking-wider">
                    {viewInvoice.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-[11px] uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-1.5 text-neutral-400">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                {viewInvoice.items && viewInvoice.items.length > 0 ? (
                  viewInvoice.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {it.name} {it.qty > 1 ? `(x${it.qty})` : ''}
                      </span>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        ₹{(Number(it.unit_price) * (it.qty || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between py-1 font-semibold text-neutral-800 dark:text-neutral-200">
                    <span>Salon Service &amp; Styling Session</span>
                    <span className="font-mono font-bold">₹{Number(viewInvoice.total).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5 text-right font-mono">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal:</span>
                  <span>₹{Number(viewInvoice.subtotal).toFixed(2)}</span>
                </div>
                {Number(viewInvoice.discount_amount) > 0 && (
                  <div className="flex justify-between font-bold text-neutral-900 dark:text-white">
                    <span>Discount:</span>
                    <span>- ₹{Number(viewInvoice.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 p-2.5 rounded-lg mt-2">
                  <span>GRAND TOTAL</span>
                  <span>₹{Number(viewInvoice.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-neutral-500 font-sans">Paid:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    ₹{Number(viewInvoice.paid_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="font-sans">Balance Due:</span>
                  <span>₹{Number(viewInvoice.due_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-2 justify-end shrink-0 bg-neutral-50 dark:bg-[#161616]">
              <button
                type="button"
                onClick={() => handleDownloadPdfClick(viewInvoice)}
                disabled={downloadingPdf}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingPdf ? 'Saving...' : 'Download A4 PDF'}</span>
              </button>

              <a
                href={`/b/${viewInvoice.receipt_token || viewInvoice.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-neutral-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice ↗</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  const targetInv = viewInvoice;
                  setViewInvoice(null);
                  setWhatsappInvoice(targetInv);
                }}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: WHATSAPP PREVIEW MODAL ================= */}
      {whatsappInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#111111] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-sm w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="bg-neutral-900 text-white p-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xs font-bold leading-tight">Digital WhatsApp Dispatch</h3>
                <p className="text-[10px] text-neutral-400">Recipient: +91 {whatsappInvoice.customer_mobile}</p>
              </div>
              <button
                onClick={() => setWhatsappInvoice(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 touch-scroll text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 space-y-2 font-mono">
                <div className="flex justify-between font-bold text-neutral-900 dark:text-white">
                  <span>Invoice: {whatsappInvoice.number}</span>
                  <span>₹{whatsappInvoice.total}</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Client:</span>
                  <span>{whatsappInvoice.customer_name}</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Status:</span>
                  <span className="uppercase font-bold">{whatsappInvoice.status}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleMarkWhatsappSent(whatsappInvoice.id)}
                disabled={sendingWhatsapp}
                className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendingWhatsapp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{sendingWhatsapp ? 'Opening WhatsApp...' : 'Send Bill on WhatsApp ➔'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleDownloadPdfClick(whatsappInvoice)}
                  disabled={downloadingPdf}
                  className="py-2.5 px-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <a
                  href={`/b/${whatsappInvoice.receipt_token || whatsappInvoice.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <ReportExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          role="owner"
          salonName={salonInfo?.name || 'Salon Workspace'}
        />
      )}
    </div>
  );
}
