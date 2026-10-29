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
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
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

  // Operating hours for daily timeline
  const [operatingHours, setOperatingHours] = useState<{ start: number; end: number }>({ start: 9, end: 21 });

  // View Mode: Timeline Calendar vs Card List
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');
  const [calendarDate, setCalendarDate] = useState<string>('');
  const [todayDate, setTodayDate] = useState<string>('');

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
    const now = new Date();
    const today = now.toLocaleDateString('en-CA');
    const curH = now.getHours().toString().padStart(2, '0');
    const curM = (Math.ceil(now.getMinutes() / 15) * 15 % 60).toString().padStart(2, '0');
    setTodayDate(today);
    setCalendarDate(today);
    setFormDate(today);
    setFormTime(`${curH}:${curM}`);
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateRangeFilter, viewMode, calendarDate]);

  function handlePrevDay() {
    const cur = new Date((calendarDate || todayDate || new Date().toLocaleDateString('en-CA')) + 'T12:00:00');
    cur.setDate(cur.getDate() - 1);
    setCalendarDate(cur.toLocaleDateString('en-CA'));
  }

  function handleNextDay() {
    const cur = new Date((calendarDate || todayDate || new Date().toLocaleDateString('en-CA')) + 'T12:00:00');
    cur.setDate(cur.getDate() + 1);
    setCalendarDate(cur.toLocaleDateString('en-CA'));
  }

  function handleToday() {
    if (todayDate) {
      setCalendarDate(todayDate);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setTodayDate(today);
      setCalendarDate(today);
    }
  }

  async function fetchInitialData() {
    try {
      const [srvRes, stfRes, custRes, setRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/staff'),
        fetch('/api/customers'),
        fetch('/api/settings'),
      ]);
      const srvData = await srvRes.json();
      const stfData = await stfRes.json();
      const custData = await custRes.json();
      const setData = await setRes.json();

      if (srvRes.ok) setServices(srvData.services || []);
      if (stfRes.ok) setStaffList(stfData.staff || []);
      if (custRes.ok) setCustomers(custData.customers || []);
      if (setRes.ok && setData.salon?.open_time && setData.salon?.close_time) {
        const startH = parseInt(setData.salon.open_time.slice(0, 2), 10) || 9;
        const endH = parseInt(setData.salon.close_time.slice(0, 2), 10) || 21;
        setOperatingHours({ start: startH, end: Math.max(endH, startH + 1) });
      }
    } catch {}
  }

  async function fetchAppointments() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const now = new Date();
      if (viewMode === 'calendar') {
        const targetDate = calendarDate || now.toISOString().slice(0, 10);
        const start = `${targetDate}T00:00:00.000Z`;
        const end = `${targetDate}T23:59:59.999Z`;
        params.set('startDate', start);
        params.set('endDate', end);
      } else if (dateRangeFilter === 'today') {
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

  function openCreateModal(defaultTime?: string, defaultDate?: string) {
    setOverlapError(null);
    setMessage(null);
    const now = new Date();
    const today = now.toLocaleDateString('en-CA');
    const curH = now.getHours().toString().padStart(2, '0');
    const curM = (Math.ceil(now.getMinutes() / 15) * 15 % 60).toString().padStart(2, '0');
    const curTimeStr = `${curH}:${curM}`;

    setIsNewCustomer(false);
    setSelectedCustomerId(customers[0]?.id || '');
    setNewCustName('');
    setNewCustMobile('');
    setSelectedStaffId(staffList[0]?.id || '');
    setSelectedServiceId(services[0]?.id || '');
    setFormDate(defaultDate || calendarDate || today);
    setFormTime(defaultTime || curTimeStr);
    setFormNote('');
    setIsModalOpen(true);
  }

  // Calculate live end time
  const currentSelectedService = services.find((s) => s.id === selectedServiceId);
  const duration = currentSelectedService?.duration_min || 30;

  function getCalculatedEndTime() {
    if (!formDate || !formTime) return '';
    try {
      const cleanT = formTime.trim().length === 5 ? `${formTime.trim()}:00` : formTime.trim();
      const start = new Date(`${formDate.trim()}T${cleanT}+05:30`);
      const end = new Date(start.getTime() + duration * 60000);
      return end.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
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
          type="button"
          onClick={() => openCreateModal()}
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

      {/* Top Controls: View Switcher (Calendar vs List) & Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-[#b3135b] text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Time Slot Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[#b3135b] text-white shadow-xs'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Card List</span>
          </button>
        </div>

        {/* Center: Date Picker or Filter Range */}
        {viewMode === 'cards' ? (
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
        ) : (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              title="Previous Day"
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                calendarDate === todayDate
                  ? 'bg-pink-100 text-[#b3135b]'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Today
            </button>

            <input
              type="date"
              value={calendarDate}
              onChange={(e) => setCalendarDate(e.target.value)}
              className="px-2 py-1 text-xs font-bold text-neutral-800 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#b3135b]"
            />

            <button
              type="button"
              onClick={handleNextDay}
              title="Next Day"
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
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

      {/* Appointments View: Timeline Calendar OR Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-4">
          <SkeletonTable rows={5} columns={6} />
        </div>
      ) : viewMode === 'calendar' ? (
        /* ================= 1. TIMELINE CALENDAR VIEW ================= */
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs overflow-hidden">
          {/* Calendar Header Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-neutral-50 to-pink-50/40 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#b3135b]" />
                <h2 className="font-extrabold text-sm sm:text-base text-[#2a1630]">
                  {calendarDate
                    ? new Date(calendarDate + 'T00:00:00').toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Daily Appointment Schedule'}
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Hourly scheduled client appointments with live stylist & chair tracking
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-500">
                Bookings for Day:
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#b3135b] text-white text-xs font-black">
                {appointments.length}
              </span>
            </div>
          </div>

          {/* Timeline Slots Grid */}
          <div className="divide-y divide-neutral-100">
            {Array.from(
              { length: Math.max(1, operatingHours.end - operatingHours.start + 1) },
              (_, i) => operatingHours.start + i
            ).map((hour) => {
              const hourFormatted = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
              const nextHour = hour + 1;
              const nextHourFormatted = `${nextHour > 12 ? nextHour - 12 : nextHour}:00 ${nextHour >= 12 ? 'PM' : 'AM'}`;

              const hourAppts = appointments.filter((a) => {
                const apptDate = new Date(a.starts_at);
                return apptDate.getHours() === hour;
              });

              return (
                <div
                  key={hour}
                  className="flex flex-col sm:flex-row items-stretch sm:items-start min-h-[82px] p-3 sm:p-4 hover:bg-neutral-50/50 transition-colors gap-3 sm:gap-4"
                >
                  {/* Time Label Column */}
                  <div className="w-24 sm:w-28 flex-shrink-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start pt-1 text-xs font-black text-[#2a1630]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#b3135b]" />
                      <span>{hourFormatted}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-normal sm:mt-0.5">
                      to {nextHourFormatted}
                    </span>
                  </div>

                  {/* Appointments Slot Content */}
                  <div className="flex-1">
                    {hourAppts.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openCreateModal(`${hour.toString().padStart(2, '0')}:00`, calendarDate)}
                        className="w-full h-12 border-2 border-dashed border-neutral-200 hover:border-[#b3135b]/60 rounded-2xl flex items-center justify-center gap-1.5 text-xs text-neutral-400 hover:text-[#b3135b] hover:bg-pink-50/20 transition-all cursor-pointer group"
                      >
                        <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span>Empty Slot ({hourFormatted}) — Click to Book Appointment</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {hourAppts.map((appt) => {
                          const startDate = new Date(appt.starts_at);
                          const endDate = new Date(appt.ends_at);
                          const isDone = appt.status === 'done';
                          const isCancelled = appt.status === 'cancelled';
                          const isArrived = appt.status === 'arrived';
                          const isScheduled = appt.status === 'scheduled';

                          return (
                            <div
                              key={appt.id}
                              className={`p-3.5 rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                                isArrived
                                  ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-100'
                                  : isDone
                                  ? 'bg-emerald-50/50 border-emerald-300'
                                  : isCancelled
                                  ? 'bg-neutral-100/70 border-neutral-200 opacity-60'
                                  : 'bg-white border-pink-200/90 hover:border-[#b3135b] shadow-xs'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="text-xs font-black text-[#b3135b] flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {startDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} -{' '}
                                    {endDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                                  </span>

                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                      isScheduled
                                        ? 'bg-blue-100 text-blue-800'
                                        : isArrived
                                        ? 'bg-amber-100 text-amber-900'
                                        : isDone
                                        ? 'bg-emerald-100 text-emerald-900'
                                        : 'bg-neutral-200 text-neutral-600'
                                    }`}
                                  >
                                    {appt.status}
                                  </span>
                                </div>

                                <div className="font-extrabold text-sm text-[#2a1630] truncate">
                                  {appt.customer_name}
                                </div>
                                <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>+91 {appt.customer_mobile}</span>
                                </div>

                                <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                                  <div className="truncate pr-1">
                                    <span className="font-bold text-neutral-800 truncate block">
                                      {appt.service_name}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 block truncate">
                                      Stylist: {appt.staff_name}
                                    </span>
                                  </div>
                                  <span className="font-black text-[#b3135b] text-xs shrink-0">
                                    ₹{Number(appt.service_price).toLocaleString('en-IN')}
                                  </span>
                                </div>

                                {appt.note && (
                                  <p className="text-[10px] text-neutral-500 italic mt-1.5 truncate">
                                    "{appt.note}"
                                  </p>
                                )}
                              </div>

                              {/* Quick Action Buttons */}
                              <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center gap-1.5">
                                {isScheduled && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(appt.id, 'arrived')}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer text-center"
                                  >
                                    Mark Arrived
                                  </button>
                                )}

                                {(isScheduled || isArrived) && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartSessionFromAppt(appt.id)}
                                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#b3135b] hover:bg-[#960f4c] text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-white" />
                                    <span>Start POS</span>
                                  </button>
                                )}

                                {isDone && (
                                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Completed</span>
                                  </span>
                                )}

                                {isCancelled && (
                                  <span className="text-[11px] font-semibold text-neutral-400">
                                    Cancelled
                                  </span>
                                )}

                                {!isDone && !isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                                    title="Cancel Appointment"
                                    className="p-1.5 rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : appointments.length === 0 ? (
        /* ================= 2. EMPTY CARDS LIST ================= */
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center text-neutral-400 text-sm">
          No appointments found matching this date and status filter.
        </div>
      ) : (
        /* ================= 3. CARDS LIST VIEW ================= */
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
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#b3135b]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {startDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} -{' '}
                          {endDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-medium">
                        {startDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
