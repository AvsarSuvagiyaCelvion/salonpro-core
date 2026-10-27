'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration_min: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
  role_title: string | null;
}

interface Salon {
  id: string;
  name: string;
  slug: string;
  brand_color: string;
  logo_url: string | null;
  open_time: string;
  close_time: string;
  working_days: number[];
  slot_minutes: number;
  buffer_minutes: number;
  min_advance_hours: number;
  max_advance_days: number;
  phone?: string;
  booking_enabled?: boolean;
}

interface Slot {
  time: string;
  formattedTime: string;
  staffId: string;
  staffName: string;
}

export default function BookingWizard({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffServices, setStaffServices] = useState<{ staff_id: string; service_id: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('anyone');
  
  // Date & Slot state
  const [availableDates, setAvailableDates] = useState<{ dateStr: string; label: string; dayName: string; isClosed: boolean }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);

  // Customer Details & Code
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [bookingNote, setBookingNote] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('1234');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Customer Session & Auth
  const [activeCustomer, setActiveCustomer] = useState<{ id: string; name: string; mobile: string } | null>(null);
  const [customerAuthMode, setCustomerAuthMode] = useState<'new' | 'existing'>('new');
  const [loginPin, setLoginPin] = useState<string>('1234');
  const [verifyingLogin, setVerifyingLogin] = useState<boolean>(false);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Check if customer is already logged in
  useEffect(() => {
    async function checkCustomerAuth() {
      try {
        const res = await fetch('/api/customer/auth');
        const data = await res.json();
        if (data.loggedIn && data.customer) {
          setActiveCustomer(data.customer);
          setCustomerName(data.customer.name);
          setCustomerMobile(data.customer.mobile);
        }
      } catch {}
    }
    checkCustomerAuth();
  }, []);

  // 1. Fetch Salon info
  useEffect(() => {
    async function loadSalon() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/${slug}`);
        if (!res.ok) {
          throw new Error('Salon not found or unavailable');
        }
        const data = await res.json();
        setSalon(data.salon);
        setServices(data.services || []);
        setStaffList(data.staff || []);
        setStaffServices(data.staffServices || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load salon details');
      } finally {
        setLoading(false);
      }
    }
    loadSalon();
  }, [slug]);

  // 2. Generate date range when salon loads
  useEffect(() => {
    if (!salon) return;
    const dates: { dateStr: string; label: string; dayName: string; isClosed: boolean }[] = [];
    const maxDays = salon.max_advance_days || 14;
    const workingDays = salon.working_days || [1, 2, 3, 4, 5, 6];

    for (let i = 0; i < maxDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();
      const isClosed = !workingDays.includes(dayOfWeek);

      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });

      dates.push({ dateStr, label, dayName, isClosed });
    }

    setAvailableDates(dates);
    // Default select first open date
    const firstOpen = dates.find((d) => !d.isClosed);
    if (firstOpen) {
      setSelectedDate(firstOpen.dateStr);
    }
  }, [salon]);

  // 3. Fetch Slots when Service, Staff, or Date changes
  useEffect(() => {
    if (!salon || !selectedService || !selectedDate) return;

    let isMounted = true;
    async function fetchSlots() {
      setSlotsLoading(true);
      setSlotNotice(null);
      try {
        const url = `/api/public/${slug}/slots?service_id=${selectedService!.id}&staff_id=${selectedStaffId}&date=${selectedDate}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch slots');
        }

        if (data.isClosedDay) {
          setAvailableSlots([]);
          setSlotNotice('Salon is closed on this day. Please select another date.');
        } else if (!data.slots || data.slots.length === 0) {
          setAvailableSlots([]);
          setSlotNotice('No free slots available for this combination. Please try another specialist or date.');
        } else {
          setAvailableSlots(data.slots);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setSlotNotice(err.message || 'Unable to calculate free slots');
        setAvailableSlots([]);
      } finally {
        if (isMounted) setSlotsLoading(false);
      }
    }

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [salon, selectedService?.id, selectedStaffId, selectedDate, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-neutral-400 text-sm font-medium">Loading salon booking portal...</p>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-2xl font-bold mb-4">
          !
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Salon Not Found</h1>
        <p className="text-neutral-400 text-sm max-w-sm">{error || 'This salon does not exist.'}</p>
      </div>
    );
  }

  if (salon.booking_enabled === false) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-3xl mb-4 shadow-xl">
          🔒
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Booking is closed</h1>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">
          Online appointments for {salon.name} are currently paused by the salon manager.
        </p>
        <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-xs text-neutral-300">
          For inquiries or appointments, please call the salon at:
          <span className="block text-sm font-bold text-pink-400 mt-1 font-mono">
            {salon.phone || '+91 98250 12345'}
          </span>
        </div>
      </div>
    );
  }

  // Filter staff who can do the selected service
  const eligibleStaffList = staffList.filter((st) => {
    if (!selectedService) return true;
    const mappingsForStaff = staffServices.filter((m) => m.staff_id === st.id);
    if (mappingsForStaff.length === 0) return true;
    return mappingsForStaff.some((m) => m.service_id === selectedService.id);
  });

  // Unique categories
  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices = selectedCategory === 'All'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  const brandColor = salon.brand_color || '#b3135b';

  // Quick Customer Login Handler
  async function handleCustomerQuickLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const clean = customerMobile.trim().replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setVerifyingLogin(true);
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          mobile: clean,
          pin: loginPin || '1234',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Customer not found or invalid PIN. Please check details or select Sign Up.');
      }
      setActiveCustomer(data.customer);
      setCustomerName(data.customer.name);
      setCustomerMobile(data.customer.mobile);
      setVerificationCode(loginPin || '1234');
      setSubmitError(null);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setVerifyingLogin(false);
    }
  }

  // Handle booking form submission
  async function handleBookAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService) {
      setSubmitError('Please select a service first.');
      setCurrentStep(1);
      return;
    }

    if (!selectedSlot || !selectedDate) {
      setSubmitError('Please select an available time slot.');
      setCurrentStep(3);
      return;
    }

    if (!customerName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }

    if (!customerMobile.trim() || customerMobile.trim().length < 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (verificationCode.trim() !== '1234') {
      setSubmitError('Verification code must be 1234 (Demo code)');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        service_id: selectedService.id,
        staff_id: selectedSlot.staffId || selectedStaffId,
        date: selectedDate,
        time: selectedSlot.time,
        name: customerName,
        mobile: customerMobile,
        code: verificationCode,
        note: bookingNote,
      };

      const res = await fetch(`/api/public/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isOverlap) {
          // Rule requirement: "If two people book the same slot, the second sees 'This time was just taken, please pick another' and goes back to the times."
          setSubmitError(data.error);
          setCurrentStep(3); // Send back to step 3 (Time slots)
          return;
        }
        throw new Error(data.error || 'Failed to complete appointment booking');
      }

      setConfirmedBooking(data);
      setCurrentStep(5); // Confirmation screen
    } catch (err: any) {
      setSubmitError(err.message || 'Error occurred while saving booking');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Top Salon Hero Banner */}
      <div 
        className="relative overflow-hidden border-b border-neutral-800"
        style={{
          background: `radial-gradient(ellipse at top, ${brandColor}40 0%, #0a0a0a 75%)`,
        }}
      >
        {/* Top Right Portal Button */}
        <div className="absolute top-4 right-4 z-20">
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all shadow-sm"
          >
            {activeCustomer ? (
              <>
                <span>👤 {activeCustomer.name.split(' ')[0]}</span>
                <span className="text-[10px] text-pink-300 font-bold">My Records</span>
              </>
            ) : (
              <span>Client Portal / Login →</span>
            )}
          </Link>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-8 pb-6 text-center">
          <div 
            className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center font-bold text-3xl shadow-xl border border-white/20 mb-3"
            style={{ backgroundColor: brandColor, color: '#ffffff' }}
          >
            {salon.name.charAt(0)}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{salon.name}</h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 flex items-center justify-center gap-2">
            <span>✨ Premium Beauty & Hair Studio</span>
            <span>·</span>
            <span className="text-emerald-400 font-medium">Open {salon.open_time.slice(0, 5)} - {salon.close_time.slice(0, 5)}</span>
          </p>

          {/* Stepper Progress Bar */}
          {currentStep <= 4 && (
            <div className="mt-6 flex items-center justify-center gap-2 max-w-xs mx-auto">
              {[
                { num: 1, label: 'Service' },
                { num: 2, label: 'Stylist' },
                { num: 3, label: 'Time' },
                { num: 4, label: 'Confirm' },
              ].map((st) => (
                <div key={st.num} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                      currentStep >= st.num ? 'bg-pink-500' : 'bg-neutral-800'
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1 font-medium transition-colors ${
                      currentStep >= st.num ? 'text-pink-400' : 'text-neutral-500'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Booking Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 pb-24">
        {submitError && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1 font-medium">{submitError}</div>
          </div>
        )}

        {/* STEP 1: SELECT SERVICE */}
        {currentStep === 1 && (
          <div>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">1. Select a Service</h2>
                <p className="text-xs text-neutral-400">Choose from our curated range of treatments</p>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Service Cards Grid */}
            <div className="space-y-3">
              {filteredServices.map((svc) => {
                const isSelected = selectedService?.id === svc.id;
                return (
                  <div
                    key={svc.id}
                    onClick={() => setSelectedService(svc)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? 'bg-neutral-900 border-pink-500 ring-2 ring-pink-500/20'
                        : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-white">{svc.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 font-medium">
                          {svc.category}
                        </span>
                      </div>
                      {svc.description && (
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{svc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                        <span className="flex items-center gap-1 text-pink-400 font-medium">
                          ⏱ {svc.duration_min} mins
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-white">
                        ₹{Number(svc.price).toLocaleString('en-IN')}
                      </div>
                      <button
                        type="button"
                        className={`mt-2 px-3.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-pink-500 text-white shadow-md'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {isSelected ? 'Selected ✓' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Next Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-950/90 backdrop-blur-md border-t border-neutral-800 z-10 flex justify-center">
              <div className="max-w-2xl w-full flex justify-between items-center">
                <div>
                  {selectedService ? (
                    <div>
                      <span className="text-xs text-neutral-400">Selected:</span>
                      <div className="text-sm font-bold text-white">{selectedService.name} (₹{Number(selectedService.price)})</div>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-500">Pick a service to continue</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!selectedService}
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-lg shadow-pink-500/25 active:scale-95"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT SPECIALIST */}
        {currentStep === 2 && (
          <div>
            <div className="flex justify-between items-end mb-4">
              <div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-pink-400 hover:underline mb-1 inline-block"
                >
                  ← Back to Services
                </button>
                <h2 className="text-lg font-bold text-white">2. Choose Your Specialist</h2>
                <p className="text-xs text-neutral-400">
                  Select a specific stylist or choose anyone for maximum availability
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Anyone Option */}
              <div
                onClick={() => setSelectedStaffId('anyone')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedStaffId === 'anyone'
                    ? 'bg-neutral-900 border-pink-500 ring-2 ring-pink-500/20'
                    : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    ⚡
                  </div>
                  <div>
                    <div className="font-bold text-sm sm:text-base text-white">Any Available Specialist</div>
                    <div className="text-xs text-emerald-400 font-medium">Fastest availability · Recommended</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedStaffId === 'anyone' ? 'border-pink-500 bg-pink-500 text-white text-xs' : 'border-neutral-700'
                  }`}
                >
                  {selectedStaffId === 'anyone' && '✓'}
                </div>
              </div>

              {/* Individual Eligible Stylists */}
              {eligibleStaffList.map((st) => {
                const isSelected = selectedStaffId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStaffId(st.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-neutral-900 border-pink-500 ring-2 ring-pink-500/20'
                        : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-neutral-800 text-pink-400 flex items-center justify-center font-bold text-base border border-neutral-700">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-white">{st.name}</div>
                        <div className="text-xs text-neutral-400">{st.role_title || 'Stylist & Artist'}</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-pink-500 bg-pink-500 text-white text-xs' : 'border-neutral-700'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Next Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-950/90 backdrop-blur-md border-t border-neutral-800 z-10 flex justify-center">
              <div className="max-w-2xl w-full flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-2xl bg-neutral-900 text-neutral-300 text-xs font-semibold hover:bg-neutral-800"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold transition-all shadow-lg shadow-pink-500/25 active:scale-95"
                >
                  Select Date & Time →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SELECT DATE & TIME */}
        {currentStep === 3 && (
          <div>
            <div className="flex justify-between items-end mb-4">
              <div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-pink-400 hover:underline mb-1 inline-block"
                >
                  ← Back to Stylist
                </button>
                <h2 className="text-lg font-bold text-white">3. Pick Date & Available Slot</h2>
                <p className="text-xs text-neutral-400">
                  Real-time slots computed with buffer and opening hours
                </p>
              </div>
            </div>

            {/* Horizontal Date Picker */}
            <div className="mb-6">
              <label className="text-[11px] uppercase tracking-wider font-bold text-neutral-400 mb-2 block">
                Select Date
              </label>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {availableDates.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      disabled={d.isClosed}
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`flex flex-col items-center justify-center min-w-[70px] py-3 px-2 rounded-2xl border transition-all ${
                        d.isClosed
                          ? 'opacity-30 cursor-not-allowed bg-neutral-900/40 border-neutral-800'
                          : isSelected
                          ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/25 scale-105'
                          : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:bg-neutral-900'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-80">{d.dayName}</span>
                      <span className="text-base font-extrabold mt-0.5">{d.label.split(' ')[0]}</span>
                      {d.isClosed && <span className="text-[9px] text-rose-400 font-bold mt-0.5">Closed</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots Grid */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] uppercase tracking-wider font-bold text-neutral-400">
                  Available Slots ({availableSlots.length})
                </label>
                {selectedSlot && (
                  <span className="text-xs text-pink-400 font-semibold">
                    Selected: {selectedSlot.formattedTime}
                  </span>
                )}
              </div>

              {slotsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center bg-neutral-900/40 rounded-3xl border border-neutral-800">
                  <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-neutral-400 mt-3">Finding available free slots...</p>
                </div>
              ) : slotNotice ? (
                <div className="py-10 px-4 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800">
                  <span className="text-2xl block mb-2">🗓️</span>
                  <p className="text-xs sm:text-sm text-neutral-300 font-medium">{slotNotice}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-pink-500 border-pink-500 text-white font-bold shadow-lg shadow-pink-500/30 scale-102'
                            : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-semibold">{slot.formattedTime}</div>
                        {selectedStaffId === 'anyone' && (
                          <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-pink-100' : 'text-neutral-500'}`}>
                            {slot.staffName}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Floating Next Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-950/90 backdrop-blur-md border-t border-neutral-800 z-10 flex justify-center">
              <div className="max-w-2xl w-full flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-2xl bg-neutral-900 text-neutral-300 text-xs font-semibold hover:bg-neutral-800"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-lg shadow-pink-500/25 active:scale-95"
                >
                  Enter Details →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CUSTOMER DETAILS & DEMO CODE */}
        {currentStep === 4 && (
          <div>
            <div className="flex justify-between items-end mb-4">
              <div>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-xs text-pink-400 hover:underline mb-1 inline-block"
                >
                  ← Back to Slot Selection
                </button>
                <h2 className="text-lg font-bold text-white">4. Confirm Your Appointment</h2>
                <p className="text-xs text-neutral-400">
                  Please enter your contact information to receive confirmation
                </p>
              </div>
            </div>

            {/* Booking Summary Box */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 mb-6">
              <div className="text-[10px] uppercase font-bold tracking-wider text-pink-400 mb-2">
                Booking Summary
              </div>
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-3">
                <div>
                  <div className="font-bold text-base text-white">{selectedService?.name}</div>
                  <div className="text-xs text-neutral-400">
                    ⏱ {selectedService?.duration_min} mins · Stylist: {selectedSlot?.staffName}
                  </div>
                </div>
                <div className="text-right font-extrabold text-lg text-white">
                  ₹{Number(selectedService?.price).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="flex justify-between text-xs text-neutral-300">
                <span>🗓️ Date & Time:</span>
                <span className="font-bold text-white">
                  {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  at {selectedSlot?.formattedTime}
                </span>
              </div>
            </div>

            {/* Customer Authentication State & Options */}
            {activeCustomer ? (
              <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-pink-500/10 border border-emerald-500/30 rounded-3xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
                    ✓
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <span>Verified Customer Account</span>
                    </div>
                    <div className="text-base font-extrabold text-white">
                      {activeCustomer.name}{' '}
                      <span className="font-mono text-neutral-400 text-xs font-normal">
                        (+91 {activeCustomer.mobile})
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Your booking and digital invoice will automatically save to your customer portal.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/customer/logout', { method: 'POST' });
                    setActiveCustomer(null);
                    setCustomerName('');
                    setCustomerMobile('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold self-start sm:self-auto transition-all"
                >
                  Switch / Log Out
                </button>
              </div>
            ) : (
              <div className="mb-5">
                <div className="flex rounded-2xl bg-neutral-900 border border-neutral-800 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerAuthMode('new');
                      setSubmitError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      customerAuthMode === 'new'
                        ? 'bg-pink-500 text-white shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    ✨ New Customer (Sign Up & Book)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerAuthMode('existing');
                      setSubmitError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      customerAuthMode === 'existing'
                        ? 'bg-pink-500 text-white shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    🔑 Returning Customer (Login)
                  </button>
                </div>

                {customerAuthMode === 'existing' && (
                  <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 mb-4 space-y-3">
                    <div className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                      Quick Login to Autofill Profile
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                          Registered Mobile Number
                        </label>
                        <input
                          type="tel"
                          placeholder="9898023456"
                          value={customerMobile}
                          onChange={(e) => setCustomerMobile(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] font-semibold text-neutral-300">
                            4-Digit Security PIN
                          </label>
                          <span className="text-[10px] text-pink-400 font-mono">Demo: 1234</span>
                        </div>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="1234"
                          value={loginPin}
                          onChange={(e) => setLoginPin(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white text-center font-mono focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={verifyingLogin}
                      onClick={handleCustomerQuickLogin}
                      className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-neutral-700"
                    >
                      {verifyingLogin ? 'Verifying...' : 'Verify & Load My Profile ➔'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Your Full Name <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Joshi"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Mobile Number (WhatsApp) <span className="text-pink-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm text-neutral-500 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    placeholder="9898023456"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-14 pr-4 py-3 text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Special Request or Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. First time visiting, prefer sensitive skin products"
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* 4-digit verification code with demo indicator */}
              <div className="bg-pink-500/10 border border-pink-500/30 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-pink-300">
                    4-Digit Verification PIN
                  </label>
                  <span className="text-[10px] font-mono bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-bold">
                    Demo PIN: 1234
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full bg-neutral-900/90 border border-pink-500/40 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest text-white focus:outline-none focus:border-pink-500"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  This PIN logs you into the Customer Portal (/portal) to access past visits and bills. Enter 1234 for demo.
                </p>
              </div>

              {/* Inline Error if validation fails */}
              {submitError && (
                <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-extrabold text-base shadow-xl shadow-pink-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Confirming & Saving Record...</span>
                    </>
                  ) : (
                    <span>Complete Booking & Save to Account ✨</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 5: CONFIRMATION & WHATSAPP PREVIEW */}
        {currentStep === 5 && confirmedBooking && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center text-3xl font-bold mb-4 shadow-xl shadow-emerald-500/20">
              ✓
            </div>
            <h2 className="text-2xl font-black text-white">Booking Confirmed!</h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
              Your appointment has been reserved directly in the salon scheduling system.
            </p>

            {/* Appointment Card */}
            <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-left max-w-md mx-auto shadow-xl">
              <div className="text-[10px] uppercase font-bold tracking-wider text-pink-400 mb-1">
                Confirmed Appointment
              </div>
              <div className="text-xl font-extrabold text-white">{confirmedBooking.serviceName}</div>
              <div className="text-xs text-neutral-400 mt-1">
                Stylist: <span className="text-white font-semibold">{confirmedBooking.staffName}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Date</span>
                  <span className="font-bold text-white">{confirmedBooking.formattedDate}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Time</span>
                  <span className="font-bold text-emerald-400">{confirmedBooking.formattedTime}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Client</span>
                  <span className="font-bold text-white">{confirmedBooking.cleanName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Phone</span>
                  <span className="font-bold font-mono text-neutral-300">{confirmedBooking.cleanMobile}</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Preview Bubble */}
            <div className="mt-8 max-w-md mx-auto text-left">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  WhatsApp Confirmation Preview
                </span>
              </div>

              <div className="bg-[#0b141a] border border-[#202c33] rounded-3xl p-4 shadow-2xl relative overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#202c33] mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                    {salon.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#e9edef]">{salon.name} (Official)</div>
                    <div className="text-[10px] text-emerald-400">Verified Business Account</div>
                  </div>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tl-sm p-3.5 text-xs sm:text-sm shadow-md leading-relaxed">
                  <p>{confirmedBooking.whatsappMessage}</p>
                  <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-[#8696a0]">
                    <span>Just now</span>
                    <span className="text-[#53bdeb] font-bold">✓✓</span>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-[10px] text-neutral-500">
                    Demo: In production, this WhatsApp message is triggered instantly via WhatsApp Cloud API.
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Portal Link & Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/portal"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-pink-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>👤 Go to My Account & Invoices Portal →</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelectedService(null);
                  setSelectedSlot(null);
                  setCurrentStep(1);
                  setConfirmedBooking(null);
                  setSubmitError(null);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 transition-all active:scale-95"
              >
                Book Another Appointment ↺
              </button>
            </div>

            {/* Account Records Reminder Card */}
            <div className="mt-5 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-xs flex items-center justify-center gap-2 max-w-md mx-auto text-center leading-relaxed">
              <span>💡</span>
              <span>
                Your customer record is permanently stored! You can log in anytime at{' '}
                <Link href="/portal" className="text-pink-400 underline font-semibold">/portal</Link> with mobile{' '}
                <strong className="text-white font-mono">{confirmedBooking.cleanMobile}</strong> and PIN{' '}
                <strong className="text-white font-mono">1234</strong> to review your past visits, itemized bills, and VIP benefits.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
