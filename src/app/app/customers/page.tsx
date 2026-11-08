'use client';

import { useState, useEffect } from 'react';
import SkeletonTable from '@/components/ui/SkeletonTable';
import { showToast } from '@/lib/toast';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  History,
  Receipt,
  Scissors,
  Package,
  Printer,
  Sparkles,
  Check,
  MessageSquare,
  Wallet,
  MapPin,
  Loader2,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address?: string | null;
  avatar_url?: string | null;
  note: string | null;
  birthday: string | null;
  visits: number;
  total_spent: string | number;
  created_at: string;
}

interface InvoiceItem {
  name: string;
  kind: 'service' | 'product';
  qty: number;
  unit_price: string | number;
  staff_name: string | null;
}

interface CustomerInvoice {
  id: string;
  number: string;
  total: string | number;
  paid_amount: string | number;
  due_amount: string | number;
  discount_amount: string | number;
  status: 'paid' | 'partial' | 'pending';
  created_at: string;
  items: InvoiceItem[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal 1: Add/Edit Customer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formBirthday, setFormBirthday] = useState('');

  // Modal 2: Customer Bills & Services History Modal
  const [selectedCustomerForBills, setSelectedCustomerForBills] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoice[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchCustomers(page);
  }, [page, search]);

  useEffect(() => {
    if (message?.text) {
      showToast(message.text, message.type);
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function fetchCustomers(targetPage = page) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      params.set('page', String(targetPage));
      params.set('pageSize', '50');

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
        if (data.pagination) {
          setPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.total);
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load customers' });
    } finally {
      setLoading(false);
    }
  }

  async function openCustomerBillsModal(c: Customer) {
    setSelectedCustomerForBills(c);
    setCustomerInvoices([]);
    setLoadingBills(true);

    try {
      const res = await fetch(`/api/customers/${c.id}/invoices`);
      const data = await res.json();
      if (res.ok) {
        setCustomerInvoices(data.invoices || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load customer bill history' });
    } finally {
      setLoadingBills(false);
    }
  }

  function openAddModal() {
    setEditingCustomer(null);
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormNote('');
    setFormBirthday('');
    setIsModalOpen(true);
  }

  function openEditModal(c: Customer) {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormMobile(c.mobile);
    setFormEmail(c.email || '');
    setFormNote(c.note || '');
    setFormBirthday(c.birthday ? c.birthday.slice(0, 10) : '');
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      name: formName,
      mobile: formMobile,
      email: formEmail,
      note: formNote,
      birthday: formBirthday || null,
    };

    try {
      if (editingCustomer) {
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update customer');

        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? { ...c, ...data.customer }
              : c
          )
        );
        setMessage({ type: 'success', text: 'Customer updated successfully!' });
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add customer');

        setCustomers((prev) => [data.customer, ...prev]);
        setMessage({ type: 'success', text: 'Customer registered successfully!' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setMessage({ type: 'success', text: 'Customer profile deleted' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete customer' });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
            Client Directory
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            View customer profiles, visits, invoice histories, and services received
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-4.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs shadow-md shadow-[#D4A77F]/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Message Alert */}
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client name, mobile or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-xs text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#D4A77F] focus:ring-1 focus:ring-[#D4A77F]"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200/80 dark:border-[#2A2F3A] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-sm">
            {search ? 'No clients found matching your search.' : 'No clients registered yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 dark:bg-[#10141F] border-b border-neutral-200/80 dark:border-[#2A2F3A] text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Mobile & Email</th>
                  <th className="py-3 px-4">Notes & Birthday</th>
                  <th className="py-3 px-4 text-center">Visits</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-4 text-center">Bill History</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#2A2F3A]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#D4A77F]/10 dark:hover:bg-[#1C2230] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4A77F]/10 text-[#8C5E2E] dark:text-[#D4A77F] flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-neutral-200/50 dark:border-[#2A2F3A]">
                          {c.avatar_url ? (
                            <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            c.name.slice(0, 1)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-white tracking-tight truncate">
                            {c.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>+91 {c.mobile}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px]">
                            <Mail className="w-3 h-3 text-neutral-400" />
                            <span>{c.email}</span>
                          </div>
                        )}
                        {c.address && (
                          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px] truncate max-w-[200px]" title={c.address}>
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {c.note ? (
                        <p className="text-neutral-700 dark:text-neutral-300 text-[11px] bg-neutral-50 dark:bg-[#10141F] px-2 py-1 rounded-md border border-neutral-100 dark:border-[#2A2F3A] inline-block mb-1">
                          {c.note}
                        </p>
                      ) : null}
                      {c.birthday && (
                        <div className="flex items-center gap-1 text-[11px] text-[#8C5E2E] dark:text-[#D4A77F]">
                          <Calendar className="w-3 h-3 text-pink-500" />
                          <span>B'day: {new Date(c.birthday).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-[#10141F] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#2A2F3A]">
                        <History className="w-3 h-3 text-neutral-500" />
                        <span>{c.visits} visits</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-sm text-[#1F2937] dark:text-white">
                        ₹{Number(c.total_spent).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Invoiced total
                      </div>
                    </td>
                    {/* View Bills Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openCustomerBillsModal(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D4A77F]/30 bg-[#D4A77F]/10 hover:bg-pink-100/70 dark:hover:bg-[#D4A77F]/20 text-[#8C5E2E] dark:text-[#D4A77F] font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                        title="View all bills & services for this customer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Bills ({c.visits})</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-[#D4A77F] hover:bg-[#D4A77F]/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit client profile"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={deletingId === c.id}
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete client"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-[#2A2F3A] bg-neutral-50/50 dark:bg-[#10141F]">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Showing page <span className="font-semibold text-neutral-900 dark:text-white">{page}</span> of{' '}
                  <span className="font-semibold text-neutral-900 dark:text-white">{totalPages}</span> ({totalRecords} clients)
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

      {/* ================= MODAL: CUSTOMER BILLS & SERVICES HISTORY ================= */}
      {selectedCustomerForBills && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-2xl w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4A77F]/10 text-[#D4A77F] flex items-center justify-center font-bold text-sm">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1F2937] dark:text-white">
                    Bill History: {selectedCustomerForBills.name}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>+91 {selectedCustomerForBills.mobile}</span>
                    {selectedCustomerForBills.email && (
                      <>
                        <span>•</span>
                        <Mail className="w-3 h-3" />
                        <span>{selectedCustomerForBills.email}</span>
                      </>
                    )}
                    {selectedCustomerForBills.address && (
                      <>
                        <span>•</span>
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span className="truncate max-w-[200px]" title={selectedCustomerForBills.address}>
                          {selectedCustomerForBills.address}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>Total Spent: <strong>₹{selectedCustomerForBills.total_spent}</strong></span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerForBills(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoices List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 touch-scroll">
              {loadingBills ? (
                <div className="p-8 text-center text-neutral-400 text-sm">
                  Loading invoices and services for {selectedCustomerForBills.name}...
                </div>
              ) : customerInvoices.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-sm">
                  No previous bills found for this customer.
                </div>
              ) : (
                customerInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-neutral-50/40 dark:bg-[#10141F] hover:bg-white dark:hover:bg-[#141926] hover:shadow-xs transition-all space-y-3"
                  >
                    {/* Invoice top summary */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#8C5E2E] dark:text-[#D4A77F]">
                          {inv.number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {new Date(inv.created_at).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Services & Products breakdown */}
                    <div className="bg-white dark:bg-[#141926] rounded-lg p-2.5 border border-neutral-200/70 dark:border-[#2A2F3A] text-xs space-y-1.5">
                      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                        Services & Items Given:
                      </div>
                      {inv.items.length === 0 ? (
                        <div className="text-neutral-400 text-[11px]">
                          Salon Service Treatment
                        </div>
                      ) : (
                        inv.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              {item.kind === 'service' ? (
                                <Scissors className="w-3 h-3 text-[#8C5E2E] dark:text-[#D4A77F]" />
                              ) : (
                                <Package className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              )}
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                {item.name} {item.qty > 1 ? `(x${item.qty})` : ''}
                              </span>
                              {item.staff_name && (
                                <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                                  Stylist: {item.staff_name}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-neutral-900">
                              ₹{Number(item.unit_price) * Number(item.qty)}
                            </span>
                          </div>
                        ))
                      )}

                      {/* Totals & Discounts */}
                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                        <div className="text-neutral-500">
                          {Number(inv.discount_amount) > 0 && (
                            <span className="text-emerald-600 font-medium">
                              Discount: -₹{inv.discount_amount} •{' '}
                            </span>
                          )}
                          <span>Paid: <strong className="text-emerald-700">₹{inv.paid_amount}</strong></span>
                          {Number(inv.due_amount) > 0 && (
                            <span className="text-red-600 font-bold ml-1">
                              (Due: ₹{inv.due_amount})
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-black text-[#1F2937] dark:text-white">
                          Bill Total: ₹{Number(inv.total).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-[#2A2F3A] flex items-center justify-between shrink-0 bg-white dark:bg-[#141926]">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Showing {customerInvoices.length} invoice(s) for this client
              </span>
              <button
                type="button"
                onClick={() => setSelectedCustomerForBills(null)}
                className="px-4 py-2 text-xs font-semibold bg-neutral-100 dark:bg-[#1C2230] hover:bg-neutral-200 dark:hover:bg-[#252C3D] text-neutral-700 dark:text-neutral-200 rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT CUSTOMER ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926]">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D4A77F]" />
                <span>{editingCustomer ? 'Edit Client Profile' : 'Register New Client'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 touch-scroll">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Radhika Sharma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formMobile}
                  onChange={(e) => setFormMobile(e.target.value)}
                  placeholder="e.g. 9825012345"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. radhika@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Birthday (for offers & greetings)
                </label>
                <input
                  type="date"
                  value={formBirthday}
                  onChange={(e) => setFormBirthday(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Client Preferences / Notes
                </label>
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. Likes mild shampoo, allergic to ammonia, prefers morning slots..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#D4A77F] outline-none"
                />
              </div>

              {editingCustomer?.address && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    <span>Client Address (Set by client in customer portal)</span>
                  </label>
                  <div className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600">
                    {editingCustomer.address}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : editingCustomer ? (
                    'Update Profile'
                  ) : (
                    'Add Client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
