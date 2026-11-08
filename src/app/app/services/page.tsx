'use client';

import { useState, useEffect } from 'react';
import SkeletonTable from '@/components/ui/SkeletonTable';
import { showToast } from '@/lib/toast';
import {
  Scissors,
  Plus,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Loader2,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration_min: number;
  price: string | number;
  online_enabled: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-dismiss notification after exactly 3 seconds and trigger global toast
  useEffect(() => {
    if (message) {
      showToast(message.text, message.type);
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Hair');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('30');
  const [formPrice, setFormPrice] = useState('500');
  const [formOnline, setFormOnline] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      const res = await fetch('/api/services');
      const data = await res.json();
      if (res.ok) {
        setServices(data.services || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load services' });
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingService(null);
    setFormName('');
    setFormCategory('Hair');
    setFormDescription('');
    setFormDuration('30');
    setFormPrice('500');
    setFormOnline(true);
    setIsModalOpen(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setFormName(service.name);
    setFormCategory(service.category);
    setFormDescription(service.description || '');
    setFormDuration(service.duration_min.toString());
    setFormPrice(service.price.toString());
    setFormOnline(service.online_enabled);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      name: formName,
      category: formCategory,
      description: formDescription,
      duration_min: parseInt(formDuration, 10),
      price: parseFloat(formPrice),
      online_enabled: formOnline,
    };

    try {
      if (editingService) {
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update service');

        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? data.service : s))
        );
        setMessage({ type: 'success', text: 'Service updated successfully!' });
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add service');

        setServices((prev) => [...prev, data.service]);
        setMessage({ type: 'success', text: 'Service created successfully!' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleOnline(id: string, currentVal: boolean) {
    const newVal = !currentVal;
    setTogglingId(id);
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, online_enabled: newVal } : s))
    );

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online_enabled: newVal }),
      });
      if (!res.ok) throw new Error();
      setMessage({
        type: 'success',
        text: `Service ${newVal ? 'enabled' : 'hidden'} for online booking`,
      });
    } catch {
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, online_enabled: currentVal } : s))
      );
      setMessage({ type: 'error', text: 'Failed to update online status' });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setServices((prev) => prev.filter((s) => s.id !== id));
      setMessage({ type: 'success', text: 'Service deleted successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete service' });
    } finally {
      setDeletingId(null);
    }
  }

  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
            Service Catalog
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your salon services, pricing, durations and online availability
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs shadow-md shadow-[#D4A77F]/20 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Alert Messages */}
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service by name or description..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-xs text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#D4A77F]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#10141F] dark:bg-[#D4A77F] text-white dark:text-[#080B12] shadow-xs'
                  : 'bg-white dark:bg-[#141926] border border-neutral-200 dark:border-[#2A2F3A] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1C2230]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table Card */}
      <div className="bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200/80 dark:border-[#2A2F3A] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={5} columns={5} />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 dark:text-neutral-500 text-sm">
            No services found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 dark:bg-[#10141E] border-b border-neutral-200/80 dark:border-[#2A2F3A] text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Service Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Online Booking</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#2A2F3A]">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-neutral-50/60 dark:hover:bg-[#1C2230] transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-sm text-[#1F2937] dark:text-white">
                        {service.name}
                      </div>
                      {service.description && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                          {service.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-[#1C2230] text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-[#2A2F3A]">
                        {service.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{service.duration_min} mins</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white text-sm">
                      ₹{Number(service.price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        disabled={togglingId === service.id}
                        onClick={() => handleToggleOnline(service.id, service.online_enabled)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                          togglingId === service.id
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        } ${
                          service.online_enabled
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-neutral-100 dark:bg-[#1C2230] text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-[#2A2F3A]'
                        }`}
                      >
                        {togglingId === service.id ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-neutral-400" />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              service.online_enabled ? 'bg-emerald-500' : 'bg-neutral-400'
                            }`}
                          ></span>
                        )}
                        <span>{service.online_enabled ? 'Available' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 text-neutral-500 hover:text-[#D4A77F] hover:bg-[#D4A77F]/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit service"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={deletingId === service.id}
                        onClick={() => handleDelete(service.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete service"
                      >
                        {deletingId === service.id ? (
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
          </div>
        )}
      </div>

      {/* Add / Edit Service Modal - Scrollable on mobile with sticky header & footer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative bg-white dark:bg-[#141926] rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926]">
              <h2 className="text-base sm:text-lg font-bold text-[#1F2937] dark:text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#D4A77F]" />
                <span>{editingService ? 'Edit Service' : 'Add New Service'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 touch-scroll">
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Balayage Hair Color"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-[#D4A77F] focus:ring-1 focus:ring-[#D4A77F] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none"
                  >
                    <option value="Hair">Hair</option>
                    <option value="Skin">Skin</option>
                    <option value="Color">Color</option>
                    <option value="Nails">Nails</option>
                    <option value="Makeup">Makeup</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Spa">Spa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g. 499, 999 or 1099"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description of the procedure..."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-[#D4A77F] outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="online_toggle"
                  checked={formOnline}
                  onChange={(e) => setFormOnline(e.target.checked)}
                  className="rounded text-[#D4A77F] focus:ring-[#D4A77F] cursor-pointer"
                />
                <label htmlFor="online_toggle" className="text-xs font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer select-none">
                  Enable for public online appointment booking
                </label>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100 dark:border-[#2A2F3A]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1C2230] rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : editingService ? (
                    'Update Service'
                  ) : (
                    'Add Service'
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
