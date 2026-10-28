'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SkeletonTable from '@/components/ui/SkeletonTable';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  UserCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Check,
  Ban,
  Search,
  Filter,
  Phone,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface Appointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'arrived' | 'done' | 'cancelled';
  source: 'online' | 'owner';
  note: string | null;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  staff_id: string;
  staff_name: string;
  staff_role: string;
  service_id: string;
  service_name: string;
  service_category: string;
  duration_min: number;
  service_price: string | number;
}

interface ServiceOption {
  id: string;
  name: string;
  category: string;
  duration_min: number;
  price: string | number;
}

interface StaffOption {
  id: string;
  name: string;
  role_title: string;
}

interface CustomerOption {
  id: string;
  name: string;
  mobile: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'arrived' | 'done' | 'cancelled'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'next7' | 'today' | 'all'>('next7');

  // Messages & Friendly Overlap Alert
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [overlapError, setOverlapError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('11:00');
  const [formNote, setFormNote] = useState('');

  useEffect(() => {
    setFormDate(new Date().toISOString().slice(0, 10));
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateRangeFilter]);

  async function fetchInitialData() {
    try {
      const [srvRes, stfRes, custRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/staff'),
        fetch('/api/customers'),
      ]);
      const srvData = await srvRes.json();
      const stfData = await stfRes.json();
      const custData = await custRes.json();

      if (srvRes.ok) setServices(srvData.services || []);
      if (stfRes.ok) setStaffList(stfData.staff || []);
      if (custRes.ok) setCustomers(custData.customers || []);
    } catch {}
  }

  async function fetchAppointments() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const now = new Date();
      if (dateRangeFilter === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
        params.set('startDate', start);
        params.set('endDate', end);
      } else if (dateRangeFilter === 'next7') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        params.set('startDate', start);
        params.set('endDate', end);
      }

      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load appointments' });
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setOverlapError(null);
    setMessage(null);
    setIsNewCustomer(false);
    setSelectedCustomerId(customers[0]?.id || '');
    setNewCustName('');
    setNewCustMobile('');
    setSelectedStaffId(staffList[0]?.id || '');
    setSelectedServiceId(services[0]?.id || '');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTime('11:00');
    setFormNote('');
    setIsModalOpen(true);
  }

  // Calculate live end time
  const currentSelectedService = services.find((s) => s.id === selectedServiceId);
  const duration = currentSelectedService?.duration_min || 30;

  function getCalculatedEndTime() {
    if (!formDate || !formTime) return '';
    try {
      const start = new Date(`${formDate}T${formTime}:00`);
      const end = new Date(start.getTime() + duration * 60000);
      return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setOverlapError(null);
    setMessage(null);

    const payload = {
      customer_id: isNewCustomer ? null : selectedCustomerId,
      new_customer_name: isNewCustomer ? newCustName : null,
      new_customer_mobile: isNewCustomer ? newCustMobile : null,
      staff_id: selectedStaffId,
      service_id: selectedServiceId,
      date: formDate,
      start_time: formTime,
      note: formNote,
    };

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isOverlap) {
          // Display the required friendly conflict message
          setOverlapError(data.error);
          return;
        }
        throw new Error(data.error || 'Failed to book appointment');
      }

      await fetchAppointments();
      setIsModalOpen(false);
      setMessage({ type: 'success', text: 'Appointment booked successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(id: string, status: 'scheduled' | 'arrived' | 'cancelled') {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      setMessage({ type: 'success', text: `Appointment marked as ${status}` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update appointment status' });
    }
  }

  async function handleStartSessionFromAppt(id: string) {
    try {
      const res = await fetch(`/api/appointments/${id}/start-session`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchAppointments();
      setMessage({
        type: 'success',
        text: 'Session started! Switched to Live Studio floor.',
      });
      // Navigate to live studio
      router.push('/app/live');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a1630] tracking-tight">
            Appointments & Booking Roster
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Real-time schedule with automated double-booking collision protection
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[#b3135b] hover:bg-[#960f4c] text-white text-xs font-semibold shadow-md shadow-[#b3135b]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Overlap Collision Alert Banner */}
      {overlapError && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start justify-between shadow-xs animate-in shake">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-amber-900" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Slot Collision Prevented (No Double-Booking)
              </p>
              <p className="text-sm text-amber-950 font-medium mt-0.5">
                {overlapError}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOverlapError(null)}
            className="text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

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

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Date Quick Toggles */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-neutral-200/80 shadow-2xs">
          <button
            onClick={() => setDateRangeFilter('next7')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              dateRangeFilter === 'next7'
                ? 'bg-[#2a1630] text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Next 7 Days
          </button>
          <button
            onClick={() => setDateRangeFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              dateRangeFilter === 'today'
                ? 'bg-[#2a1630] text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRangeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              dateRangeFilter === 'all'
                ? 'bg-[#2a1630] text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            All Bookings
          </button>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {(['all', 'scheduled', 'arrived', 'done', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#b3135b] text-white shadow-xs font-semibold'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-4">
          <SkeletonTable rows={5} columns={6} />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center text-neutral-400 text-sm">
          No appointments found matching this date and status filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appt) => {
            const startDate = new Date(appt.starts_at);
            const endDate = new Date(appt.ends_at);

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-neutral-200/80 p-4.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                {/* Top Badge: Date, Time & Status */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#b3135b]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        appt.status === 'scheduled'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : appt.status === 'arrived'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : appt.status === 'done'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="pt-2.5">
                    <div className="font-bold text-base text-[#2a1630]">
                      {appt.customer_name}
                    </div>
                    <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>+91 {appt.customer_mobile}</span>
                    </div>
                  </div>

                  {/* Service & Staff Details */}
                  <div className="mt-3 bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-200/60 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                        <Scissors className="w-3 h-3 text-[#b3135b]" />
                        <span>{appt.service_name}</span>
                      </span>
                      <span className="font-bold text-neutral-900">
                        ₹{appt.service_price}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/50">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-neutral-400" />
                        <span>Stylist: <strong>{appt.staff_name}</strong></span>
                      </span>
                      <span>{appt.duration_min} mins</span>
                    </div>
                  </div>

                  {appt.note && (
                    <p className="text-[11px] text-neutral-500 italic mt-2">
                      "{appt.note}"
                    </p>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                  {appt.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'arrived')}
                        className="py-1.5 px-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs cursor-pointer transition-colors"
                      >
                        Mark Arrived
                      </button>
                      <button
                        onClick={() => handleStartSessionFromAppt(appt.id)}
                        className="py-1.5 px-3 rounded-lg bg-[#b3135b] hover:bg-[#960f4c] text-white font-semibold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Start Session</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg cursor-pointer"
                        title="Cancel appointment"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {appt.status === 'arrived' && (
                    <>
                      <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>In Salon Lounge</span>
                      </span>
                      <button
                        onClick={() => handleStartSessionFromAppt(appt.id)}
                        className="py-1.5 px-3 rounded-lg bg-[#b3135b] hover:bg-[#960f4c] text-white font-semibold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Start Session</span>
                      </button>
                    </>
                  )}

                  {appt.status === 'done' && (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed Treatment</span>
                    </span>
                  )}

                  {appt.status === 'cancelled' && (
                    <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      <span>Booking Cancelled</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: NEW APPOINTMENT ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-base font-bold text-[#2a1630] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#b3135b]" />
                <span>Book New Salon Appointment</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overlap Collision Error Inside Modal */}
            {overlapError && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-medium flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-900 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">Stylist Collision Conflict:</p>
                  <p className="mt-0.5">{overlapError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4 pt-4">
              {/* Customer Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-700">
                    Customer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomer(!isNewCustomer)}
                    className="text-xs text-[#b3135b] hover:underline font-semibold cursor-pointer"
                  >
                    {isNewCustomer ? 'Select Existing Client' : '+ New Client'}
                  </button>
                </div>

                {!isNewCustomer ? (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (+91 {c.mobile})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      required
                      placeholder="Client Full Name"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Mobile (10 digits)"
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Staff Member */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Assigned Stylist / Specialist *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    setOverlapError(null);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none bg-white font-medium"
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.role_title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Service *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    setOverlapError(null);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (₹{s.price} - {s.duration_min} mins)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      setOverlapError(null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    step="900"
                    value={formTime}
                    onChange={(e) => {
                      setFormTime(e.target.value);
                      setOverlapError(null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                  />
                </div>
              </div>

              {/* Live Slot Calculation Card */}
              <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-200/80 text-xs flex items-center justify-between">
                <div>
                  <span className="text-neutral-500 block">Calculated Slot Time:</span>
                  <span className="font-bold text-[#b3135b]">
                    {formTime} ➔ {getCalculatedEndTime()} ({duration} mins)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">Service Fee:</span>
                  <span className="font-black text-neutral-900">
                    ₹{currentSelectedService?.price || 0}
                  </span>
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Special Requests / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Client requested ammonia-free color"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-[#b3135b] hover:bg-[#960f4c] text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Checking Availability...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
