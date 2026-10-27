'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Store,
  Palette,
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
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Berry Rose', hex: '#b3135b' },
  { name: 'Royal Violet', hex: '#7c3aed' },
  { name: 'Emerald Spa', hex: '#059669' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Midnight Blue', hex: '#2563eb' },
  { name: 'Classic Slate', hex: '#334155' },
];

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

  // Form fields
  const [salonId, setSalonId] = useState('');
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [brandColor, setBrandColor] = useState('#b3135b');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Booking settings
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [openTime, setOpenTime] = useState('10:00');
  const [closeTime, setCloseTime] = useState('19:00');
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [minAdvanceHours, setMinAdvanceHours] = useState(1);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14);
  const [sendReminders, setSendReminders] = useState(true);

  // Active section tab
  const [activeSection, setActiveSection] = useState<'salon' | 'branding' | 'booking'>('salon');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const s = data.salon;

        if (s) {
          setSalonId(s.id);
          setSlug(s.slug || '');
          setName(s.name || '');
          setAddress(s.address || '');
          setPhone(s.phone || '');
          setBrandColor(s.brand_color || '#b3135b');
          setLogoUrl(s.logo_url || null);
          setBookingEnabled(s.booking_enabled ?? true);
          setOpenTime(s.open_time ? s.open_time.slice(0, 5) : '10:00');
          setCloseTime(s.close_time ? s.close_time.slice(0, 5) : '19:00');
          setSlotMinutes(s.slot_minutes || 30);
          setBufferMinutes(s.buffer_minutes || 10);
          setWorkingDays(s.working_days || [1, 2, 3, 4, 5, 6]);
          setMinAdvanceHours(s.min_advance_hours || 1);
          setMaxAdvanceDays(s.max_advance_days || 14);
          setSendReminders(s.send_reminders ?? true);
        }
      } catch (err) {
        setErrorMessage('Failed to load salon settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Handle Logo Upload (base64 data URL)
  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
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
        brand_color: brandColor,
        logo_url: logoUrl,
        booking_enabled: bookingEnabled,
        open_time: `${openTime}:00`,
        close_time: `${closeTime}:00`,
        slot_minutes: Number(slotMinutes),
        buffer_minutes: Number(bufferMinutes),
        working_days: workingDays,
        min_advance_hours: Number(minAdvanceHours),
        max_advance_days: Number(maxAdvanceDays),
        send_reminders: sendReminders,
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update settings');
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
        <div className="w-10 h-10 border-4 border-[#b3135b] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-400 mt-3 font-medium">Loading settings...</p>
      </div>
    );
  }

  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a1630] tracking-tight">
            Settings & Branding
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Configure salon details, brand color theme, and public booking portal
          </p>
        </div>

        {/* Save button in header for convenience */}
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#b3135b] hover:bg-[#99104e] disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 font-medium animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully! Changes take effect immediately on public booking.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
        {[
          { id: 'salon', label: 'Salon Details', icon: Store },
          { id: 'branding', label: 'Branding & Theme', icon: Palette },
          { id: 'booking', label: 'Booking & Timings', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#b3135b] text-white shadow-sm'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#2a1630]">Salon Information</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Public information shown to clients on digital invoices and booking
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Salon Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Salon Name <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b] focus:ring-1 focus:ring-[#b3135b]"
                  placeholder="e.g. Glow Studio"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Salon Address / Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b] focus:ring-1 focus:ring-[#b3135b]"
                    placeholder="e.g. 101, Titanium Square, Thaltej, Ahmedabad"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Contact Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-mono focus:outline-none focus:border-[#b3135b] focus:ring-1 focus:ring-[#b3135b]"
                    placeholder="+91 98250 12345"
                  />
                </div>
              </div>

              {/* Unique Slug */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Booking Slug (Unique URL Path)
                </label>
                <input
                  type="text"
                  disabled
                  value={slug}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-500 font-mono text-sm cursor-not-allowed"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Slug is fixed for this studio demo.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 2: BRANDING & THEME ================= */}
        {activeSection === 'branding' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#2a1630]">Branding & Theme Colors</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Customize your salon&apos;s brand accent color across the client booking portal and receipts
              </p>
            </div>

            {/* Brand Color Presets */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                Brand Accent Palette
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                {COLOR_PRESETS.map((p) => {
                  const isSelected = brandColor.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setBrandColor(p.hex)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm scale-102 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: p.hex }}
                        className="w-8 h-8 rounded-full shadow-inner border border-black/10 flex items-center justify-center text-white text-xs font-bold"
                      >
                        {isSelected && '✓'}
                      </span>
                      <span className="text-xs font-semibold text-neutral-700">{p.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Color Picker */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200 max-w-sm">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                />
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Custom Hex</span>
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="font-mono text-xs font-bold uppercase text-neutral-800 bg-transparent focus:outline-none"
                    placeholder="#b3135b"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="pt-4 border-t border-neutral-100">
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                Salon Logo
              </label>

              <div className="flex items-center gap-4">
                <div
                  style={{ backgroundColor: brandColor }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-md overflow-hidden relative"
                >
                  {logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={logoUrl} alt="Salon Logo" className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0)
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold cursor-pointer border border-neutral-200 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFile}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="block text-[11px] text-rose-600 hover:underline font-medium"
                    >
                      Remove logo (use initial)
                    </button>
                  )}
                  <p className="text-[10px] text-neutral-400">
                    Recommended: Square PNG or JPG, max 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 3: BOOKING & TIMINGS ================= */}
        {activeSection === 'booking' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            {/* Public Link Box */}
            <div className="bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Your Public Booking URL
                  </span>
                  <div className="text-sm font-mono font-bold text-neutral-800 mt-0.5 break-all">
                    {publicLink}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold shadow-xs hover:bg-neutral-50 transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <Link
                    href={`/${slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#b3135b] text-white text-xs font-semibold shadow-xs hover:bg-[#99104e] transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </Link>
                </div>
              </div>

              {/* Enable / Disable Online Booking Switch */}
              <div className="mt-4 pt-4 border-t border-neutral-200/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#2a1630]">Accept Online Client Bookings</span>
                  <p className="text-[11px] text-neutral-500">
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
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <h3 className="text-sm font-bold text-[#2a1630] mb-3">Operating Hours</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Opening Time (Daily start)
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-mono focus:outline-none focus:border-[#b3135b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Closing Time (Daily end)
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-mono focus:outline-none focus:border-[#b3135b]"
                  />
                </div>
              </div>
            </div>

            {/* Working Days */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-2">
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
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                        isOpen
                          ? 'bg-[#b3135b] text-white shadow-sm'
                          : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {d.label} {isOpen ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-neutral-400 mt-1.5">
                Slots on unchecked days will be marked &quot;Closed&quot; on public booking
              </p>
            </div>

            {/* Slot & Buffer Settings */}
            <div className="pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Slot Interval Step (Minutes)
                </label>
                <select
                  value={slotMinutes}
                  onChange={(e) => setSlotMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Buffer Gap Between Appointments (Minutes)
                </label>
                <select
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                >
                  <option value={0}>No buffer (0 mins)</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Minimum Advance Notice (Hours)
                </label>
                <input
                  type="number"
                  min={0}
                  max={48}
                  value={minAdvanceHours}
                  onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Maximum Advance Booking (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={maxAdvanceDays}
                  onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                />
              </div>
            </div>

            {/* WhatsApp Reminders toggle */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#2a1630]">Send WhatsApp Booking Reminders</span>
                <p className="text-[11px] text-neutral-500">
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
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-[#b3135b] hover:bg-[#99104e] disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-[#b3135b]/25 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
