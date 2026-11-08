'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/landing/ThemeToggle';
import { showToast } from '@/lib/toast';

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

interface Photo {
  id: string;
  url: string;
  sort_order: number;
}

interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  owner_reply: string | null;
  owner_replied_at: string | null;
  created_at: string;
  service_name: string | null;
  customer_name: string;
}

interface ReviewsSummary {
  average: number;
  count: number;
  enabled: boolean;
}

export default function BookingWizard({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [logoError, setLogoError] = useState(false);
  const [brokenPhotoIds, setBrokenPhotoIds] = useState<Record<string, boolean>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffServices, setStaffServices] = useState<{ staff_id: string; service_id: string }[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState<ReviewsSummary>({ average: 0, count: 0, enabled: false });
  const [latestReviews, setLatestReviews] = useState<PublicReview[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Wizard state with route/refresh persistence
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('anyone');
  
  // Date & Slot state
  const [availableDates, setAvailableDates] = useState<{ dateStr: string; label: string; dayNumber?: string; dayName: string; isClosed: boolean; holidayTitle?: string | null; holidayNote?: string | null }[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);

  // Restore step on refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (parsed >= 1 && parsed <= 5) {
        setCurrentStep(parsed);
      }
    }
  }, []);

  function updateStep(newStep: number, overrides?: { serviceId?: string; staffId?: string; date?: string }) {
    setCurrentStep(newStep);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('step', newStep.toString());
      const svcId = overrides?.serviceId || selectedService?.id;
      if (svcId) {
        url.searchParams.set('service', svcId);
      }
      const stId = overrides?.staffId !== undefined ? overrides.staffId : selectedStaffId;
      if (stId && stId !== 'anyone') {
        url.searchParams.set('staff', stId);
      } else {
        url.searchParams.delete('staff');
      }
      const dt = overrides?.date || selectedDate;
      if (dt) {
        url.searchParams.set('date', dt);
      }
      window.history.replaceState(null, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  // Customer Details & Code
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [bookingNote, setBookingNote] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [confirmVerificationCode, setConfirmVerificationCode] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Customer Session & Auth
  const [activeCustomer, setActiveCustomer] = useState<{ id: string; name: string; mobile: string } | null>(null);
  const [customerAuthMode, setCustomerAuthMode] = useState<'new' | 'existing'>('new');
  const [loginPin, setLoginPin] = useState<string>('');
  const [verifyingLogin, setVerifyingLogin] = useState<boolean>(false);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Check if customer is already logged in & sync theme state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('salonpro_theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      }
    }

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
        if (slug && typeof window !== 'undefined') {
          try { localStorage.setItem('salonpro_last_salon', slug); } catch {}
        }
        setPhotos(data.photos || []);
        const fetchedServices = data.services || [];
        setServices(fetchedServices);
        setStaffList(data.staff || []);
        setStaffServices(data.staffServices || []);
        setHolidays(data.holidays || []);
        if (data.reviewsSummary) {
          setReviewsSummary(data.reviewsSummary);
        }
        if (data.reviews) {
          setLatestReviews(data.reviews);
        }

        // Restore selectedService & selectedStaffId from URL/sessionStorage or default
        if (typeof window !== 'undefined') {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const storedSvcId = urlParams.get('service') || sessionStorage.getItem(`salonpro_${slug}_svc_id`);
            const matched = fetchedServices.find((s: Service) => s.id === storedSvcId);
            if (matched) {
              setSelectedService(matched);
            } else if (fetchedServices.length > 0) {
              setSelectedService(fetchedServices[0]);
            }

            const storedStaffId = urlParams.get('staff') || sessionStorage.getItem(`salonpro_${slug}_staff_id`);
            if (storedStaffId) {
              if (storedStaffId === 'anyone' || (data.staff || []).some((st: Staff) => st.id === storedStaffId)) {
                setSelectedStaffId(storedStaffId);
              }
            }
          } catch {}
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load salon details');
      } finally {
        setLoading(false);
      }
    }
    loadSalon();
  }, [slug]);

  // 2. Generate date range when salon or holidays load (in Indian Standard Time)
  useEffect(() => {
    if (!salon) return;
    const dates: { dateStr: string; label: string; dayNumber?: string; dayName: string; isClosed: boolean; holidayTitle?: string | null; holidayNote?: string | null }[] = [];
    const maxDays = salon.max_advance_days || 14;
    const workingDays = salon.working_days || [1, 2, 3, 4, 5, 6];

    const now = new Date();
    const todayIST = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const baseDate = new Date(`${todayIST}T00:00:00+05:30`);

    for (let i = 0; i < maxDays; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const dayOfWeek = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
      
      const holidayMatch = (holidays || []).find((h: any) => dateStr >= h.start_date && dateStr <= h.end_date);
      const isClosed = !workingDays.includes(dayOfWeek) || Boolean(holidayMatch);
      const holidayTitle = holidayMatch ? holidayMatch.title : null;
      const holidayNote = holidayMatch ? holidayMatch.note : null;

      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });
      const dayNumber = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' });
      const dayName = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });

      dates.push({ dateStr, label, dayNumber, dayName, isClosed, holidayTitle, holidayNote });
    }

    setAvailableDates(dates);
    
    // Restore selected date from URL/sessionStorage or default select first open date
    let initialDate = '';
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const savedDate = urlParams.get('date') || sessionStorage.getItem(`salonpro_${slug}_date`);
        if (savedDate) {
          const matchedDate = dates.find((d) => d.dateStr === savedDate && !d.isClosed);
          if (matchedDate) {
            initialDate = matchedDate.dateStr;
          }
        }
      } catch {}
    }
    if (!initialDate) {
      const firstOpen = dates.find((d) => !d.isClosed);
      if (firstOpen) {
        initialDate = firstOpen.dateStr;
      }
    }
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [salon, holidays, slug]);

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

        const now = new Date();
        const todayISTStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const isToday = (selectedDate === todayISTStr);

        const serverSlots = data.slots || [];

        if (data.isClosedDay) {
          setAvailableSlots([]);
          if (data.holiday?.title) {
            setSlotNotice(`🏖️ Salon is closed on this date for "${data.holiday.title}". ${data.holiday.note || 'Please select another upcoming date.'}`);
          } else {
            setSlotNotice('Salon is closed on this day. Please select another date.');
          }
        } else if (serverSlots.length === 0) {
          setAvailableSlots([]);
          if (selectedStaffId && selectedStaffId !== 'anyone') {
            setSlotNotice('No available slots for this specialist on this date. Please choose another specialist or date.');
          } else if (isToday) {
            setSlotNotice('The shop is closed for today. Please book an appointment for another date.');
            // Auto-select next available open date (e.g. Tomorrow)
            const nextOpen = availableDates.find((d) => d.dateStr > todayISTStr && !d.isClosed);
            if (nextOpen && nextOpen.dateStr !== selectedDate) {
              setSelectedDate(nextOpen.dateStr);
              if (typeof window !== 'undefined') {
                try {
                  sessionStorage.setItem(`salonpro_${slug}_date`, nextOpen.dateStr);
                  const url = new URL(window.location.href);
                  url.searchParams.set('date', nextOpen.dateStr);
                  window.history.replaceState(null, '', url.toString());
                } catch {}
              }
            }
          } else {
            setSlotNotice('No free slots available for this date. Please try another specialist or date.');
          }
        } else {
          setAvailableSlots(serverSlots);
          // Only clear notice if it wasn't a shop-closed message for today
          if (!isToday && slotNotice?.includes('The shop is closed for today')) {
            // Keep the notification banner so user knows why tomorrow was suggested
          } else {
            setSlotNotice(null);
          }
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
  }, [salon, selectedService?.id, selectedStaffId, selectedDate, slug, availableDates]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141926] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#D4A77F] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-neutral-400 text-sm font-medium">Loading salon booking portal...</p>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-[#141926] flex flex-col items-center justify-center p-4 text-center">
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
      <div className="min-h-screen bg-[#080B12] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-20 h-20 rounded-3xl bg-[#141926] border border-[#2A2F3A] flex items-center justify-center text-3xl mb-4 shadow-xl">
          🔒
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Booking is closed</h1>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">
          Online appointments for {salon.name} are currently paused by the salon manager.
        </p>
        <div className="bg-[#141926] p-4 rounded-2xl border border-[#2A2F3A] text-xs text-neutral-300">
          For inquiries or appointments, please call the salon at:
          <span className="block text-sm font-bold text-[#D4A77F] mt-1 font-mono">
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

  const brandColor = salon.brand_color || '#D4A77F';

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
          pin: loginPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Customer not found or invalid PIN. Please check details or select Sign Up.');
      }
      setActiveCustomer(data.customer);
      setCustomerName(data.customer.name);
      setCustomerMobile(data.customer.mobile);
      setVerificationCode(loginPin);
      setSubmitError(null);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setVerifyingLogin(false);
    }
  }

  // Instant server-side slot availability re-check when customer selects slot
  async function handleSelectSlot(slot: Slot) {
    setSelectedSlot(slot);
    setSubmitError(null);
    try {
      const checkUrl = `/api/public/${slug}/slots?service_id=${selectedService!.id}&staff_id=${slot.staffId}&date=${selectedDate}`;
      const res = await fetch(checkUrl);
      const data = await res.json();
      const isAvailable = (data.slots || []).some((s: any) => s.time === slot.time && s.staffId === slot.staffId);
      if (!isAvailable) {
        setSelectedSlot(null);
        setSubmitError('This time was just taken, please pick another.');
        setAvailableSlots(data.slots || []);
      }
    } catch {}
  }

  // Re-verify availability before transitioning from Step 3 to Step 4
  async function handleProceedToDetails() {
    if (!selectedSlot) {
      setSubmitError('Please select an available time slot.');
      return;
    }
    setSlotsLoading(true);
    setSubmitError(null);
    try {
      const checkUrl = `/api/public/${slug}/slots?service_id=${selectedService!.id}&staff_id=${selectedSlot.staffId}&date=${selectedDate}`;
      const res = await fetch(checkUrl);
      const data = await res.json();
      const isAvailable = (data.slots || []).some((s: any) => s.time === selectedSlot.time && s.staffId === selectedSlot.staffId);
      if (!isAvailable) {
        setSelectedSlot(null);
        setSubmitError('This time was just taken, please pick another.');
        setAvailableSlots(data.slots || []);
        return;
      }
      updateStep(4);
    } catch {
      updateStep(4);
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleSelectService(svc: Service) {
    setSelectedService(svc);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`salonpro_${slug}_svc_id`, svc.id);
        const url = new URL(window.location.href);
        url.searchParams.set('service', svc.id);
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  }

  function handleSelectStaff(staffId: string) {
    setSelectedStaffId(staffId);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`salonpro_${slug}_staff_id`, staffId);
        const url = new URL(window.location.href);
        if (staffId && staffId !== 'anyone') {
          url.searchParams.set('staff', staffId);
        } else {
          url.searchParams.delete('staff');
        }
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  }

  function handleSelectDate(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`salonpro_${slug}_date`, dateStr);
        const url = new URL(window.location.href);
        url.searchParams.set('date', dateStr);
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  }

  // Handle booking form submission
  async function handleBookAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService) {
      setSubmitError('Please select a service first.');
      updateStep(1);
      return;
    }

    if (!selectedSlot || !selectedDate) {
      setSubmitError('Please select an available time slot.');
      updateStep(3);
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

    if (!activeCustomer) {
      if (!verificationCode.trim() || verificationCode.trim().length < 4) {
        setSubmitError('Please set a 4-digit security PIN for your customer portal access.');
        return;
      }

      if (verificationCode !== confirmVerificationCode) {
        setSubmitError('Security PINs do not match. Please verify your confirm PIN.');
        return;
      }
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
        confirmCode: !activeCustomer ? confirmVerificationCode : undefined,
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
          setSubmitError('This time was just taken, please pick another.');
          setSelectedSlot(null);
          updateStep(3); // Send back to step 3 (Time slots)
          // Refresh slots immediately
          try {
            const refUrl = `/api/public/${slug}/slots?service_id=${selectedService!.id}&staff_id=${selectedStaffId}&date=${selectedDate}`;
            const refRes = await fetch(refUrl);
            const refData = await refRes.json();
            if (refData.slots) setAvailableSlots(refData.slots);
          } catch {}
          return;
        }
        throw new Error(data.error || 'Failed to complete appointment booking');
      }

      setConfirmedBooking(data);
      showToast('Appointment booked successfully! Confirmation receipt dispatched.', 'success');
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(`salonpro_${slug}_svc_id`);
          sessionStorage.removeItem(`salonpro_${slug}_staff_id`);
          sessionStorage.removeItem(`salonpro_${slug}_date`);
          const url = new URL(window.location.href);
          url.searchParams.delete('service');
          url.searchParams.delete('staff');
          url.searchParams.delete('date');
          window.history.replaceState(null, '', url.toString());
        } catch {}
      }
      updateStep(5); // Confirmation screen
    } catch (err: any) {
      setSubmitError(err.message || 'Error occurred while saving booking');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-neutral-100 flex flex-col font-sans selection:bg-[#D4A77F] selection:text-[#080B12] transition-colors duration-200">
      {/* Live Demo Sandbox Beacon (Zero data stored in DB) */}
      {slug.toLowerCase().trim() === 'dixa-beauty-salon' && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-pink-500/20 border-b border-amber-500/30 px-3 py-2.5 text-center text-xs text-amber-200">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-left">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider shrink-0">
                🧪 Live Booking Demo
              </span>
              <span className="text-[11px] text-amber-100">
                Test booking freely! Zero records or personal data are stored in database.
              </span>
            </div>
            <a
              href="/api/demo/owner-login"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#080B12] font-bold text-[11px] shadow-sm transition-all whitespace-nowrap inline-flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span>⚡ Test Owner ERP Dashboard</span>
              <span>➔</span>
            </a>
          </div>
        </div>
      )}

      {/* Universal Sticky Top Header for Public Salon Page */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#10141F]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2A2F3A] px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-xs transition-colors duration-250">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 dark:bg-white/10 border border-[#E5E7EB] dark:border-white/20 flex items-center justify-center font-bold text-sm text-[#8C5E2E] dark:text-[#D4A77F] overflow-hidden shrink-0">
            {salon?.logo_url && !logoError ? (
              <img src={salon.logo_url} alt={salon.name} className="w-full h-full object-cover" />
            ) : (
              <span>✂</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-white tracking-tight block leading-tight truncate">
              {salon?.name || 'Salon Workspace'}
            </span>
            <span className="text-[10px] text-[#8C5E2E] dark:text-[#D4A77F] font-bold block -mt-0.5 truncate">
              Online Booking &amp; Client Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-[#1F2937] dark:text-white text-xs font-semibold backdrop-blur-md border border-[#E5E7EB] dark:border-white/20 transition-all shadow-xs shrink-0 whitespace-nowrap"
            title="Customer Appointments Portal"
          >
            <span>👤</span>
            <span className="hidden sm:inline">{activeCustomer ? activeCustomer.name.split(' ')[0] : 'My Bookings'}</span>
          </Link>
          <Link
            href="/salon-owner"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold transition-all shadow-xs shrink-0 whitespace-nowrap"
            title="Salon Owner & Staff ERP Login"
          >
            <span>🔐</span>
            <span className="hidden sm:inline">Staff Login</span>
          </Link>
        </div>
      </header>

      {/* Top Salon Hero Banner */}
      <div 
        className="relative overflow-hidden border-b border-[#E5E7EB] dark:border-[#2A2F3A] pb-6 bg-[#F8F9FA] dark:bg-[#080B12]"
        style={{
          background: `radial-gradient(ellipse at top, ${brandColor}25 0%, transparent 75%)`,
        }}
      >

        <div className="max-w-2xl mx-auto px-4 pt-2 text-center">
          <div 
            className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center font-bold text-3xl shadow-xl border border-[#E5E7EB] dark:border-white/20 mb-3 overflow-hidden"
            style={{ backgroundColor: brandColor, color: '#ffffff' }}
          >
            {salon.logo_url && !logoError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={salon.logo_url}
                alt={salon.name}
                onError={() => setLogoError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              salon.name.charAt(0)
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2937] dark:text-white">{salon.name}</h1>
          {reviewsSummary.enabled && reviewsSummary.count > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-1.5">
              <div className="flex items-center text-amber-500 text-xs sm:text-sm">
                <span>★</span>
                <span className="font-extrabold text-[#1F2937] dark:text-white ml-1">{reviewsSummary.average.toFixed(1)}</span>
              </div>
              <span className="text-[#9CA3AF] dark:text-neutral-500 text-xs">·</span>
              <span className="text-[#6B7280] dark:text-neutral-300 text-xs font-semibold">
                ({reviewsSummary.count} {reviewsSummary.count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-neutral-400 mt-1 flex items-center justify-center gap-2">
            <span>✨ Premium Beauty & Hair Studio</span>
            <span>·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Open {salon.open_time.slice(0, 5)} - {salon.close_time.slice(0, 5)}</span>
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
                      currentStep >= st.num ? 'bg-[#D4A77F]' : 'bg-[#E5E7EB] dark:bg-[#1C2230]'
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1 font-semibold transition-colors ${
                      currentStep >= st.num ? 'text-[#8C5E2E] dark:text-[#D4A77F]' : 'text-[#6B7280] dark:text-[#747D8D]'
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
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 pb-36 sm:pb-44">
        {submitError && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1 font-medium">{submitError}</div>
          </div>
        )}

        {/* STEP 1: SELECT SERVICE */}
        {currentStep === 1 && (
          <div>
            {/* Salon Gallery */}
            {photos.filter((p) => !brokenPhotoIds[p.id]).length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Salon Gallery
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {photos.filter((p) => !brokenPhotoIds[p.id]).length} {photos.filter((p) => !brokenPhotoIds[p.id]).length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {photos
                    .filter((p) => !brokenPhotoIds[p.id])
                    .map((photo, idx) => (
                      <div
                        key={photo.id || idx}
                        className="group aspect-4/3 rounded-2xl overflow-hidden border border-[#2A2F3A] bg-[#141926] relative shadow-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`${salon.name} photo ${idx + 1}`}
                          loading="lazy"
                          onError={() => {
                            setBrokenPhotoIds((prev) => ({ ...prev, [photo.id]: true }));
                          }}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1F2937] dark:text-white">1. Select a Service</h2>
                <p className="text-xs text-[#6B7280] dark:text-neutral-400">Choose from our curated range of treatments</p>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-lg shadow-[#D4A77F]/20'
                      : 'bg-white dark:bg-[#141926] text-[#4B5563] dark:text-neutral-400 hover:text-[#1F2937] dark:hover:text-white border border-[#E5E7EB] dark:border-[#2A2F3A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Service Cards Grid */}
            <div className="space-y-3 pb-36 sm:pb-44">
              {filteredServices.map((svc) => {
                const isSelected = selectedService?.id === svc.id;
                return (
                  <div
                    key={svc.id}
                    onClick={() => handleSelectService(svc)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? 'bg-white dark:bg-[#141926] border-[#D4A77F] ring-2 ring-[#D4A77F]/20 shadow-md'
                        : 'bg-white dark:bg-[#141926]/60 hover:bg-neutral-50 dark:hover:bg-[#141926] border-[#E5E7EB] dark:border-[#2A2F3A]'
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-white">{svc.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F3F4F6] dark:bg-[#1C2230] text-[#6B7280] dark:text-neutral-400 font-medium">
                          {svc.category}
                        </span>
                      </div>
                      {svc.description && (
                        <p className="text-xs text-[#6B7280] dark:text-neutral-400 mt-1 line-clamp-2">{svc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#6B7280] dark:text-neutral-400">
                        <span className="flex items-center gap-1 text-[#8C5E2E] dark:text-[#D4A77F] font-bold">
                          ⏱ {svc.duration_min} mins
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-[#1F2937] dark:text-white">
                        ₹{Number(svc.price).toLocaleString('en-IN')}
                      </div>
                      <button
                        type="button"
                        className={`mt-2 px-3.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-md'
                            : 'bg-[#F3F4F6] dark:bg-[#1C2230] text-[#374151] dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {isSelected ? 'Selected ✓' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Client Reviews Section */}
            {reviewsSummary.enabled && latestReviews.length > 0 && (
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1F2937] dark:text-white flex items-center gap-1.5">
                    <span className="text-amber-500">★</span>
                    <span>Client Experiences ({reviewsSummary.count})</span>
                  </h3>
                  <span className="text-xs text-[#6B7280] dark:text-neutral-400 font-medium">
                    Average: <strong className="text-[#1F2937] dark:text-white">{reviewsSummary.average.toFixed(1)} / 5</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {latestReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#141926]/70 border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F2937] dark:text-white">{rev.customer_name}</span>
                          {rev.service_name && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#4B5563] dark:text-neutral-300 border border-[#E5E7EB] dark:border-neutral-700">
                              {rev.service_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-amber-500 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < rev.rating ? 'text-amber-500' : 'text-neutral-300 dark:text-neutral-700'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-[#4B5563] dark:text-neutral-300 leading-relaxed text-xs italic">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}

                      {rev.owner_reply && (
                        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#1C2230] border-l-2 border-[#D4A77F] text-[11px] text-[#4B5563] dark:text-neutral-300 mt-2 space-y-0.5">
                          <span className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] block">Response from {salon.name}:</span>
                          <p>{rev.owner_reply}</p>
                        </div>
                      )}

                      <div className="text-[10px] text-neutral-500 text-right">
                        {new Date(rev.created_at).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floating Next Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#080B12]/90 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#2A2F3A] z-10 flex justify-center shadow-lg">
              <div className="max-w-2xl w-full flex justify-between items-center">
                <div>
                  {selectedService ? (
                    <div>
                      <span className="text-xs text-[#6B7280] dark:text-neutral-400">Selected:</span>
                      <div className="text-sm font-bold text-[#1F2937] dark:text-white">{selectedService.name} (₹{Number(selectedService.price).toLocaleString('en-IN')})</div>
                    </div>
                  ) : (
                    <span className="text-xs text-[#6B7280] dark:text-neutral-500">Pick a service to continue</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!selectedService}
                  onClick={() => updateStep(2)}
                  className="px-6 py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] disabled:opacity-40 disabled:cursor-not-allowed text-[#080B12] text-sm font-bold transition-all shadow-lg shadow-[#D4A77F]/20 active:scale-95 cursor-pointer"
                >
                  Select Stylist →
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
                  onClick={() => updateStep(1)}
                  className="text-xs text-[#8C5E2E] dark:text-[#D4A77F] hover:underline mb-1 inline-block font-semibold"
                >
                  ← Back to Services
                </button>
                <h2 className="text-lg font-bold text-[#1F2937] dark:text-white">2. Choose Your Specialist</h2>
                <p className="text-xs text-[#6B7280] dark:text-neutral-400">
                  Select a specific stylist or choose anyone for maximum availability
                </p>
              </div>
            </div>

            <div className="space-y-3 pb-36 sm:pb-44 max-h-[65vh] sm:max-h-[70vh] overflow-y-auto pr-1 touch-scroll scrollbar-thin">
              {/* Anyone Option */}
              <div
                onClick={() => handleSelectStaff('anyone')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedStaffId === 'anyone'
                    ? 'bg-white dark:bg-[#141926] border-[#D4A77F] ring-2 ring-[#D4A77F]/20 shadow-md'
                    : 'bg-white dark:bg-[#141926]/60 hover:bg-neutral-50 dark:hover:bg-[#141926] border-[#E5E7EB] dark:border-[#2A2F3A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4A77F] to-[#B8905F] text-[#080B12] flex items-center justify-center font-bold text-lg shadow-md">
                    ⚡
                  </div>
                  <div>
                    <div className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-white">Any Available Specialist</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Fastest availability · Recommended</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedStaffId === 'anyone' ? 'border-[#D4A77F] bg-[#D4A77F] text-[#080B12] font-bold text-xs' : 'border-[#E5E7EB] dark:border-[#2A2F3A]'
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
                    onClick={() => handleSelectStaff(st.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-white dark:bg-[#141926] border-[#D4A77F] ring-2 ring-[#D4A77F]/20 shadow-md'
                        : 'bg-white dark:bg-[#141926]/60 hover:bg-neutral-50 dark:hover:bg-[#141926] border-[#E5E7EB] dark:border-[#2A2F3A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-[#1C2230] text-[#8C5E2E] dark:text-[#D4A77F] flex items-center justify-center font-bold text-base border border-[#E5E7EB] dark:border-[#2A2F3A]">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-white">{st.name}</div>
                        <div className="text-xs text-[#6B7280] dark:text-neutral-400">{st.role_title || 'Stylist & Artist'}</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#D4A77F] bg-[#D4A77F] text-[#080B12] font-bold text-xs' : 'border-[#E5E7EB] dark:border-[#2A2F3A]'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                  </div>
                );
              })}

              {/* Inline Action Buttons for Desktop Viewports */}
              <div className="hidden sm:flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => updateStep(1)}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#374151] dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-[#1C2230] cursor-pointer"
                >
                  ← Back to Services
                </button>
                <button
                  type="button"
                  onClick={() => updateStep(3)}
                  className="px-6 py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-sm font-bold transition-all shadow-lg shadow-[#D4A77F]/20 active:scale-95 cursor-pointer"
                >
                  Select Date & Time →
                </button>
              </div>
            </div>

            {/* Floating Next Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#080B12]/90 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#2A2F3A] z-10 flex justify-center shadow-lg">
              <div className="max-w-2xl w-full flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => updateStep(1)}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#141926] text-[#374151] dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => updateStep(3)}
                  className="px-6 py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-sm font-bold transition-all shadow-lg shadow-[#D4A77F]/20 active:scale-95 cursor-pointer"
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
                  onClick={() => updateStep(2)}
                  className="text-xs text-[#8C5E2E] dark:text-[#D4A77F] hover:underline mb-1 inline-block font-semibold"
                >
                  ← Back to Stylist
                </button>
                <h2 className="text-lg font-bold text-[#1F2937] dark:text-white">3. Pick Date & Available Slot</h2>
                <p className="text-xs text-[#6B7280] dark:text-neutral-400">
                  Real-time slots computed with buffer and opening hours
                </p>
              </div>
            </div>

            {/* Horizontal Date Picker */}
            <div className="mb-6">
              <label className="text-[11px] uppercase tracking-wider font-bold text-[#6B7280] dark:text-neutral-400 mb-2 block">
                Select Date
              </label>
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {availableDates.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  const isWordLabel = d.label === 'Today' || d.label === 'Tomorrow';
                  return (
                    <button
                      key={d.dateStr}
                      disabled={d.isClosed}
                      onClick={() => handleSelectDate(d.dateStr)}
                      className={`flex flex-col items-center justify-center shrink-0 min-w-[84px] sm:min-w-[92px] px-2.5 py-3 rounded-2xl border transition-all cursor-pointer ${
                        d.isClosed
                          ? 'opacity-30 cursor-not-allowed bg-neutral-100 dark:bg-[#141926]/40 border-[#E5E7EB] dark:border-[#2A2F3A]'
                          : isSelected
                          ? 'bg-[#D4A77F] border-[#D4A77F] text-[#080B12] shadow-lg shadow-[#D4A77F]/20 scale-102 font-bold'
                          : 'bg-white dark:bg-[#141926]/80 border-[#E5E7EB] dark:border-[#2A2F3A] text-[#1F2937] dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#141926]'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-80 tracking-wider">{d.dayName}</span>
                      {isWordLabel ? (
                        <span className="text-xs sm:text-sm font-extrabold mt-1 tracking-tight truncate max-w-[76px] text-center leading-tight">
                          {d.label}
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-extrabold">{d.dayNumber || d.label.split(' ')[0]}</span>
                          <span className="text-[10px] opacity-75">{d.label.split(' ')[1] || ''}</span>
                        </div>
                      )}
                      {d.isClosed && (
                        <span className="text-[9px] text-rose-500 font-bold mt-0.5 truncate max-w-[76px] px-1 text-center" title={d.holidayTitle || 'Closed'}>
                          {d.holidayTitle ? '🏖️ Holiday' : 'Closed'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots Grid */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#6B7280] dark:text-neutral-400">
                  Available Slots ({availableSlots.length})
                </label>
                {selectedSlot && (
                  <span className="text-xs text-[#8C5E2E] dark:text-[#D4A77F] font-bold">
                    Selected: {selectedSlot.formattedTime}
                  </span>
                )}
              </div>

              {slotsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center bg-white dark:bg-[#141926]/40 rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A]">
                  <div className="w-8 h-8 border-3 border-[#D4A77F] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-[#6B7280] dark:text-neutral-400 mt-3">Finding available free slots...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-10 px-4 text-center bg-white dark:bg-[#141926]/40 rounded-3xl border border-[#E5E7EB] dark:border-[#2A2F3A]">
                  <span className="text-2xl block mb-2">🗓️</span>
                  <p className="text-xs sm:text-sm text-[#374151] dark:text-neutral-300 font-medium">
                    {slotNotice || 'The shop is closed for today. Please book an appointment for another date.'}
                  </p>
                  {availableDates.find((d) => d.dateStr > selectedDate && !d.isClosed) && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = availableDates.find((d) => d.dateStr > selectedDate && !d.isClosed);
                        if (next) {
                          handleSelectDate(next.dateStr);
                        }
                      }}
                      className="mt-4 px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold transition-all shadow-lg shadow-[#D4A77F]/20 active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>👉 View Available Slots for Tomorrow</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {slotNotice && (
                    <div className="mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5">
                      <span>ℹ️</span>
                      <span>{slotNotice}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pb-36 sm:pb-44">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => handleSelectSlot(slot)}
                        className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D4A77F] border-[#D4A77F] text-[#080B12] font-bold shadow-lg shadow-[#D4A77F]/20 scale-102'
                            : 'bg-white dark:bg-[#141926]/80 border-[#E5E7EB] dark:border-[#2A2F3A] hover:border-[#D4A77F]/50 text-[#1F2937] dark:text-neutral-200'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-semibold">{slot.formattedTime}</div>
                        {selectedStaffId === 'anyone' && (
                          <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-[#080B12] font-bold' : 'text-[#6B7280] dark:text-neutral-500'}`}>
                            {slot.staffName}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
              )}
            </div>

            {/* Floating Next Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#080B12]/90 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#2A2F3A] z-10 flex justify-center shadow-lg">
              <div className="max-w-2xl w-full flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => updateStep(2)}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#141926] text-[#374151] dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={handleProceedToDetails}
                  className="px-6 py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] disabled:opacity-40 disabled:cursor-not-allowed text-[#080B12] text-sm font-bold transition-all shadow-lg shadow-[#D4A77F]/20 active:scale-95 cursor-pointer"
                >
                  Enter Details →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CUSTOMER DETAILS & ACCESS PIN */}
        {currentStep === 4 && (
          <div>
            <div className="flex justify-between items-end mb-4">
              <div>
                <button
                  onClick={() => updateStep(3)}
                  className="text-xs text-[#8C5E2E] dark:text-[#D4A77F] hover:underline mb-1 inline-block font-semibold"
                >
                  ← Back to Slot Selection
                </button>
                <h2 className="text-lg font-bold text-[#1F2937] dark:text-white">4. Confirm Your Appointment</h2>
                <p className="text-xs text-[#6B7280] dark:text-neutral-400">
                  Please enter your contact information to receive confirmation
                </p>
              </div>
            </div>

            {/* Booking Summary Box */}
            <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 mb-6 shadow-sm">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C5E2E] dark:text-[#D4A77F] mb-2">
                Booking Summary
              </div>
              <div className="flex justify-between items-center border-b border-[#E5E7EB] dark:border-[#2A2F3A] pb-3 mb-3">
                <div>
                  <div className="font-bold text-base text-[#1F2937] dark:text-white">{selectedService?.name}</div>
                  <div className="text-xs text-[#6B7280] dark:text-neutral-400">
                    ⏱ {selectedService?.duration_min} mins · Stylist: {selectedSlot?.staffName}
                  </div>
                </div>
                <div className="text-right font-extrabold text-lg text-[#1F2937] dark:text-white">
                  ₹{Number(selectedService?.price).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="flex justify-between text-xs text-[#4B5563] dark:text-neutral-300">
                <span>🗓️ Date & Time:</span>
                <span className="font-bold text-[#1F2937] dark:text-white">
                  {new Date(`${selectedDate}T00:00:00+05:30`).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
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
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30 shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span>Verified Customer Account</span>
                    </div>
                    <div className="text-base font-extrabold text-[#1F2937] dark:text-white">
                      {activeCustomer.name}{' '}
                      <span className="font-mono text-[#6B7280] dark:text-neutral-400 text-xs font-normal">
                        (+91 {activeCustomer.mobile})
                      </span>
                    </div>
                    <div className="text-xs text-[#6B7280] dark:text-neutral-400 mt-0.5">
                      Your booking and digital invoice will automatically save to your customer portal. No PIN needed.
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
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#1C2230] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#374151] dark:text-neutral-300 text-xs font-semibold self-start sm:self-auto transition-all border border-[#E5E7EB] dark:border-transparent cursor-pointer"
                >
                  Switch / Log Out
                </button>
              </div>
            ) : (
              <div className="mb-5">
                <div className="flex rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerAuthMode('new');
                      setSubmitError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      customerAuthMode === 'new'
                        ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-md'
                        : 'text-[#6B7280] dark:text-neutral-400 hover:text-[#1F2937] dark:hover:text-white'
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
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      customerAuthMode === 'existing'
                        ? 'bg-[#D4A77F] text-[#080B12] font-bold shadow-md'
                        : 'text-[#6B7280] dark:text-neutral-400 hover:text-[#1F2937] dark:hover:text-white'
                    }`}
                  >
                    🔑 Returning Customer (Login)
                  </button>
                </div>

                {customerAuthMode === 'existing' && (
                  <div className="bg-white dark:bg-[#141926]/90 border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 mb-4 space-y-3">
                    <div className="text-xs font-bold text-[#8C5E2E] dark:text-[#D4A77F] uppercase tracking-wider">
                      Quick Login to Autofill Profile
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#4B5563] dark:text-neutral-300 mb-1">
                          Registered Mobile Number
                        </label>
                        <input
                          type="tel"
                          placeholder="9898023456"
                          value={customerMobile}
                          onChange={(e) => setCustomerMobile(e.target.value)}
                          className="w-full bg-[#F9FAFB] dark:bg-[#080B12] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3 py-2 text-sm text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-neutral-500 font-mono focus:outline-none focus:border-[#D4A77F]"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] font-semibold text-[#4B5563] dark:text-neutral-300">
                            4-Digit Security PIN
                          </label>
                        </div>
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="Enter PIN"
                          value={loginPin}
                          onChange={(e) => setLoginPin(e.target.value)}
                          className="w-full bg-[#F9FAFB] dark:bg-[#080B12] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3 py-2 text-sm text-[#1F2937] dark:text-white text-center font-mono focus:outline-none focus:border-[#D4A77F]"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={verifyingLogin}
                      onClick={handleCustomerQuickLogin}
                      className="w-full py-2.5 rounded-xl bg-neutral-100 dark:bg-[#1C2230] hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1F2937] dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#E5E7EB] dark:border-[#2A2F3A] cursor-pointer"
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
                <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300 mb-1.5">
                  Your Full Name <span className="text-[#D4A77F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Joshi"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#F9FAFB] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-3 text-sm text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-neutral-500 focus:outline-none focus:border-[#D4A77F] focus:ring-1 focus:ring-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300 mb-1.5">
                  Mobile Number (WhatsApp) <span className="text-[#D4A77F]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm text-[#9CA3AF] dark:text-neutral-500 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    placeholder="9898023456"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full bg-[#F9FAFB] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl pl-14 pr-4 py-3 text-sm text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-neutral-500 font-mono focus:outline-none focus:border-[#D4A77F] focus:ring-1 focus:ring-[#D4A77F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] dark:text-neutral-300 mb-1.5">
                  Special Request or Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. First time visiting, prefer sensitive skin products"
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  className="w-full bg-[#F9FAFB] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-3 text-sm text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-neutral-500 focus:outline-none focus:border-[#D4A77F] focus:ring-1 focus:ring-[#D4A77F]"
                />
              </div>

              {/* 4-digit verification code / portal PIN */}
              {!activeCustomer && (
                <div className="bg-[#D4A77F]/15 border border-[#D4A77F]/30 rounded-2xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-xs font-bold text-[#8C5E2E] dark:text-[#D4A77F] mb-1.5">
                        Set 4-Digit Security PIN <span className="text-[#8C5E2E] dark:text-[#D4A77F]">*</span>
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        placeholder="Enter 4-digit PIN"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full bg-white dark:bg-[#141926]/90 border border-[#D4A77F]/40 rounded-xl px-4 py-2.5 text-center font-mono text-base tracking-widest text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#8C5E2E] dark:text-[#D4A77F] mb-1.5">
                        Confirm 4-Digit PIN <span className="text-[#8C5E2E] dark:text-[#D4A77F]">*</span>
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        placeholder="Re-enter 4-digit PIN"
                        value={confirmVerificationCode}
                        onChange={(e) => setConfirmVerificationCode(e.target.value)}
                        className="w-full bg-white dark:bg-[#141926]/90 border border-[#D4A77F]/40 rounded-xl px-4 py-2.5 text-center font-mono text-base tracking-widest text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#6B7280] dark:text-neutral-400">
                    You can use this 4-digit PIN to log into your Customer Portal (/portal) to view your visits, invoices, and rewards.
                  </p>
                </div>
              )}

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
                  className="w-full py-4 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold disabled:opacity-50 text-base shadow-xl shadow-[#D4A77F]/20 transition-all active:scale-98 flex items-center justify-center gap-2"
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
            <h2 className="text-2xl font-black text-[#1F2937] dark:text-white">
              {confirmedBooking.isDemo ? 'Demo Booking Simulated!' : 'Booking Confirmed!'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              {confirmedBooking.isDemo
                ? 'This was an interactive demonstration. Zero data was saved to our database.'
                : 'Your appointment has been reserved directly in the salon scheduling system.'}
            </p>

            {/* Demo Sandbox Alert Callout */}
            {confirmedBooking.isDemo && (
              <div className="mt-4 mb-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 max-w-md mx-auto text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-xs uppercase mb-2">
                  <span>🧪 Zero Database Storage</span>
                </span>
                <p className="text-xs text-amber-700 dark:text-amber-200">
                  Are you a salon owner? See how this appointment instantly shows up on the manager dashboard and calendar:
                </p>
                <div className="mt-3">
                  <a
                    href="/api/demo/owner-login"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#080B12] text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <span>⚡ Test-Drive Salon Owner ERP Dashboard</span>
                    <span>➔</span>
                  </a>
                </div>
              </div>
            )}

            {/* Appointment Card */}
            <div className="mt-6 bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 text-left max-w-md mx-auto shadow-xl">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#8C5E2E] dark:text-[#D4A77F] mb-1">
                Confirmed Appointment
              </div>
              <div className="text-xl font-extrabold text-[#1F2937] dark:text-white">{confirmedBooking.serviceName}</div>
              <div className="text-xs text-[#6B7280] dark:text-neutral-400 mt-1">
                Stylist: <span className="text-[#1F2937] dark:text-white font-semibold">{confirmedBooking.staffName}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#2A2F3A] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#6B7280] dark:text-neutral-500 block text-[10px] uppercase font-bold">Date</span>
                  <span className="font-bold text-[#1F2937] dark:text-white">{confirmedBooking.formattedDate}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] dark:text-neutral-500 block text-[10px] uppercase font-bold">Time</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{confirmedBooking.formattedTime}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] dark:text-neutral-500 block text-[10px] uppercase font-bold">Client</span>
                  <span className="font-bold text-[#1F2937] dark:text-white">{confirmedBooking.cleanName}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] dark:text-neutral-500 block text-[10px] uppercase font-bold">Phone</span>
                  <span className="font-bold font-mono text-[#4B5563] dark:text-neutral-300">{confirmedBooking.cleanMobile}</span>
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
                  <span className="text-[10px] text-neutral-400">
                    This official confirmation message has been dispatched to your registered WhatsApp number.
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Portal Link & Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/portal"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold  text-xs sm:text-sm shadow-xl shadow-[#D4A77F]/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>👤 Go to My Account & Invoices Portal →</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelectedService(null);
                  setSelectedSlot(null);
                  updateStep(1);
                  setConfirmedBooking(null);
                  setSubmitError(null);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-[#141926] hover:bg-neutral-100 dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-neutral-300 text-xs font-bold border border-[#E5E7EB] dark:border-[#2A2F3A] transition-all active:scale-95 cursor-pointer"
              >
                Book Another Appointment ↺
              </button>
            </div>

            {/* Account Records Reminder Card */}
            {!confirmedBooking.isDemo && (
              <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-[#141926]/80 border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#6B7280] dark:text-neutral-400 text-xs flex items-center justify-center gap-2 max-w-md mx-auto text-center leading-relaxed">
                <span>💡</span>
                <span>
                  Your customer record is permanently stored! You can log in anytime at{' '}
                  <Link href="/portal" className="text-[#8C5E2E] dark:text-[#D4A77F] underline font-semibold">/portal</Link> with mobile{' '}
                  <strong className="text-[#1F2937] dark:text-white font-mono">{confirmedBooking.cleanMobile}</strong> and PIN{' '}
                  <strong className="text-[#1F2937] dark:text-white font-mono">{confirmedBooking.customerPin || '••••'}</strong> to review your past visits, itemized bills, and VIP benefits.
                </span>
              </div>
            )}
            {confirmedBooking.isDemo && (
              <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-[#141926]/80 border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#6B7280] dark:text-neutral-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 max-w-md mx-auto text-center sm:text-left leading-relaxed">
                <div>
                  <span className="text-[#1F2937] dark:text-white font-bold block mb-0.5">Want to launch your own salon online?</span>
                  <span className="text-[11px] text-[#6B7280] dark:text-neutral-400">Setup your branded booking link & ERP in 60s.</span>
                </div>
                <Link
                  href="/register-salon"
                  className="px-3.5 py-1.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs whitespace-nowrap shrink-0 transition-all shadow-xs"
                >
                  Start Free Trial ➔
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
