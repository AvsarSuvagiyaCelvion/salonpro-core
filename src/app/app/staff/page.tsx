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
  Calendar,
  Clock,
  Copy,
  ShieldAlert,
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

interface ShiftItem {
  weekday: number;
  start_time: string;
  end_time: string;
  is_off: boolean;
}

interface LeaveItem {
  id: string;
  staff_id: string;
  from_date: string;
  to_date: string;
  reason: string | null;
  created_at: string;
}

interface ConflictingAppt {
  id: string;
  customer_name: string;
  customer_mobile: string;
  service_name: string;
  formatted_date: string;
  formatted_time: string;
}

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [allServices, setAllServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [canViewCommission, setCanViewCommission] = useState(true);

  // Modal & Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Schedule (Shifts & Leaves) Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleStaff, setScheduleStaff] = useState<StaffMember | null>(null);
  const [scheduleTab, setScheduleTab] = useState<'shifts' | 'leaves'>('shifts');
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [shiftsSaving, setShiftsSaving] = useState(false);
  const [staffShifts, setStaffShifts] = useState<ShiftItem[]>([]);
  const [salonHours, setSalonHours] = useState<{
    open_time: string;
    close_time: string;
    working_days: number[];
  } | null>(null);
  const [leavesList, setLeavesList] = useState<LeaveItem[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveAdding, setLeaveAdding] = useState(false);
  const [scheduleConflicts, setScheduleConflicts] = useState<ConflictingAppt[]>([]);
  const [scheduleMsg, setScheduleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      if (staffRes.ok) {
        setStaffList(staffData.staff || []);
        if (staffData.canViewCommission !== undefined) {
          setCanViewCommission(Boolean(staffData.canViewCommission));
        }
      }
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

  // --- Schedule & Leaves Handlers ---
  async function openScheduleModal(staff: StaffMember) {
    setScheduleStaff(staff);
    setScheduleTab('shifts');
    setScheduleConflicts([]);
    setScheduleMsg(null);
    setIsScheduleModalOpen(true);
    await Promise.all([loadShifts(staff.id), loadLeaves(staff.id)]);
  }

  async function loadShifts(staffId: string) {
    try {
      setShiftsLoading(true);
      const res = await fetch(`/api/staff/${staffId}/shifts`);
      const data = await res.json();
      if (res.ok) {
        setStaffShifts(data.shifts || []);
        setSalonHours(data.salonHours || null);
      } else {
        setScheduleMsg({ type: 'error', text: data.error || 'Failed to load shifts' });
      }
    } catch {
      setScheduleMsg({ type: 'error', text: 'Network error loading shifts' });
    } finally {
      setShiftsLoading(false);
    }
  }

  async function loadLeaves(staffId: string) {
    try {
      setLeavesLoading(true);
      const res = await fetch(`/api/staff/${staffId}/leaves`);
      const data = await res.json();
      if (res.ok) {
        setLeavesList(data.leaves || []);
      } else {
        setScheduleMsg({ type: 'error', text: data.error || 'Failed to load leaves' });
      }
    } catch {
      setScheduleMsg({ type: 'error', text: 'Network error loading leaves' });
    } finally {
      setLeavesLoading(false);
    }
  }

  function handleCopySalonHours() {
    if (!salonHours) return;
    const open = salonHours.open_time.slice(0, 5);
    const close = salonHours.close_time.slice(0, 5);
    const workingDays = salonHours.working_days || [1, 2, 3, 4, 5, 6];

    setStaffShifts((prev) =>
      prev.map((sh) => ({
        ...sh,
        start_time: open,
        end_time: close,
        is_off: !workingDays.includes(sh.weekday),
      }))
    );
    setScheduleMsg({ type: 'success', text: 'Salon operating hours copied to all days.' });
  }

  function handleShiftChange(
    weekday: number,
    field: 'is_off' | 'start_time' | 'end_time',
    value: any
  ) {
    setStaffShifts((prev) =>
      prev.map((sh) => (sh.weekday === weekday ? { ...sh, [field]: value } : sh))
    );
  }

  async function handleSaveShifts() {
    if (!scheduleStaff) return;
    try {
      setShiftsSaving(true);
      setScheduleMsg(null);
      setScheduleConflicts([]);
      const res = await fetch(`/api/staff/${scheduleStaff.id}/shifts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shifts: staffShifts }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save shifts');
      }
      setScheduleMsg({ type: 'success', text: data.message || 'Shifts saved successfully' });
      if (data.conflicts && data.conflicts.length > 0) {
        setScheduleConflicts(data.conflicts);
      }
    } catch (err: any) {
      setScheduleMsg({ type: 'error', text: err.message || 'Failed to save shifts' });
    } finally {
      setShiftsSaving(false);
    }
  }

  async function handleAddLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleStaff || !leaveFrom || !leaveTo) return;
    try {
      setLeaveAdding(true);
      setScheduleMsg(null);
      setScheduleConflicts([]);
      const res = await fetch(`/api/staff/${scheduleStaff.id}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_date: leaveFrom,
          to_date: leaveTo,
          reason: leaveReason || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add leave');
      }
      setScheduleMsg({ type: 'success', text: data.message || 'Leave recorded successfully' });
      setLeaveFrom('');
      setLeaveTo('');
      setLeaveReason('');
      if (data.conflicts && data.conflicts.length > 0) {
        setScheduleConflicts(data.conflicts);
      }
      await loadLeaves(scheduleStaff.id);
    } catch (err: any) {
      setScheduleMsg({ type: 'error', text: err.message || 'Failed to add leave' });
    } finally {
      setLeaveAdding(false);
    }
  }

  async function handleDeleteLeave(leaveId: string) {
    if (!scheduleStaff) return;
    try {
      const res = await fetch(
        `/api/staff/${scheduleStaff.id}/leaves?leaveId=${leaveId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete leave');
      }
      setLeavesList((prev) => prev.filter((l) => l.id !== leaveId));
      setScheduleMsg({ type: 'success', text: 'Leave removed' });
    } catch (err: any) {
      setScheduleMsg({ type: 'error', text: err.message || 'Failed to remove leave' });
    }
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
                      {canViewCommission ? (
                        <div className="text-[11px] space-y-0.5">
                          <div className="text-neutral-700">
                            Services: <span className="font-bold text-[#D4A77F]">{staff.service_commission_pct}%</span>
                          </div>
                          <div className="text-neutral-500">
                            Products: <span className="font-bold text-emerald-700">{staff.product_commission_pct}%</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400 italic">Owner Only</span>
                      )}
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
                      {canViewCommission ? (
                        <>
                          <strong className="text-sm font-black text-emerald-700 block">
                            ₹{Number(staff.total_commission_earned || 0).toLocaleString('en-IN')}
                          </strong>
                          <span className="text-[10px] text-neutral-400">
                            ₹{Number(staff.product_commission_earned || 0).toFixed(0)} retail + ₹{Number(staff.service_commission_earned || 0).toFixed(0)} svc
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] text-neutral-400 italic">Owner Only</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {staff.services.length === 0 ? (
                          <span className="text-[11px] text-neutral-400">None assigned</span>
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
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => openScheduleModal(staff)}
                        className="p-1.5 text-neutral-500 hover:text-[#D4A77F] hover:bg-[#D4A77F]/10 rounded-lg transition-colors cursor-pointer"
                        title="Manage Shifts & Leaves"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
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

              {canViewCommission && (
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
              )}

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

      {/* Shifts & Leaves Management Modal */}
      {isScheduleModalOpen && scheduleStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-2xl w-full p-4 sm:p-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4A77F]/15 text-[#D4A77F] flex items-center justify-center font-bold shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
                    Shifts &amp; Leaves — {scheduleStaff.name}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {scheduleStaff.role_title || 'Stylist'} · Configure weekly working shifts and scheduled leaves
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 pt-4 pb-2 border-b border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setScheduleTab('shifts');
                  setScheduleMsg(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  scheduleTab === 'shifts'
                    ? 'bg-[#D4A77F] text-[#080B12] shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Weekly Shifts (7 Days)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScheduleTab('leaves');
                  setScheduleMsg(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  scheduleTab === 'leaves'
                    ? 'bg-[#D4A77F] text-[#080B12] shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Staff Leaves ({leavesList.length})</span>
              </button>
            </div>

            {/* Notification / Conflict Banner */}
            <div className="space-y-3 pt-3">
              {scheduleMsg && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                    scheduleMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {scheduleMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{scheduleMsg.text}</span>
                  </div>
                  <button
                    onClick={() => setScheduleMsg(null)}
                    className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Conflict Warnings List */}
              {scheduleConflicts.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Warning: {scheduleConflicts.length} Conflicting Appointment(s)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mb-2 leading-relaxed">
                    The updated shift or leave schedule overlaps with existing appointments. 
                    In accordance with salon policies, existing appointments are <strong>not modified or cancelled automatically</strong>.
                    Please contact the clients below to reschedule:
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {scheduleConflicts.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 rounded-lg bg-white border border-amber-200 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-2xs"
                      >
                        <div>
                          <span className="font-bold text-neutral-900">{c.customer_name}</span>{' '}
                          <span className="text-neutral-500">(+91 {c.customer_mobile})</span>{' '}
                          · <span className="font-semibold text-[#8C5E35]">{c.service_name}</span>
                        </div>
                        <div className="font-bold text-neutral-700 tabular-nums self-end sm:self-auto">
                          {c.formatted_date} at {c.formatted_time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TAB 1: WEEKLY SHIFTS */}
            {scheduleTab === 'shifts' && (
              <div className="pt-3 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs">
                  <div className="text-neutral-600">
                    <span className="font-semibold text-neutral-800">Salon Operating Hours:</span>{' '}
                    {salonHours ? (
                      <span className="font-bold text-[#D4A77F]">
                        {salonHours.open_time.slice(0, 5)} - {salonHours.close_time.slice(0, 5)}
                      </span>
                    ) : (
                      'Loading...'
                    )}
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      Shifts must be scheduled within salon operating hours.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySalonHours}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-100 text-xs cursor-pointer shadow-2xs self-start sm:self-auto"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#D4A77F]" />
                    <span>Copy Salon Hours</span>
                  </button>
                </div>

                {shiftsLoading ? (
                  <div className="py-8 text-center text-xs text-neutral-400">Loading weekly shifts...</div>
                ) : (
                  <div className="space-y-2">
                    {staffShifts.map((sh) => (
                      <div
                        key={sh.weekday}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          sh.is_off
                            ? 'bg-neutral-50/80 border-neutral-200 text-neutral-400'
                            : 'bg-white border-neutral-200/90 text-neutral-800'
                        }`}
                      >
                        <div className="flex items-center justify-between sm:justify-start gap-4 min-w-[130px]">
                          <span className="font-bold text-xs text-neutral-900">
                            {WEEKDAY_NAMES[sh.weekday]}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleShiftChange(sh.weekday, 'is_off', !sh.is_off)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              sh.is_off
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {sh.is_off ? 'Day Off' : 'Working'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] text-neutral-500 font-medium">Start:</span>
                            <input
                              type="time"
                              disabled={sh.is_off}
                              value={sh.start_time}
                              onChange={(e) =>
                                handleShiftChange(sh.weekday, 'start_time', e.target.value)
                              }
                              className="px-2 py-1 rounded-lg border border-neutral-300 text-xs outline-none focus:border-[#D4A77F] disabled:opacity-40 disabled:bg-neutral-100"
                            />
                          </div>

                          <span className="text-neutral-400 text-xs">to</span>

                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] text-neutral-500 font-medium">End:</span>
                            <input
                              type="time"
                              disabled={sh.is_off}
                              value={sh.end_time}
                              onChange={(e) =>
                                handleShiftChange(sh.weekday, 'end_time', e.target.value)
                              }
                              className="px-2 py-1 rounded-lg border border-neutral-300 text-xs outline-none focus:border-[#D4A77F] disabled:opacity-40 disabled:bg-neutral-100"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={shiftsSaving || shiftsLoading}
                    onClick={handleSaveShifts}
                    className="px-5 py-2 text-xs bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {shiftsSaving ? 'Saving Shifts...' : 'Save Weekly Shifts'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: STAFF LEAVES */}
            {scheduleTab === 'leaves' && (
              <div className="pt-3 space-y-5">
                {/* Add Leave Form */}
                <form
                  onSubmit={handleAddLeave}
                  className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3"
                >
                  <h3 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#D4A77F]" />
                    <span>Add New Leave / Time Off</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        From Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveFrom}
                        onChange={(e) => setLeaveFrom(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 outline-none focus:border-[#D4A77F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        To Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveTo}
                        onChange={(e) => setLeaveTo(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 outline-none focus:border-[#D4A77F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Reason (Max 120 chars)
                      </label>
                      <input
                        type="text"
                        maxLength={120}
                        placeholder="e.g. Vacation / Personal"
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 outline-none focus:border-[#D4A77F]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={leaveAdding}
                      className="px-4 py-1.5 text-xs bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {leaveAdding ? 'Recording Leave...' : '+ Record Leave'}
                    </button>
                  </div>
                </form>

                {/* Leaves List */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-800 mb-2">Recorded Leaves</h3>
                  {leavesLoading ? (
                    <div className="py-6 text-center text-xs text-neutral-400">Loading leaves...</div>
                  ) : leavesList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 rounded-xl border border-neutral-200/60">
                      No leaves recorded for this stylist.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {leavesList.map((leave) => {
                        const todayStr = new Date().toISOString().slice(0, 10);
                        const isPast = leave.to_date < todayStr;
                        return (
                          <div
                            key={leave.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                              isPast
                                ? 'bg-neutral-50/60 border-neutral-200 text-neutral-400 opacity-60'
                                : 'bg-white border-neutral-200 text-neutral-800'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-neutral-900 tabular-nums">
                                  {leave.from_date} to {leave.to_date}
                                </span>
                                {isPast ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-500">
                                    Past Leave
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Upcoming
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-500">
                                {leave.reason || 'No specific reason given'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteLeave(leave.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete leave"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
