'use client';

import { useState, useEffect } from 'react';
import SkeletonTable from '@/components/ui/SkeletonTable';
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
  Send,
  MessageSquare,
  Wallet,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
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

  // Modal 3: WhatsApp Broadcast Marketing Campaign
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Special Festival Offer! 🌸 Enjoy 20% OFF on all Hair & Facial treatments this week at our salon. Book your slot online in 15 seconds!'
  );
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'regulars'>('all');
  const [launchingBroadcast, setLaunchingBroadcast] = useState(false);
  const [broadcastSentCount, setBroadcastSentCount] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchCustomers(page);
  }, [page, search]);

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

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setMessage({ type: 'success', text: 'Customer profile deleted' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete customer' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a1630] tracking-tight">
            Client Directory
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            View customer profiles, visits, invoice histories, and services received
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setBroadcastSentCount(null);
              setIsBroadcastModalOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>📢 WhatsApp Broadcast</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#b3135b] hover:bg-[#960f4c] text-white text-xs font-semibold shadow-md shadow-[#b3135b]/20 transition-all cursor-pointer whitespace-nowrap"
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
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-800 focus:outline-none focus:border-[#b3135b] focus:ring-1 focus:ring-[#b3135b]"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
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
              <thead className="bg-neutral-50/70 border-b border-neutral-200/80 text-neutral-400 font-semibold uppercase tracking-wider">
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
              <tbody className="divide-y divide-neutral-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-pink-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-50 text-[#b3135b] flex items-center justify-center font-bold text-xs">
                          {c.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#2a1630]">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            Member since {new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>+91 {c.mobile}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                            <Mail className="w-3 h-3 text-neutral-400" />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {c.note ? (
                        <p className="text-neutral-700 text-[11px] bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100 inline-block mb-1">
                          {c.note}
                        </p>
                      ) : null}
                      {c.birthday && (
                        <div className="flex items-center gap-1 text-[11px] text-pink-700">
                          <Calendar className="w-3 h-3 text-pink-500" />
                          <span>B'day: {new Date(c.birthday).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                        <History className="w-3 h-3 text-neutral-500" />
                        <span>{c.visits} visits</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-sm text-[#2a1630]">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-200 bg-pink-50 hover:bg-pink-100/70 text-[#b3135b] font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                        title="View all bills & services for this customer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Bills ({c.visits})</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-neutral-500 hover:text-[#b3135b] hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit client profile"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                <p className="text-xs text-neutral-600">
                  Showing page <span className="font-semibold text-neutral-900">{page}</span> of{' '}
                  <span className="font-semibold text-neutral-900">{totalPages}</span> ({totalRecords} clients)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#b3135b] flex items-center justify-center font-bold text-sm">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#2a1630]">
                    Bill History: {selectedCustomerForBills.name}
                  </h2>
                  <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>+91 {selectedCustomerForBills.mobile}</span>
                    <span>•</span>
                    <span>Total Spent: <strong>₹{selectedCustomerForBills.total_spent}</strong></span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerForBills(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoices List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
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
                    className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/40 hover:bg-white hover:shadow-xs transition-all space-y-3"
                  >
                    {/* Invoice top summary */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#b3135b]">
                          {inv.number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <span className="text-neutral-500">
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
                    <div className="bg-white rounded-lg p-2.5 border border-neutral-200/70 text-xs space-y-1.5">
                      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                        Services & Items Given:
                      </div>
                      {inv.items.length === 0 ? (
                        <div className="text-neutral-400 italic text-[11px]">
                          Salon Service Treatment
                        </div>
                      ) : (
                        inv.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              {item.kind === 'service' ? (
                                <Scissors className="w-3 h-3 text-[#b3135b]" />
                              ) : (
                                <Package className="w-3 h-3 text-purple-600" />
                              )}
                              <span className="font-semibold text-neutral-800">
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
                        <div className="text-sm font-black text-[#2a1630]">
                          Bill Total: ₹{Number(inv.total).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Showing {customerInvoices.length} invoice(s) for this client
              </span>
              <button
                type="button"
                onClick={() => setSelectedCustomerForBills(null)}
                className="px-4 py-2 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT CUSTOMER ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-[#2a1630] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#b3135b]" />
                <span>{editingCustomer ? 'Edit Client Profile' : 'Register New Client'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                />
              </div>

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
                  className="px-4 py-2 text-xs font-semibold bg-[#b3135b] hover:bg-[#960f4c] text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCustomer ? 'Update Profile' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL 3: BULK WHATSAPP BROADCAST ================= */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#075e54] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-700/80 flex items-center justify-center text-base shadow-xs">
                  📢
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">WhatsApp Marketing Broadcast</h3>
                  <p className="text-[11px] text-emerald-200">
                    Send promotional offers & greetings directly to all your clients
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="w-7 h-7 rounded-full bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {broadcastSentCount !== null ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="font-extrabold text-base text-emerald-900">Broadcast Campaign Dispatched!</h4>
                  <p className="text-emerald-700 leading-relaxed text-xs">
                    Your offer message has been successfully broadcast to{' '}
                    <strong>{broadcastSentCount} clients</strong> on WhatsApp!
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Audience Selection */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                      Select Target Audience
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBroadcastAudience('all')}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          broadcastAudience === 'all'
                            ? 'bg-pink-50/60 border-[#b3135b] ring-1 ring-[#b3135b]'
                            : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="font-bold text-neutral-900">All Registered Clients</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {customers.length > 0 ? customers.length : 500} Total Phone Numbers
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastAudience('regulars')}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          broadcastAudience === 'regulars'
                            ? 'bg-pink-50/60 border-[#b3135b] ring-1 ring-[#b3135b]'
                            : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="font-bold text-neutral-900">Repeat VIP Clients</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          Clients with 2+ visits
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-neutral-800">
                        Promotional Offer Message
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setBroadcastMessage(
                            'Special Festival Offer! 🌸 Enjoy 20% OFF on all Hair & Facial treatments this week at our salon. Book your slot online in 15 seconds!'
                          )
                        }
                        className="text-[10px] text-[#b3135b] font-semibold hover:underline"
                      >
                        Load Template
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Type your WhatsApp offer text..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                    />
                  </div>

                  {/* Live WhatsApp Chat Bubble Preview */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Customer WhatsApp Chat Preview
                    </label>
                    <div className="bg-[#e5ddd5] p-3 rounded-2xl border border-neutral-300">
                      <div className="bg-white rounded-xl p-3 shadow-xs max-w-[85%] space-y-1.5 border border-neutral-200/60">
                        <p className="text-neutral-800 text-xs whitespace-pre-wrap leading-relaxed">
                          {broadcastMessage}
                        </p>
                        <div className="text-[10px] text-neutral-400 text-right">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost & Budget Breakdown Box */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Recipients:</span>
                      <span>
                        {broadcastAudience === 'all'
                          ? customers.length > 0
                            ? customers.length
                            : 500
                          : Math.max(1, Math.round((customers.length || 500) * 0.4))}{' '}
                        Customers
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-800">
                      <span>Rate per WhatsApp message:</span>
                      <span>₹0.80 / msg (Meta Official API)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-extrabold text-amber-950 pt-1 border-t border-amber-200">
                      <span>Total Estimated Cost:</span>
                      <span className="text-[#b3135b]">
                        ₹
                        {(
                          (broadcastAudience === 'all'
                            ? customers.length > 0
                              ? customers.length
                              : 500
                            : Math.max(1, Math.round((customers.length || 500) * 0.4))) * 0.8
                        ).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Launch Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={launchingBroadcast || !broadcastMessage.trim()}
                      onClick={() => {
                        setLaunchingBroadcast(true);
                        setTimeout(() => {
                          const targetCount =
                            broadcastAudience === 'all'
                              ? customers.length > 0
                                ? customers.length
                                : 500
                              : Math.max(1, Math.round((customers.length || 500) * 0.4));
                          setBroadcastSentCount(targetCount);
                          setLaunchingBroadcast(false);
                        }, 1200);
                      }}
                      className="w-full py-3 rounded-2xl bg-[#25d366] hover:bg-[#20ba59] text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {launchingBroadcast
                          ? 'Broadcasting to WhatsApp...'
                          : `Launch WhatsApp Broadcast to ${
                              broadcastAudience === 'all'
                                ? customers.length > 0
                                  ? customers.length
                                  : 500
                                : Math.max(1, Math.round((customers.length || 500) * 0.4))
                            } Clients 🚀`}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
