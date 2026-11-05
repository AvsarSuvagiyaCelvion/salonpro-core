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
  Columns3,
  CalendarDays,
  Sparkles,
  MessageCircle,
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

type ViewMode = 'lanes' | 'week' | 'cards';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Operating hours for daily timeline
  const [operatingHours, setOperatingHours] = useState<{ start: number; end: number }>({ start: 9, end: 21 });

  // View Mode: Multi-Stylist Lanes vs 7-Day Matrix vs Card List
  const [viewMode, setViewMode] = useState<ViewMode>('lanes');
  const [calendarDate, setCalendarDate] = useState<string>('');
  const [todayDate, setTodayDate] = useState<string>('');
  const [selectedStylistFilter, setSelectedStylistFilter] = useState<string>('all');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'arrived' | 'done' | 'cancelled'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'next7' | 'today' | 'all'>('next7');

  // Pagination (for cards view)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

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

  // Live Current Time Marker in IST
  const [nowMinuteOffset, setNowMinuteOffset] = useState<number | null>(null);

  useEffect(() => {
    const updateTimeOffset = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      if (currentHours >= operatingHours.start && currentHours <= operatingHours.end) {
        const totalMinutesFromStart = (currentHours - operatingHours.start) * 60 + currentMinutes;
        setNowMinuteOffset(totalMinutesFromStart);
      } else {
        setNowMinuteOffset(null);
      }
    };
    updateTimeOffset();
    const interval = setInterval(updateTimeOffset, 60000);
    return () => clearInterval(interval);
  }, [operatingHours]);

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
    if (calendarDate) {
      fetchAppointments(1);
    }
  }, [calendarDate, statusFilter, dateRangeFilter, viewMode]);

  function handlePrevDay() {
    if (!calendarDate) return;
    const cur = new Date(calendarDate + 'T00:00:00');
    cur.setDate(cur.getDate() - 1);
    setCalendarDate(cur.toLocaleDateString('en-CA'));
  }

  function handleNextDay() {
    if (!calendarDate) return;
    const cur = new Date(calendarDate + 'T00:00:00');
    cur.setDate(cur.getDate() + 1);
    setCalendarDate(cur.toLocaleDateString('en-CA'));
  }

  function handlePrevWeek() {
    if (!calendarDate) return;
    const cur = new Date(calendarDate + 'T00:00:00');
    cur.setDate(cur.getDate() - 7);
    setCalendarDate(cur.toLocaleDateString('en-CA'));
  }

  function handleNextWeek() {
    if (!calendarDate) return;
    const cur = new Date(calendarDate + 'T00:00:00');
    cur.setDate(cur.getDate() + 7);
    setCalendarDate(cur.toLocaleDateString('en-CA'));
  }

  function handleToday() {
    const today = new Date().toLocaleDateString('en-CA');
    setTodayDate(today);
    setCalendarDate(today);
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

  async function fetchAppointments(targetPage = page) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(targetPage));

      const now = new Date();
      if (viewMode === 'lanes') {
        const targetDate = calendarDate || now.toISOString().slice(0, 10);
        const start = `${targetDate}T00:00:00.000Z`;
        const end = `${targetDate}T23:59:59.999Z`;
        params.set('startDate', start);
        params.set('endDate', end);
        params.set('pageSize', '150');
      } else if (viewMode === 'week') {
        const targetDate = calendarDate || now.toISOString().slice(0, 10);
        const curD = new Date(targetDate + 'T00:00:00');
        const day = curD.getDay(); // 0 is Sun, 1 is Mon
        const diffToMon = day === 0 ? -6 : 1 - day;
        const mon = new Date(curD);
        mon.setDate(curD.getDate() + diffToMon);
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        params.set('startDate', `${mon.toLocaleDateString('en-CA')}T00:00:00.000Z`);
        params.set('endDate', `${sun.toLocaleDateString('en-CA')}T23:59:59.999Z`);
        params.set('pageSize', '300');
      } else if (dateRangeFilter === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
        params.set('startDate', start);
        params.set('endDate', end);
        params.set('pageSize', '50');
      } else if (dateRangeFilter === 'next7') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        params.set('startDate', start);
        params.set('endDate', end);
        params.set('pageSize', '50');
      } else {
        params.set('pageSize', '50');
      }

      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
        if (data.pagination) {
          setPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.total);
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load appointments' });
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal(defaultTime?: string, defaultDate?: string, defaultStaffId?: string) {
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
    setSelectedStaffId(defaultStaffId || staffList[0]?.id || '');
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
      router.push('/app/live');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  function sendWhatsAppReminder(appt: Appointment) {
    const formattedDate = new Date(appt.starts_at).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const formattedTime = new Date(appt.starts_at).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const message = `Hello ${appt.customer_name}, reminder for your upcoming salon appointment for "${appt.service_name}" on ${formattedDate} at ${formattedTime} with ${appt.staff_name}. We look forward to pampering you!`;
    const cleanMobile = appt.customer_mobile.replace(/[^0-9]/g, '');
    const url = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  // Active stylists for Lanes View
  const displayStaff = staffList.length > 0 ? staffList : [{ id: 'general', name: 'General Chair', role_title: 'Main Floor' }];
  const filteredStaff = selectedStylistFilter === 'all'
    ? displayStaff
    : displayStaff.filter((s) => s.id === selectedStylistFilter);

  // 7-day calculation for Week Matrix
  const weekDays = (() => {
    if (!calendarDate) return [];
    const curD = new Date(calendarDate + 'T00:00:00');
    const day = curD.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(curD);
    mon.setDate(curD.getDate() + diffToMon);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      days.push({
        dateStr: d.toLocaleDateString('en-CA'),
        dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        formatted: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        isToday: d.toLocaleDateString('en-CA') === todayDate,
      });
    }
    return days;
  })();

  // Daily Summary Stats
  const dayTotalAppts = appointments.length;
  const dayTotalRevenue = appointments.reduce((sum, a) => sum + (a.status !== 'cancelled' ? Number(a.service_price || 0) : 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Booking CTA Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
              Salon Calendar &amp; Chair Lanes
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A77F]/15 text-[#8C5E35] dark:text-[#D4A77F] border border-[#D4A77F]/30">
              <Sparkles className="w-3 h-3 text-[#D4A77F]" />
              <span>Multi-Stylist Suite</span>
            </span>
          </div>
          <p className="text-sm text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">
            Real-time appointment schedule with conflict protection &amp; instant POS billing
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 py-2.5 px-4.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-sans font-semibold text-xs shadow-md shadow-[#D4A77F]/20 transition-all cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Global Toast Messages */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
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
          <button onClick={() => setMessage(null)} className="text-current hover:opacity-70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Filter & View Mode Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white dark:bg-[#141926] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
        {/* Left: View Mode Switcher Pills */}
        <div className="flex items-center gap-1 bg-[#F9FAFB] dark:bg-[#10141F] p-1 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('lanes')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'lanes'
                ? 'bg-[#D4A77F] text-[#080B12] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Stylist Lanes</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-[#D4A77F] text-[#080B12] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>7-Day Week</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[#D4A77F] text-[#080B12] shadow-xs'
                : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Card List</span>
          </button>
        </div>

        {/* Center: Date Navigator with Quick Today jump */}
        {viewMode !== 'cards' ? (
          <div className="flex items-center gap-2 bg-[#F9FAFB] dark:bg-[#10141F] p-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A]">
            <button
              type="button"
              onClick={viewMode === 'week' ? handlePrevWeek : handlePrevDay}
              title={viewMode === 'week' ? 'Previous Week' : 'Previous Day'}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#141926] text-[#6B7280] dark:text-[#A0A8B8] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                calendarDate === todayDate
                  ? 'bg-[#D4A77F]/20 text-[#8C5E35] dark:text-[#D4A77F] border border-[#D4A77F]/40'
                  : 'text-[#6B7280] dark:text-[#A0A8B8] hover:bg-white dark:hover:bg-[#141926]'
              }`}
            >
              Today
            </button>

            <input
              type="date"
              value={calendarDate}
              onChange={(e) => setCalendarDate(e.target.value)}
              className="px-2 py-1 text-xs font-semibold text-[#1F2937] dark:text-white bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-lg focus:outline-none focus:border-[#D4A77F]"
            />

            <button
              type="button"
              onClick={viewMode === 'week' ? handleNextWeek : handleNextDay}
              title={viewMode === 'week' ? 'Next Week' : 'Next Day'}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#141926] text-[#6B7280] dark:text-[#A0A8B8] cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#F9FAFB] dark:bg-[#10141F] p-1 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A]">
            <button
              onClick={() => setDateRangeFilter('next7')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                dateRangeFilter === 'next7'
                  ? 'bg-[#10141F] dark:bg-white text-white dark:text-[#080B12] shadow-xs'
                  : 'text-[#6B7280] dark:text-[#A0A8B8] hover:bg-white dark:hover:bg-[#141926]'
              }`}
            >
              Next 7 Days
            </button>
            <button
              onClick={() => setDateRangeFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                dateRangeFilter === 'today'
                  ? 'bg-[#10141F] dark:bg-white text-white dark:text-[#080B12] shadow-xs'
                  : 'text-[#6B7280] dark:text-[#A0A8B8] hover:bg-white dark:hover:bg-[#141926]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRangeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                dateRangeFilter === 'all'
                  ? 'bg-[#10141F] dark:bg-white text-white dark:text-[#080B12] shadow-xs'
                  : 'text-[#6B7280] dark:text-[#A0A8B8] hover:bg-white dark:hover:bg-[#141926]'
              }`}
            >
              All
            </button>
          </div>
        )}

        {/* Right: Stylist & Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {viewMode === 'lanes' && staffList.length > 1 && (
            <select
              value={selectedStylistFilter}
              onChange={(e) => setSelectedStylistFilter(e.target.value)}
              aria-label="Filter appointments by stylist"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
            >
              <option value="all">All Stylists ({staffList.length})</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            {(['all', 'scheduled', 'arrived', 'done'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-xs'
                    : 'bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#6B7280] dark:text-[#A0A8B8] hover:bg-neutral-50 dark:hover:bg-[#1C2230]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Schedule Canvas */}
      {loading ? (
        <div className="bg-white dark:bg-[#141926] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] p-6">
          <SkeletonTable rows={6} columns={5} />
        </div>
      ) : viewMode === 'lanes' ? (
        /* ================= 1. MULTI-STYLIST CHAIR LANES (DAY VIEW) ================= */
        <div className="bg-white dark:bg-[#141926] rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-lg shadow-black/5 dark:shadow-black/25 overflow-hidden transition-colors">
          {/* Day Summary Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#F9FAFB] via-[#FFFBF7] to-[#F9FAFB] dark:from-[#10141F] dark:via-[#141926] dark:to-[#10141F] border-b border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4A77F]/15 border border-[#D4A77F]/30 flex items-center justify-center text-[#D4A77F] font-black shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-[#1F2937] dark:text-white">
                  {calendarDate
                    ? new Date(calendarDate + 'T00:00:00').toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Daily Stylist Lanes'}
                </h2>
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">
                  Click any stylist&apos;s empty time slot to pre-fill chair &amp; book immediately
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs font-semibold text-[#1F2937] dark:text-white flex items-center gap-1.5 shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-[#D4A77F]" />
                <span>{dayTotalAppts} Appointments</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#D4A77F]/15 border border-[#D4A77F]/30 text-xs font-bold text-[#8C5E35] dark:text-[#D4A77F] flex items-center gap-1.5 shadow-2xs">
                <span>Est. Value:</span>
                <span className="font-variant-numeric tabular-nums font-black">₹{dayTotalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Stylist Grid with Sticky Columns */}
          <div className="overflow-x-auto scrollbar-thin">
            <div
              className="min-w-[760px] grid divide-x divide-[#E5E7EB] dark:divide-[#2A2F3A]"
              style={{
                gridTemplateColumns: `80px repeat(${filteredStaff.length}, minmax(240px, 1fr))`,
              }}
            >
              {/* Header: Stylist Column Tiles */}
              <div className="sticky top-0 z-20 bg-[#F9FAFB] dark:bg-[#10141F] p-3 text-center border-b border-[#E5E7EB] dark:border-[#2A2F3A] text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] uppercase tracking-wider flex items-center justify-center">
                Time
              </div>

              {filteredStaff.map((staff) => {
                const staffAppts = appointments.filter((a) => a.staff_id === staff.id || (filteredStaff.length === 1 && !a.staff_id));
                const staffRev = staffAppts.reduce((sum, a) => sum + (a.status !== 'cancelled' ? Number(a.service_price || 0) : 0), 0);
                const initials = staff.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={staff.id}
                    className="sticky top-0 z-20 bg-[#F9FAFB] dark:bg-[#10141F] p-3 sm:p-3.5 border-b border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#D4A77F] text-[#080B12] font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                        {initials || 'SP'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs sm:text-sm text-[#1F2937] dark:text-white truncate">
                          {staff.name}
                        </div>
                        <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] truncate">
                          {staff.role_title || 'Stylist'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[10px] font-bold text-[#D4A77F] block">
                        {staffAppts.length} Bookings
                      </span>
                      <span className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] font-variant-numeric tabular-nums block mt-0.5">
                        ₹{staffRev.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Time Slots Rows */}
              {Array.from(
                { length: Math.max(1, operatingHours.end - operatingHours.start + 1) },
                (_, i) => operatingHours.start + i
              ).map((hour) => {
                const hourFormatted = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
                const nextHourFormatted = `${hour + 1 > 12 ? hour + 1 - 12 : hour + 1}:00 ${hour + 1 >= 12 ? 'PM' : 'AM'}`;

                return (
                  <div key={hour} className="contents">
                    {/* Time Scale Label */}
                    <div className="p-2.5 bg-[#F9FAFB]/70 dark:bg-[#10141F]/70 border-b border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col justify-center items-center text-center">
                      <span className="text-[11px] font-bold text-[#1F2937] dark:text-white font-variant-numeric tabular-nums">
                        {hourFormatted}
                      </span>
                      <span className="text-[9px] text-[#6B7280] dark:text-[#A0A8B8]">
                        to {nextHourFormatted}
                      </span>
                    </div>

                    {/* Stylist Time Cells */}
                    {filteredStaff.map((staff) => {
                      const cellAppts = appointments.filter((a) => {
                        const apptDate = new Date(a.starts_at);
                        const matchesStaff = a.staff_id === staff.id || (filteredStaff.length === 1 && !a.staff_id);
                        return matchesStaff && apptDate.getHours() === hour;
                      });

                      return (
                        <div
                          key={staff.id}
                          className="p-2 sm:p-2.5 border-b border-[#E5E7EB] dark:border-[#2A2F3A] min-h-[96px] bg-white dark:bg-[#141926] hover:bg-[#F9FAFB]/60 dark:hover:bg-[#1C2230]/40 transition-colors flex flex-col justify-center relative group"
                        >
                          {cellAppts.length === 0 ? (
                            /* Empty Slot: Clickable to Book with this Stylist */
                            <button
                              type="button"
                              onClick={() => openCreateModal(`${hour.toString().padStart(2, '0')}:00`, calendarDate, staff.id)}
                              className="w-full h-full min-h-[64px] border border-dashed border-[#E5E7EB] dark:border-[#2A2F3A] hover:border-[#D4A77F] dark:hover:border-[#D4A77F] rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#D4A77F] hover:bg-[#D4A77F]/5 transition-all cursor-pointer group/btn"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#A0A8B8] group-hover/btn:text-[#D4A77F] group-hover/btn:scale-110 transition-transform" />
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                Book {staff.name.split(' ')[0]}
                              </span>
                            </button>
                          ) : (
                            /* Scheduled Appointment Cards */
                            <div className="space-y-2">
                              {cellAppts.map((appt) => {
                                const startDate = new Date(appt.starts_at);
                                const endDate = new Date(appt.ends_at);
                                const isArrived = appt.status === 'arrived';
                                const isDone = appt.status === 'done';
                                const isCancelled = appt.status === 'cancelled';
                                const isScheduled = appt.status === 'scheduled';

                                return (
                                  <div
                                    key={appt.id}
                                    className={`p-3 rounded-xl border transition-all shadow-xs flex flex-col justify-between ${
                                      isArrived
                                        ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700 ring-1 ring-amber-300/40'
                                        : isDone
                                        ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-700'
                                        : isCancelled
                                        ? 'bg-neutral-100/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 opacity-60'
                                        : 'bg-gradient-to-br from-white to-[#FFFBF7] dark:from-[#141926] dark:to-[#1A2030] border-[#D4A77F]/40 hover:border-[#D4A77F] shadow-sm'
                                    }`}
                                  >
                                    {/* Top Row: Time Range & Status Badge */}
                                    <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-black/5 dark:border-white/5">
                                      <span className="text-[11px] font-bold text-[#D4A77F] flex items-center gap-1 font-variant-numeric tabular-nums">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                          {startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                                          {endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </span>

                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                          isScheduled
                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                                            : isArrived
                                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 animate-pulse'
                                            : isDone
                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                        }`}
                                      >
                                        {isArrived ? 'In Chair' : appt.status}
                                      </span>
                                    </div>

                                    {/* Middle: Customer & Service */}
                                    <div className="py-2">
                                      <div className="font-bold text-xs sm:text-sm text-[#1F2937] dark:text-white truncate">
                                        {appt.customer_name}
                                      </div>
                                      <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] flex items-center gap-1 mt-0.5">
                                        <Phone className="w-2.5 h-2.5" />
                                        <span>+91 {appt.customer_mobile}</span>
                                      </div>

                                      <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                                        <span className="font-semibold text-[#1F2937] dark:text-neutral-200 truncate flex items-center gap-1">
                                          <Scissors className="w-2.5 h-2.5 text-[#D4A77F] shrink-0" />
                                          <span className="truncate">{appt.service_name}</span>
                                        </span>
                                        <span className="font-black text-[#D4A77F] shrink-0 font-variant-numeric tabular-nums">
                                          ₹{Number(appt.service_price).toLocaleString('en-IN')}
                                        </span>
                                      </div>

                                      {appt.note && (
                                        <p className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] italic mt-1 truncate">
                                          &ldquo;{appt.note}&rdquo;
                                        </p>
                                      )}
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-1">
                                      {isScheduled && (
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStatus(appt.id, 'arrived')}
                                          className="flex-1 py-1 px-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-[10px] font-bold transition-colors cursor-pointer text-center"
                                        >
                                          Seat In Chair
                                        </button>
                                      )}

                                      {(isScheduled || isArrived) && (
                                        <button
                                          type="button"
                                          onClick={() => handleStartSessionFromAppt(appt.id)}
                                          className="flex-1 py-1 px-2 rounded-lg bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-sans font-bold text-[10px] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                                        >
                                          <Play className="w-2.5 h-2.5 fill-current" />
                                          <span>Start POS</span>
                                        </button>
                                      )}

                                      {isDone && (
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Completed</span>
                                        </span>
                                      )}

                                      {/* WhatsApp Reminder Button */}
                                      <button
                                        type="button"
                                        onClick={() => sendWhatsAppReminder(appt)}
                                        title="Send WhatsApp Reminder"
                                        className="p-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] transition-colors cursor-pointer"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                      </button>

                                      {!isDone && !isCancelled && (
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                                          title="Cancel Appointment"
                                          className="p-1 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : viewMode === 'week' ? (
        /* ================= 2. 7-DAY MATRIX (WEEK VIEW) ================= */
        <div className="bg-white dark:bg-[#141926] rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-lg shadow-black/5 dark:shadow-black/25 overflow-hidden transition-colors">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#F9FAFB] to-white dark:from-[#10141F] dark:to-[#141926] border-b border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-[#1F2937] dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#D4A77F]" />
                <span>7-Day Salon Week Schedule</span>
              </h2>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">
                Overview across all 7 days with daily density and revenue targets
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B7280] dark:text-[#A0A8B8]">Week Total:</span>
              <span className="px-2.5 py-1 rounded-full bg-[#D4A77F] text-[#080B12] text-xs font-bold font-variant-numeric tabular-nums">
                {appointments.length} Bookings · ₹{dayTotalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[840px] grid grid-cols-7 divide-x divide-[#E5E7EB] dark:divide-[#2A2F3A]">
              {weekDays.map((d) => {
                const dayAppts = appointments.filter((a) => {
                  return a.starts_at.slice(0, 10) === d.dateStr;
                });
                const dayRev = dayAppts.reduce((sum, a) => sum + (a.status !== 'cancelled' ? Number(a.service_price || 0) : 0), 0);

                return (
                  <div key={d.dateStr} className="flex flex-col min-h-[460px]">
                    {/* Day Column Header */}
                    <div
                      className={`p-3 text-center border-b border-[#E5E7EB] dark:border-[#2A2F3A] transition-colors ${
                        d.isToday
                          ? 'bg-[#D4A77F]/15 dark:bg-[#D4A77F]/20'
                          : 'bg-[#F9FAFB] dark:bg-[#10141F]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-extrabold text-xs text-[#1F2937] dark:text-white">
                          {d.dayName}
                        </span>
                        {d.isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4A77F] animate-ping" />
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-[#6B7280] dark:text-[#A0A8B8]">
                        {d.formatted}
                      </div>

                      <div className="mt-1 flex items-center justify-center gap-1 text-[10px]">
                        <span className="font-bold text-[#D4A77F]">{dayAppts.length} appts</span>
                        <span className="text-neutral-400">·</span>
                        <span className="font-variant-numeric tabular-nums font-semibold text-[#1F2937] dark:text-white">₹{dayRev.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Day Appointments List */}
                    <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                      {dayAppts.length === 0 ? (
                        <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center p-3 text-[11px] text-[#9CA3AF]">
                          <span>No bookings</span>
                          <button
                            type="button"
                            onClick={() => openCreateModal('11:00', d.dateStr)}
                            className="mt-2 px-2 py-1 rounded-lg border border-dashed border-[#D4A77F]/40 hover:border-[#D4A77F] text-[#D4A77F] text-[10px] font-semibold cursor-pointer"
                          >
                            + Book Slot
                          </button>
                        </div>
                      ) : (
                        dayAppts.map((appt) => {
                          const timeStr = new Date(appt.starts_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <div
                              key={appt.id}
                              className="p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] hover:border-[#D4A77F] dark:hover:border-[#D4A77F] shadow-2xs transition-all space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-[#D4A77F] font-variant-numeric tabular-nums">
                                  {timeStr}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase ${
                                    appt.status === 'scheduled'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                      : appt.status === 'arrived'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                      : appt.status === 'done'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                      : 'bg-neutral-200 text-neutral-600'
                                  }`}
                                >
                                  {appt.status}
                                </span>
                              </div>

                              <div className="font-bold text-xs text-[#1F2937] dark:text-white truncate">
                                {appt.customer_name}
                              </div>

                              <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8] truncate flex items-center justify-between">
                                <span className="truncate">{appt.service_name}</span>
                                <span className="font-bold text-[#D4A77F] font-variant-numeric tabular-nums shrink-0">
                                  ₹{Number(appt.service_price).toLocaleString('en-IN')}
                                </span>
                              </div>

                              <div className="text-[9px] text-neutral-400 truncate pt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                <span>Stylist: {appt.staff_name}</span>
                                <button
                                  type="button"
                                  onClick={() => sendWhatsAppReminder(appt)}
                                  className="text-[#25D366] hover:opacity-80"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="w-2.5 h-2.5 inline" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        /* ================= 3. EMPTY STATE ================= */
        <div className="bg-white dark:bg-[#141926] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] p-12 text-center text-[#6B7280] dark:text-[#A0A8B8] text-sm">
          No appointments found matching this date and status filter.
        </div>
      ) : (
        /* ================= 4. CARD LIST VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appt) => {
            const startDate = new Date(appt.starts_at);
            const endDate = new Date(appt.ends_at);

            return (
              <div
                key={appt.id}
                className="bg-white dark:bg-[#141926] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] p-4.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4A77F] font-variant-numeric tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6B7280] dark:text-[#A0A8B8]">
                        {startDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        appt.status === 'scheduled'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : appt.status === 'arrived'
                          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : appt.status === 'done'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>

                  <div className="pt-2.5">
                    <div className="font-bold text-base text-[#1F2937] dark:text-white">
                      {appt.customer_name}
                    </div>
                    <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>+91 {appt.customer_mobile}</span>
                    </div>
                  </div>

                  <div className="mt-3 bg-[#F9FAFB] dark:bg-[#10141F] p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1F2937] dark:text-white flex items-center gap-1.5">
                        <Scissors className="w-3 h-3 text-[#D4A77F]" />
                        <span>{appt.service_name}</span>
                      </span>
                      <span className="font-bold text-[#D4A77F] font-variant-numeric tabular-nums">
                        ₹{Number(appt.service_price).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#A0A8B8] pt-1 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-[#D4A77F]" />
                        <span>Stylist: <strong>{appt.staff_name}</strong></span>
                      </span>
                      <span>{appt.duration_min} mins</span>
                    </div>
                  </div>

                  {appt.note && (
                    <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] mt-2 italic">
                      &ldquo;{appt.note}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between gap-2">
                  {appt.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'arrived')}
                        className="py-1.5 px-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-800 dark:text-amber-200 font-semibold text-xs cursor-pointer transition-colors"
                      >
                        Seat In Chair
                      </button>
                      <button
                        onClick={() => handleStartSessionFromAppt(appt.id)}
                        className="py-1.5 px-3 rounded-lg bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-sans font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start POS</span>
                      </button>
                    </>
                  )}

                  {appt.status === 'arrived' && (
                    <>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>In Chair</span>
                      </span>
                      <button
                        onClick={() => handleStartSessionFromAppt(appt.id)}
                        className="py-1.5 px-3 rounded-lg bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-sans font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start POS</span>
                      </button>
                    </>
                  )}

                  {appt.status === 'done' && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed Treatment</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => sendWhatsAppReminder(appt)}
                    className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] transition-colors cursor-pointer"
                    title="Send WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>

                  {!appt.status.match(/done|cancelled/) && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg cursor-pointer"
                      title="Cancel appointment"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination for Card View */}
      {viewMode === 'cards' && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 mt-4 bg-white dark:bg-[#141926] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xs">
          <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">
            Showing page <span className="font-semibold text-[#1F2937] dark:text-white">{page}</span> of{' '}
            <span className="font-semibold text-[#1F2937] dark:text-white">{totalPages}</span> ({totalRecords} appointments)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] hover:bg-[#F9FAFB] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] hover:bg-[#F9FAFB] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: NEW APPOINTMENT ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141926] rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
              <h2 className="text-base font-bold text-[#1F2937] dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#D4A77F]" />
                <span>Book New Salon Appointment</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-[#1F2937] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Collision Error Alert */}
            {overlapError && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 font-medium flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-900 dark:text-amber-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-300">Stylist Collision Conflict:</p>
                  <p className="mt-0.5">{overlapError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="mt-4 space-y-4">
              {/* Customer Selector / Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-white">
                    Client Details
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomer(!isNewCustomer)}
                    className="text-xs text-[#D4A77F] hover:underline font-semibold cursor-pointer"
                  >
                    {isNewCustomer ? 'Select Existing Client' : '+ New Client'}
                  </button>
                </div>

                {isNewCustomer ? (
                  <div className="space-y-2 p-3 bg-[#F9FAFB] dark:bg-[#10141F] rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <input
                      type="text"
                      placeholder="Customer Full Name"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                    />
                    <input
                      type="tel"
                      placeholder="10-Digit Mobile (e.g. 9876543210)"
                      required
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                    />
                  </div>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    aria-label="Select existing customer"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                  >
                    <option value="">-- Choose Existing Client --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (+91 {c.mobile})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                  Treatment / Service
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  required
                  aria-label="Select service or treatment"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                >
                  <option value="">-- Choose Treatment --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_min} mins · ₹{s.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stylist Selection */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                  Assigned Stylist / Chair
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  required
                  aria-label="Select assigned stylist or chair"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                >
                  <option value="">-- Assign Stylist --</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role_title})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              </div>

              {/* End Time Preview */}
              {formDate && formTime && selectedServiceId && (
                <div className="p-2.5 rounded-xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs text-[#6B7280] dark:text-[#A0A8B8] flex items-center justify-between">
                  <span>Slot Duration: {duration} mins</span>
                  <span className="font-bold text-[#D4A77F]">
                    Estimated Finish: {getCalculatedEndTime()}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                  Booking Note / Special Request (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP client, preferred shampoo brand"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2F3A] bg-white dark:bg-[#141926] text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#6B7280] dark:text-[#A0A8B8] hover:bg-[#F9FAFB] dark:hover:bg-[#1C2230] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-sans font-semibold rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Checking Collision & Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
