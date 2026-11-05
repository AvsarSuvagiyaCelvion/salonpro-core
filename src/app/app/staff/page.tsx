'use client';

import { useState, useEffect } from 'react';
import SkeletonTable from '@/components/ui/SkeletonTable';
import {
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  UserX,
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role_title: string;
  service_commission_pct: string | number;
  product_commission_pct: string | number;
  active: boolean;
  show_online: boolean;
  services: { id: string; name: string }[];
  services_count?: number;
  service_revenue?: number;
  service_commission_earned?: number;
  products_sold_count?: number;
  product_sales_revenue?: number;
  product_commission_earned?: number;
  total_commission_earned?: number;
}

interface ServiceOption {
  id: string;
  name: string;
  category: string;
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [allServices, setAllServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Senior Stylist');
  const [formServiceComm, setFormServiceComm] = useState('10');
  const [formProductComm, setFormProductComm] = useState('5');
  const [formSelectedServices, setFormSelectedServices] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);
  const [formShowOnline, setFormShowOnline] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [staffRes, servicesRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/services'),
      ]);
      const staffData = await staffRes.json();
      const servicesData = await servicesRes.json();

      if (staffRes.ok) setStaffList(staffData.staff || []);
      if (servicesRes.ok) setAllServices(servicesData.services || []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load staff list' });
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingStaff(null);
    setFormName('');
    setFormRole('Stylist');
    setFormServiceComm('10');
    setFormProductComm('5');
    setFormSelectedServices(allServices.map((s) => s.id));
    setFormActive(true);
    setFormShowOnline(true);
    setIsModalOpen(true);
  }

  function openEditModal(staff: StaffMember) {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormRole(staff.role_title || 'Stylist');
    setFormServiceComm(staff.service_commission_pct.toString());
    setFormProductComm(staff.product_commission_pct.toString());
    setFormSelectedServices(staff.services.map((s) => s.id));
    setFormActive(staff.active);
    setFormShowOnline(staff.show_online);
    setIsModalOpen(true);
  }

  function toggleServiceSelection(srvId: string) {
    setFormSelectedServices((prev) =>
      prev.includes(srvId) ? prev.filter((id) => id !== srvId) : [...prev, srvId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      name: formName,
      role_title: formRole,
      service_commission_pct: parseFloat(formServiceComm) || 0,
      product_commission_pct: parseFloat(formProductComm) || 0,
      services: formSelectedServices,
      active: formActive,
      show_online: formShowOnline,
    };

    try {
      if (editingStaff) {
        const res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update staff member');

        await fetchData();
        setMessage({ type: 'success', text: 'Staff member updated successfully!' });
      } else {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add staff member');

        await fetchData();
        setMessage({ type: 'success', text: 'Staff member added successfully!' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(id: string, field: 'active' | 'show_online', currentVal: boolean) {
    const newVal = !currentVal;
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: newVal } : s))
    );

    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newVal }),
      });
      if (!res.ok) throw new Error();
      setMessage({
        type: 'success',
        text: field === 'active' 
          ? `Staff marked as ${newVal ? 'Working' : 'On Leave'}`
          : `Online booking ${newVal ? 'enabled' : 'hidden'} for staff`,
      });
    } catch {
      setStaffList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: currentVal } : s))
      );
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      setMessage({ type: 'success', text: 'Staff member deleted' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete staff member' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
            Staff & Specialists
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your salon team, commissions, assigned services, and duty roster
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs shadow-md shadow-[#D4A77F]/20 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Message Banner */}
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

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={4} columns={7} />
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-sm">
            No staff members found. Click "Add Staff Member" to add your first stylist.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 border-b border-neutral-200/80 text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Commission Rates</th>
                  <th className="py-3 px-4">Retail Products Sold</th>
                  <th className="py-3 px-4">Total Commission</th>
                  <th className="py-3 px-4">Services Done</th>
                  <th className="py-3 px-4 text-center">Duty Status</th>
                  <th className="py-3 px-4 text-center">Online Booking</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-[#D4A77F]/10 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1F2937] to-[#D4A77F] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                          {staff.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#1F2937] dark:text-white">
                            {staff.name}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            ID: {staff.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-neutral-700">
                      {staff.role_title}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-neutral-700">
                          Services: <span className="font-bold text-[#D4A77F]">{staff.service_commission_pct}%</span>
                        </div>
                        <div className="text-neutral-500">
                          Products: <span className="font-bold text-emerald-700">{staff.product_commission_pct}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-sm font-black text-neutral-900 block">
                        {staff.products_sold_count || 0} units
                      </strong>
                      <span className="text-[11px] text-neutral-400">
                        ₹{Number(staff.product_sales_revenue || 0).toLocaleString('en-IN')} revenue
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-sm font-black text-emerald-700 block">
                        ₹{Number(staff.total_commission_earned || 0).toLocaleString('en-IN')}
                      </strong>
                      <span className="text-[10px] text-neutral-400">
                        ₹{Number(staff.product_commission_earned || 0).toFixed(0)} retail + ₹{Number(staff.service_commission_earned || 0).toFixed(0)} svc
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {staff.services.length === 0 ? (
                          <span className="text-[11px] text-neutral-400 italic">None assigned</span>
                        ) : (
                          staff.services.map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-medium"
                            >
                              {s.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    {/* Working or On Leave Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(staff.id, 'active', staff.active)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                          staff.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                        title="Click to toggle Working / On Leave"
                      >
                        {staff.active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        <span>{staff.active ? 'Working' : 'On Leave'}</span>
                      </button>
                    </td>
                    {/* Show Online Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(staff.id, 'show_online', staff.show_online)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                          staff.show_online
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                        }`}
                        title="Click to toggle Online Booking visibility"
                      >
                        {staff.show_online ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{staff.show_online ? 'Show Online' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(staff)}
                        className="p-1.5 text-neutral-500 hover:text-[#D4A77F] hover:bg-[#D4A77F]/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit staff"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(staff.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete staff"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-[#1F2937] dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#D4A77F]" />
                <span>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</span>
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
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Pooja Dave"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  placeholder="e.g. Senior Hair Colorist"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#D4A77F] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Service Commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formServiceComm}
                    onChange={(e) => setFormServiceComm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#D4A77F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Product Commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formProductComm}
                    onChange={(e) => setFormProductComm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#D4A77F] outline-none"
                  />
                </div>
              </div>

              {/* Services Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Services Performed by this Staff Member:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50">
                  {allServices.map((srv) => (
                    <label
                      key={srv.id}
                      className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer p-1 rounded-lg hover:bg-white select-none"
                    >
                      <input
                        type="checkbox"
                        checked={formSelectedServices.includes(srv.id)}
                        onChange={() => toggleServiceSelection(srv.id)}
                        className="rounded text-[#D4A77F] focus:ring-[#D4A77F]"
                      />
                      <span className="truncate">{srv.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status toggles */}
              <div className="space-y-2 pt-1 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="staff_active_toggle"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded text-[#D4A77F] focus:ring-[#D4A77F] cursor-pointer"
                  />
                  <label htmlFor="staff_active_toggle" className="text-xs text-neutral-700 cursor-pointer select-none">
                    Currently Working (Uncheck if on long leave)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="staff_online_toggle"
                    checked={formShowOnline}
                    onChange={(e) => setFormShowOnline(e.target.checked)}
                    className="rounded text-[#D4A77F] focus:ring-[#D4A77F] cursor-pointer"
                  />
                  <label htmlFor="staff_online_toggle" className="text-xs text-neutral-700 cursor-pointer select-none">
                    Show on online client booking page
                  </label>
                </div>
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
                  className="px-4 py-2 text-xs bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingStaff ? 'Update Staff' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
