'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import {
  Settings,
  Store,
  Calendar,
  Clock,
  Shield,
  Copy,
  ExternalLink,
  Check,
  Upload,
  Sparkles,
  Save,
  Phone,
  MapPin,
  AlertCircle,
  CalendarX,
  Trash2,
  Plus,
  Palmtree,
  Images,
  Receipt,
  Loader2,
} from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';
import { MAX_GALLERY_PHOTOS } from '@/lib/storage';

const DAYS_OF_WEEK = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'staff'>('owner');

  // Auto-dismiss feedback after 3 seconds
  useEffect(() => {
    if (errorMessage) {
      showToast(errorMessage, 'error');
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (saveSuccess) {
      showToast('Salon settings saved successfully!', 'success');
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Form fields
  const [salonId, setSalonId] = useState('');
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [planFlags, setPlanFlags] = useState<{ logo_upload?: boolean; custom_domain?: boolean } | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<
    Array<{ id: string; url: string; storage_path: string; sort_order: number }>
  >([]);

  // Booking settings
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [openTime, setOpenTime] = useState('10:00');
  const [closeTime, setCloseTime] = useState('19:00');
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [minAdvanceHours, setMinAdvanceHours] = useState(1);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14);
  const [cancelPolicyHours, setCancelPolicyHours] = useState(2);
  const [sendReminders, setSendReminders] = useState(true);
  const [invoicePrefix, setInvoicePrefix] = useState('');

  // Active section tab
  const [activeSection, setActiveSection] = useState<'salon' | 'booking' | 'invoicing' | 'holidays'>('salon');

  // Holidays & Closures state
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayDateType, setHolidayDateType] = useState<'single' | 'range'>('single');
  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [holidayNote, setHolidayNote] = useState('');
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(null);
  const [holidayMessage, setHolidayMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (holidayMessage) {
      showToast(holidayMessage.text, holidayMessage.type);
      const timer = setTimeout(() => setHolidayMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [holidayMessage]);

  async function loadHolidays() {
    try {
      setLoadingHolidays(true);
      const res = await fetch('/api/holidays');
      if (res.ok) {
        const json = await res.json();
        setHolidaysList(json.holidays || []);
      }
    } catch (err) {
      console.error('Failed to load holidays:', err);
    } finally {
      setLoadingHolidays(false);
    }
  }

  useEffect(() => {
    if (activeSection === 'holidays') {
      loadHolidays();
    }
  }, [activeSection]);

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!holidayTitle.trim() || !holidayStartDate) {
      setHolidayMessage({ type: 'error', text: 'Please enter a title and select a date.' });
      return;
    }
    setSavingHoliday(true);
    setHolidayMessage(null);
    try {
      const finalEnd = holidayDateType === 'single' ? holidayStartDate : (holidayEndDate || holidayStartDate);
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: holidayTitle.trim(),
          startDate: holidayStartDate,
          endDate: finalEnd,
          note: holidayNote.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save holiday');

      setHolidayMessage({ type: 'success', text: `Holiday "${holidayTitle}" scheduled! Clients will see this date as closed.` });
      setHolidayTitle('');
      setHolidayStartDate('');
      setHolidayEndDate('');
      setHolidayNote('');
      loadHolidays();
    } catch (err: any) {
      setHolidayMessage({ type: 'error', text: err.message });
    } finally {
      setSavingHoliday(false);
    }
  }

  async function handleDeleteHoliday(id: string) {
    if (!confirm('Are you sure you want to remove this holiday and restore regular booking slots?')) return;
    setDeletingHolidayId(id);
    try {
      const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadHolidays();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to delete holiday');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingHolidayId(null);
    }
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const s = data.salon;
        if (data.user?.role) setUserRole(data.user.role);

        if (s) {
          if (data.plan?.flags) setPlanFlags(data.plan.flags);
          setSalonId(s.id);
          setSlug(s.slug || '');
          setName(s.name || '');
          setAddress(s.address || '');
          setPhone(s.phone || '');
          setLogoUrl(s.logo_url || null);
          setGalleryPhotos(data.photos || []);
          setBookingEnabled(s.booking_enabled ?? true);
          setOpenTime(s.open_time ? s.open_time.slice(0, 5) : '10:00');
          setCloseTime(s.close_time ? s.close_time.slice(0, 5) : '19:00');
          setSlotMinutes(s.slot_minutes || 30);
          setBufferMinutes(s.buffer_minutes || 10);
          setWorkingDays(s.working_days || [1, 2, 3, 4, 5, 6]);
          setMinAdvanceHours(s.min_advance_hours || 1);
          setMaxAdvanceDays(s.max_advance_days || 14);
          setCancelPolicyHours(s.cancel_policy_hours !== undefined && s.cancel_policy_hours !== null ? Number(s.cancel_policy_hours) : 2);
          setSendReminders(s.send_reminders ?? true);
          setInvoicePrefix(s.invoice_prefix || '');

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(
                'salonpro_salon_info',
                JSON.stringify({
                  name: s.name,
                  slug: s.slug,
                  open_time: s.open_time,
                  close_time: s.close_time,
                })
              );
            } catch {}
            window.dispatchEvent(new CustomEvent('salon-settings-updated', { detail: s }));
          }
        }
      } catch (err) {
        setErrorMessage('Failed to load salon settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Gallery Photos Handlers
  async function handleAddGalleryPhoto(url: string, storagePath: string) {
    try {
      const res = await fetch('/api/settings/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, storage_path: storagePath }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save photo');
      }
      if (data.photo) {
        setGalleryPhotos((prev) => [...prev, data.photo]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error adding photo to gallery');
    }
  }

  async function handleDeleteGalleryPhoto(id: string, storagePath: string) {
    if (!confirm('Are you sure you want to delete this gallery photo?')) return;
    try {
      const res = await fetch('/api/settings/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, storage_path: storagePath }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete photo');
      }
      setGalleryPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setErrorMessage(err.message || 'Error deleting photo');
    }
  }

  // Toggle working day
  function toggleWorkingDay(day: number) {
    if (workingDays.includes(day)) {
      if (workingDays.length === 1) {
        alert('Salon must have at least one operating day');
        return;
      }
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  }

  // Copy public link
  function handleCopyLink() {
    const publicUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  function formatTimeForDb(timeStr: string): string {
    if (!timeStr) return '10:00:00';
    const parts = timeStr.trim().split(':');
    const h = (parts[0] || '10').padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    return `${h}:${m}:00`;
  }

  // Save Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const payload = {
        name,
        address,
        phone,
        logo_url: logoUrl,
        booking_enabled: bookingEnabled,
        open_time: formatTimeForDb(openTime),
        close_time: formatTimeForDb(closeTime),
        slot_minutes: Number(slotMinutes),
        buffer_minutes: Number(bufferMinutes),
        working_days: workingDays,
        min_advance_hours: Number(minAdvanceHours),
        max_advance_days: Number(maxAdvanceDays),
        cancel_policy_hours: Number(cancelPolicyHours),
        send_reminders: sendReminders,
        invoice_prefix: invoicePrefix.trim().toUpperCase() || null,
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      if (data.salon) {
        if (data.salon.open_time) setOpenTime(data.salon.open_time.slice(0, 5));
        if (data.salon.close_time) setCloseTime(data.salon.close_time.slice(0, 5));
        if (data.salon.name) setName(data.salon.name);
        if (data.salon.invoice_prefix !== undefined) setInvoicePrefix(data.salon.invoice_prefix || '');
      }

      // Notify layout and other components of updated timing & settings
      if (typeof window !== 'undefined') {
        if (data.salon) {
          try {
            localStorage.setItem('salonpro_salon_info', JSON.stringify(data.salon));
          } catch {}
        }
        window.dispatchEvent(new CustomEvent('salon-settings-updated', { detail: data.salon }));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#D4A77F] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-400 mt-3 font-medium">Loading settings...</p>
      </div>
    );
  }

  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-36 sm:pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">
            Salon Settings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Configure salon profile, working hours, and public booking portal
          </p>
        </div>

        {/* Save button in header for convenience */}
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving || userRole === 'staff'}
          title={userRole === 'staff' ? 'Only salon owners can modify settings' : 'Save Settings'}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all active:scale-95 self-start sm:self-auto cursor-pointer disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : userRole === 'staff' ? 'Owner Only' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Staff View Only Notice */}
      {userRole === 'staff' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs sm:text-sm flex items-center gap-3 font-medium">
          <Shield className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-200">Staff Member View (Read-Only)</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">You are viewing salon settings with operational staff access. Salon profile details, hours, and cancellation policies can only be saved by the salon owner.</p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2 font-medium animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Settings saved successfully! Changes take effect immediately on public booking.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-[#2A2F3A] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'salon', label: 'Salon Details', icon: Store },
          { id: 'booking', label: 'Booking & Timings', icon: Calendar },
          { id: 'invoicing', label: 'Invoice & Receipts', icon: Receipt },
          { id: 'holidays', label: 'Holidays & Closures', icon: Palmtree },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-sm'
                  : 'bg-white dark:bg-[#141926] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-[#2A2F3A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* ================= SECTION 1: SALON DETAILS ================= */}
        {activeSection === 'salon' && (
          <div className="bg-white dark:bg-[#141926] p-4 sm:p-8 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm space-y-6 transition-colors duration-200">
            <div>
              <h2 className="text-base font-bold text-[#1F2937] dark:text-white">Salon Information</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Public information shown to clients on digital invoices and booking
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Salon Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Salon Name <span className="text-[#D4A77F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:border-[#D4A77F] focus:ring-1 focus:ring-[#D4A77F]"
                  placeholder="e.g. Glow Studio"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Salon Address / Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:border-[#D4A77F] focus:ring-1 focus:ring-[#D4A77F]"
                    placeholder="e.g. 101, Titanium Square, Thaltej, Ahmedabad"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Contact Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm font-mono focus:outline-none focus:border-[#D4A77F] focus:ring-1 focus:ring-[#D4A77F]"
                    placeholder="+91 98250 12345"
                  />
                </div>
              </div>

              {/* Unique Slug */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Booking Slug (Unique URL Path)
                </label>
                <input
                  type="text"
                  disabled
                  value={slug}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#10141F]/60 text-neutral-500 dark:text-neutral-400 font-mono text-sm cursor-not-allowed"
                />
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 block">
                  Slug is uniquely assigned to your salon studio.
                </span>
              </div>

              {/* Logo Upload Section */}
              <div className="pt-4 border-t border-neutral-100 dark:border-[#2A2F3A] sm:col-span-2">
                {planFlags && planFlags.logo_upload === false ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                        🔒
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1F2937] dark:text-white">Custom Logo Upload Locked</h4>
                        <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">Your current Basic plan does not support custom logo branding. Upgrade to Pro to add your salon logo.</p>
                      </div>
                    </div>
                    <Link href="/app/subscription" className="px-3 py-1.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold shrink-0 shadow-xs">
                      Upgrade ➔
                    </Link>
                  </div>
                ) : (
                  <ImageUploader
                    mode="logo"
                    type="logo"
                    value={logoUrl}
                    onChange={(newUrl) => setLogoUrl(newUrl)}
                    onRemove={() => setLogoUrl(null)}
                    label="Salon Logo (Optional)"
                    helperText="Square or horizontal image recommended (WebP/JPEG, max 60KB). Displayed on receipts, invoices, and booking pages."
                  />
                )}
              </div>

              {/* Salon Photos Gallery Section */}
              <div className="pt-6 border-t border-neutral-100 dark:border-[#2A2F3A] sm:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                      <Images className="w-4 h-4 text-[#D4A77F]" />
                      <span>Salon Photos Gallery</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#10141F] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-mono font-normal">
                        {galleryPhotos.length} / {MAX_GALLERY_PHOTOS}
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Showcase your salon ambience, workstations, and equipment to clients (Max {MAX_GALLERY_PHOTOS} photos).
                    </p>
                  </div>
                </div>

                {/* Photos Grid */}
                {galleryPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
                    {galleryPhotos.map((photo, idx) => (
                      <div
                        key={photo.id || idx}
                        className="group relative aspect-4/3 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 shadow-xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`Salon photo ${idx + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteGalleryPhoto(photo.id, photo.storage_path)}
                            className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                            title="Delete photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] text-white font-mono">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Photo / Upload Box */}
                {galleryPhotos.length < MAX_GALLERY_PHOTOS ? (
                  <div className="bg-neutral-50/70 dark:bg-[#10141F]/60 p-3.5 sm:p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
                    <ImageUploader
                      mode="default"
                      type="gallery"
                      onChange={async (newUrl, storagePath) => {
                        if (!newUrl || !storagePath) return;
                        await handleAddGalleryPhoto(newUrl, storagePath);
                      }}
                      label="Add Photo to Gallery"
                      helperText="Upload a photo (JPG/PNG/WebP, max 5MB before compression). Automatically optimized up to 1200px."
                    />
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Maximum limit reached ({MAX_GALLERY_PHOTOS}/{MAX_GALLERY_PHOTOS} photos). Delete a photo above to upload a new one.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 2: BOOKING & TIMINGS ================= */}
        {activeSection === 'booking' && (
          <div className="bg-white dark:bg-[#141926] p-4 sm:p-8 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm space-y-6 transition-colors duration-200">
            {/* Public Link Box */}
            <div className="bg-neutral-50 dark:bg-[#10141F] p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-[#2A2F3A]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                    Your Public Booking URL
                  </span>
                  <div className="text-sm font-mono font-bold text-neutral-800 dark:text-neutral-100 mt-0.5 break-all">
                    {publicLink}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141926] border border-neutral-200 dark:border-[#2A2F3A] text-neutral-700 dark:text-neutral-200 text-xs font-semibold shadow-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <Link
                    href={`/${slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4A77F] text-[#080B12] font-bold text-xs shadow-xs hover:bg-[#B8905F] transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </Link>
                </div>
              </div>

              {/* Enable / Disable Online Booking Switch */}
              <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-[#2A2F3A] flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#1F2937] dark:text-white">Accept Online Client Bookings</span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    When disabled, the public page displays &quot;Booking is closed&quot;
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingEnabled}
                    onChange={(e) => setBookingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <h3 className="text-sm font-bold text-[#1F2937] dark:text-white mb-3">Operating Hours</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                    Opening Time (Daily start)
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                    Closing Time (Daily end)
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              </div>
            </div>

            {/* Working Days */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-2">
                Salon Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const isOpen = workingDays.includes(d.day);
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => toggleWorkingDay(d.day)}
                      className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isOpen
                          ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-sm'
                          : 'bg-neutral-100 dark:bg-[#10141F] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-transparent dark:border-[#2A2F3A]'
                      }`}
                    >
                      {d.label} {isOpen ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5">
                Slots on unchecked days will be marked &quot;Closed&quot; on public booking
              </p>
            </div>

            {/* Slot & Buffer Settings */}
            <div className="pt-4 border-t border-neutral-100 dark:border-[#2A2F3A] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Slot Interval Step (Minutes)
                </label>
                <select
                  value={slotMinutes}
                  onChange={(e) => setSlotMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4A77F]"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Buffer Gap Between Appointments (Minutes)
                </label>
                <select
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4A77F]"
                >
                  <option value={0}>No buffer (0 mins)</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Minimum Advance Notice (Hours)
                </label>
                <input
                  type="number"
                  min={0}
                  max={48}
                  value={minAdvanceHours}
                  onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Maximum Advance Booking (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={maxAdvanceDays}
                  onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Customers can cancel/reschedule up to ___ hours before
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={cancelPolicyHours}
                    onChange={(e) => setCancelPolicyHours(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-[#D4A77F]"
                  />
                  <span className="absolute right-4 top-2.5 text-xs text-neutral-400 dark:text-neutral-500 font-medium">hours</span>
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                  0 = until start. Maximum 72 hours.
                </p>
              </div>
            </div>

            {/* WhatsApp Reminders toggle */}
            <div className="pt-4 border-t border-neutral-100 dark:border-[#2A2F3A] flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#1F2937] dark:text-white">Send WhatsApp Booking Reminders</span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Sends scheduled reminder message to customer 2 hours prior to visit
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendReminders}
                  onChange={(e) => setSendReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* ================= SECTION: INVOICE & RECEIPTS BRANDING ================= */}
        {activeSection === 'invoicing' && (
          <div className="bg-white dark:bg-[#141926] p-4 sm:p-8 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm space-y-6 transition-colors duration-200">
            <div>
              <h2 className="text-base font-bold text-[#1F2937] dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#D4A77F]" />
                <span>Invoice Numbering & Branding</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Customize your salon-branded invoice number format for POS bills and digital PDF receipts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Custom Invoice Prefix */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Custom Invoice Prefix
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder={
                      slug
                        ? slug.split('-')[0]?.toUpperCase() || 'SALON'
                        : name
                        ? name.trim().split(/\s+/)[0]?.toUpperCase() || 'SALON'
                        : 'SALON'
                    }
                    value={invoicePrefix}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                      setInvoicePrefix(val);
                    }}
                    disabled={userRole === 'staff'}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 dark:border-[#2A2F3A] bg-white dark:bg-[#1C2230] text-neutral-900 dark:text-white font-mono uppercase font-bold text-sm focus:border-[#D4A77F] focus:ring-1 focus:ring-[#D4A77F] outline-none transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500 disabled:opacity-60"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                  2 to 10 uppercase letters, numbers, or hyphens (e.g. <span className="font-semibold text-neutral-700 dark:text-neutral-200">PALAK</span>, <span className="font-semibold text-neutral-700 dark:text-neutral-200">DIXA</span>, <span className="font-semibold text-neutral-700 dark:text-neutral-200">GLAM</span>). If left blank, it automatically defaults to your salon name.
                </p>
              </div>

              {/* Live Preview Card */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-200 mb-1.5">
                  Live Preview on Invoices & Receipts
                </label>
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1C2230] border border-neutral-200 dark:border-[#2A2F3A] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">Generated Invoice Format:</span>
                    <span className="font-mono font-black text-sm text-[#8C5E2E] dark:text-[#D4A77F] px-2.5 py-0.5 rounded-lg bg-[#D4A77F]/10 border border-[#D4A77F]/30">
                      {invoicePrefix.trim()
                        ? `${invoicePrefix.trim()}-${new Date().getFullYear()}-0001`
                        : `${
                            slug
                              ? slug.split('-')[0]?.toUpperCase() || 'SALON'
                              : name
                              ? name.trim().split(/\s+/)[0]?.toUpperCase() || 'SALON'
                              : 'SALON'
                          }-${new Date().getFullYear()}-0001`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60 dark:border-[#2A2F3A]">
                    <span className="text-neutral-500 dark:text-neutral-400">Downloaded PDF Filename:</span>
                    <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 truncate max-w-[200px]" title={`${(name || 'Salon').trim().replace(/[^a-zA-Z0-9_-]/g, '_')}-${invoicePrefix.trim() || (slug ? slug.split('-')[0]?.toUpperCase() : 'SALON')}-${new Date().getFullYear()}-0001.pdf`}>
                      {`${(name || 'Salon').trim().replace(/[^a-zA-Z0-9_-]/g, '_')}-${
                        invoicePrefix.trim()
                          ? invoicePrefix.trim()
                          : slug
                          ? slug.split('-')[0]?.toUpperCase() || 'SALON'
                          : 'SALON'
                      }-${new Date().getFullYear()}-0001.pdf`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Callout */}
            <div className="p-4 rounded-2xl bg-[#D4A77F]/10 border border-[#D4A77F]/20 text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
              <div className="font-bold text-[#1F2937] dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A77F]" />
                <span>How SalonPro formats your receipts:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400 text-[11px]">
                <li>Every invoice sequence starts sequentially per salon and includes the current calendar year.</li>
                <li>Digital WhatsApp bills, PDF receipts, and client portal receipts will proudly display your customized salon prefix.</li>
                <li>Changing your prefix affects only new invoices and will never modify or break previous bills.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ================= SECTION 3: HOLIDAYS & TEMPORARY CLOSURES ================= */}
        {activeSection === 'holidays' && (
          <div className="space-y-6">
            {/* Holiday Notifications */}
            {holidayMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2 font-medium ${
                  holidayMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {holidayMessage.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{holidayMessage.text}</span>
              </div>
            )}

            {/* Schedule New Holiday Card */}
            <div className="bg-white dark:bg-[#141926] p-4 sm:p-8 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-bold text-[#1F2937] dark:text-white flex items-center gap-2">
                  <Palmtree className="w-5 h-5 text-[#D4A77F]" />
                  <span>Schedule Salon Holiday or Temporary Closure</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Block online bookings on specific dates or multi-day vacation periods. Customers will see these dates marked as closed with your custom note.
                </p>
              </div>

              {/* Quick Preset Badges */}
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                  Quick Suggestions
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Diwali Holiday',
                    'Holi Festival',
                    'Eid Holiday',
                    'Annual Staff Vacation',
                    'Salon Renovation & Cleaning',
                    'Emergency Maintenance',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setHolidayTitle(preset)}
                      className="px-2.5 py-1 text-xs rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-neutral-50 dark:bg-[#10141F] text-neutral-700 dark:text-neutral-300 hover:border-[#D4A77F] hover:text-[#D4A77F] transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Holiday / Closure Reason *
                  </label>
                  <input
                    type="text"
                    value={holidayTitle}
                    onChange={(e) => setHolidayTitle(e.target.value)}
                    placeholder="e.g. Diwali Vacation, Shop Renovation, Special Event"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>

                {/* Single Day vs Date Range Toggle */}
                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Duration:
                  </label>
                  <div className="inline-flex p-1 rounded-xl bg-neutral-100 dark:bg-[#10141F] border border-neutral-200 dark:border-[#2A2F3A]">
                    <button
                      type="button"
                      onClick={() => setHolidayDateType('single')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        holidayDateType === 'single'
                          ? 'bg-[#D4A77F] text-black shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Single Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setHolidayDateType('range')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        holidayDateType === 'range'
                          ? 'bg-[#D4A77F] text-black shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Date Range (Multi-Day)
                    </button>
                  </div>
                </div>

                {/* Date pickers */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {holidayDateType === 'single' ? 'Closed Date *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    value={holidayStartDate}
                    onChange={(e) => setHolidayStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>

                {holidayDateType === 'range' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      End Date (Reopens after) *
                    </label>
                    <input
                      type="date"
                      value={holidayEndDate}
                      onChange={(e) => setHolidayEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#D4A77F]"
                    />
                  </div>
                )}

                {/* Note for clients */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Client Notice Note <span className="text-neutral-400 font-normal">(Optional - shown to clients on booking page)</span>
                  </label>
                  <input
                    type="text"
                    value={holidayNote}
                    onChange={(e) => setHolidayNote(e.target.value)}
                    placeholder="e.g. Wishing you a wonderful festival! We will reopen on Monday at 10:00 AM."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#10141F] text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddHoliday}
                  disabled={savingHoliday}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {savingHoliday ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{savingHoliday ? 'Scheduling...' : 'Save & Block Booking Slots'}</span>
                </button>
              </div>
            </div>

            {/* List of Scheduled Holidays */}
            <div className="bg-white dark:bg-[#141926] p-4 sm:p-8 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1F2937] dark:text-white">
                    Scheduled Holidays & Closures ({holidaysList.length})
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Active date blocks where clients cannot book appointments
                  </p>
                </div>
              </div>

              {loadingHolidays ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-[#D4A77F] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-neutral-400 mt-2">Loading holidays...</p>
                </div>
              ) : holidaysList.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-neutral-200 dark:border-[#2A2F3A] rounded-2xl">
                  <CalendarX className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    No upcoming holidays or temporary closures scheduled
                  </p>
                  <p className="text-[11px] text-neutral-400 max-w-xs mx-auto mt-1">
                    Your salon is open according to regular weekly working days. Add a holiday above whenever you plan to take a break or close the shop.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-[#2A2F3A]">
                  {holidaysList.map((h) => {
                    const isSingleDay = h.start_date === h.end_date;
                    const startDateObj = new Date(h.start_date);
                    const endDateObj = new Date(h.end_date);
                    const diffDays = Math.round(
                      (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
                    ) + 1;

                    return (
                      <div
                        key={h.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#D4A77F]/15 text-[#B8905F] dark:text-[#D4A77F] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                            <Palmtree className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                {h.title}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/20">
                                {isSingleDay ? '1 Day Closed' : `${diffDays} Days Closed`}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#D4A77F]" />
                              <span>
                                {isSingleDay
                                  ? startDateObj.toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : `${startDateObj.toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })} to ${endDateObj.toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}`}
                              </span>
                            </div>
                            {h.note && (
                              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 italic">
                                &ldquo;{h.note}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id)}
                          disabled={deletingHolidayId === h.id}
                          className="self-end sm:self-auto p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove holiday & reopen bookings"
                        >
                          {deletingHolidayId === h.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Actions for Salon and Booking Tabs */}
        {activeSection !== 'holidays' && (
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] disabled:opacity-50 disabled:cursor-not-allowed text-[#080B12] font-black text-sm shadow-lg shadow-[#D4A77F]/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#080B12]" />
              ) : (
                <Save className="w-4 h-4 text-[#080B12]" />
              )}
              <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
