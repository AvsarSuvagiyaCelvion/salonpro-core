'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Receipt,
  Users,
  Scissors,
  Award,
  TrendingUp,
  Gift,
  Lock,
} from 'lucide-react';

import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import PricingCards from '@/components/landing/PricingCards';
import StatsCounter from '@/components/landing/StatsCounter';
import InteractiveProductPreview from '@/components/landing/InteractiveProductPreview';

import SmoothScroll from '@/components/animations/SmoothScroll';
import PageLoader from '@/components/animations/PageLoader';
import Reveal from '@/components/animations/Reveal';
import Typewriter from '@/components/animations/Typewriter';
import AuroraBackground from '@/components/animations/AuroraBackground';
import FloatingIcons from '@/components/animations/FloatingIcons';
import KanbanDemo from '@/components/animations/KanbanDemo';
import MagneticButton from '@/components/animations/MagneticButton';
import HeadacheFlipCard from '@/components/animations/HeadacheFlipCard';
import DoubleBookingDemo from '@/components/animations/DoubleBookingDemo';
import HowItWorksSteps from '@/components/animations/HowItWorksSteps';
import TiltCard from '@/components/animations/TiltCard';
import PosInvoiceDemo from '@/components/animations/PosInvoiceDemo';
import CalendarSlotsDemo from '@/components/animations/CalendarSlotsDemo';
import SalonMarquee from '@/components/animations/SalonMarquee';

export default function LandingPageClient() {
  const [typewriterDone, setTypewriterDone] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('salonpro_typewriter_done') === 'true';
    }
    return false;
  });

  return (
    <SmoothScroll>
      <PageLoader />

      <div className="min-h-screen bg-[#F7F5F2] dark:bg-[#151218] text-[#242126] dark:text-[#F5EFF5] font-sans selection:bg-[#B77A91] selection:text-white w-full max-w-full overflow-x-hidden relative transition-colors duration-500">
        {/* Animated Aurora Gradient Background with Desktop Cursor Spotlight */}
        <AuroraBackground />

        {/* Top Sticky Glassmorphism Navbar with Theme Switcher */}
        <LandingNavbar />

        {/* ================= HERO SECTION ================= */}
        <section className="relative z-10 max-w-6xl mx-auto px-3.5 sm:px-6 pt-10 sm:pt-16 lg:pt-20 pb-12 sm:pb-20 text-center w-full">
          {/* Drifting Floating Salon Icons with Mouse Parallax */}
          <FloatingIcons />

          {/* Live Beacon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4B263F] dark:bg-[#2B2230] border border-[#E8E1E5]/40 dark:border-[#3A3040] text-white text-[11px] sm:text-xs font-bold mb-5 sm:mb-6 shadow-md shadow-[#4B263F]/15 max-w-full">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F7D68] dark:bg-[#55B99A] animate-ping inline-block" />
            <span className="text-[#D4AD76] font-extrabold tracking-wide">LIVE DEMO AVAILABLE</span>
            <span className="text-white/40">·</span>
            <span className="text-[#F5EFF5]/90">Smart Salon & Spa Management Suite</span>
          </div>

          {/* H1 Typewriter Effect with Invisible CLS Barrier & Blinking Pink Caret */}
          <Typewriter
            firstLine="Stop Losing Revenue to"
            secondLine="Paper Registers & Double-Bookings"
            onComplete={() => setTypewriterDone(true)}
            speedMs={50}
          />

          {/* Staggered Subtitle, CTAs, Badges & Stats (Revealed when Typewriter Finishes) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={typewriterDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs sm:text-base lg:text-lg text-[#77717A] dark:text-[#B5AAB8] mt-4 sm:mt-6 max-w-2xl mx-auto leading-relaxed px-1">
              The all-in-one operating system for salons & spas:{' '}
              <strong className="text-[#242126] dark:text-[#F5EFF5]">conflict-free online client booking</strong>, live studio Kanban, 10-second GST POS
              billing, staff commission tracking, and instant WhatsApp receipts.
            </p>

            {/* Hero CTAs */}
            <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
              {/* Primary CTA with Magnetic Physics, Shimmer Sweep, and Confetti */}
              <MagneticButton
                href="/register-salon"
                withConfetti={true}
                className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#4B263F] hover:bg-[#381c2f] dark:bg-[#D6A0B4] dark:hover:bg-[#c98ea3] text-white dark:text-[#151218] font-extrabold text-xs sm:text-sm shadow-xl shadow-[#4B263F]/25 dark:shadow-[#D6A0B4]/20 transition-all active:scale-95 flex items-center justify-center gap-2 group ring-2 ring-[#C69A5D]/30 cursor-pointer"
              >
                <span>🎁 Start 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </MagneticButton>

              <Link
                href="/dixa-beauty-salon"
                target="_blank"
                className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#2F7D68] hover:bg-[#256554] dark:bg-[#55B99A] dark:hover:bg-[#439e83] text-white dark:text-[#151218] font-extrabold text-xs sm:text-sm shadow-md shadow-[#2F7D68]/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>⚡ Try Live Booking Demo</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/15 text-white dark:text-[#151218]">1-Click</span>
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#211B24] hover:bg-[#F1EBEF] dark:hover:bg-[#2B2230] text-[#242126] dark:text-[#F5EFF5] font-bold text-xs sm:text-sm border border-[#E8E1E5] dark:border-[#3A3040] transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#B77A91] dark:text-[#D6A0B4]" />
                <span>🔐 Owner Portal</span>
              </Link>
            </div>

            {/* Quick Micro-Trust Badges */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#77717A] dark:text-[#B5AAB8] font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D68] dark:text-[#55B99A]" />
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D68] dark:text-[#55B99A]" />
                <span>Setup in 60 seconds</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D68] dark:text-[#55B99A]" />
                <span>Complete All-in-One Salon System</span>
              </span>
            </div>

            {/* Animated Social Proof Stats Counter (0-to-target count-up in view) */}
            <StatsCounter />
          </motion.div>

          {/* Live Studio Kanban Mock & WhatsApp Notification Loop */}
          <div className="mt-14 sm:mt-18">
            <KanbanDemo />
          </div>

          {/* Interactive Live Product Preview */}
          <div className="mt-10 sm:mt-14">
            <InteractiveProductPreview />
          </div>
        </section>

        {/* ================= SECTION: COMMON SALON HEADACHES ================= */}
        <section id="problems" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#4B263F] dark:text-[#D6A0B4] mb-2">Common Salon Headaches</h2>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#242126] dark:text-[#F5EFF5] tracking-tight">
                Running a Salon Shouldn&apos;t Feel Like Chaos
              </h3>
              <p className="text-xs sm:text-sm text-[#77717A] dark:text-[#B5AAB8] mt-2 max-w-xl mx-auto leading-relaxed">
                Traditional salons waste hours on manual registers and lose clients due to poor booking coordination.
                Flip each card to see how SalonPro eliminates every pain point:
              </p>
            </div>
          </Reveal>

          {/* 3D Flip Cards Grid: Red Headache on Front, Green Solution on Back */}
          <Reveal delay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <HeadacheFlipCard
                headacheTitle="Double-Bookings & Angry Walk-Ins"
                headacheDesc="Two clients show up for the same hair stylist at 4:00 PM. Stylists are stressed, waiting areas are packed, and clients leave bad reviews."
                solutionTitle="Overlap-Protected Bookings"
                solutionDesc="Automated exclusion engine serializes concurrent requests and computes stylist buffers automatically. 100% overlap prevention."
              />

              <HeadacheFlipCard
                headacheTitle="Messy Paper Books & Lost Bills"
                headacheDesc="When a client asks for their previous treatment shade or invoice history, staff scrambles through stacks of handwritten paper diaries."
                solutionTitle="Instant Client Profile Lookup"
                solutionDesc="Instant digital client profile lookup showing complete past visits, formulas, used treatments, and tax-ready invoice receipts."
              />

              <HeadacheFlipCard
                headacheTitle="End-of-Day Cash & Commission Confusion"
                headacheDesc="Calculating how much each hair stylist earned in commissions and reconciling UPI vs Cash payments takes the salon owner hours every night."
                solutionTitle="Automated Daily Reports & Commissions"
                solutionDesc="Instant automated daily reports showing cash collected, UPI payments, gross revenue, and exact staff commission amounts with 1-click export."
              />

              <HeadacheFlipCard
                headacheTitle="Clients Forget Appointments (25% No-Shows)"
                headacheDesc="Over 25% of verbal phone appointments result in no-shows because clients simply forget their booked time slot."
                solutionTitle="Automated WhatsApp Cloud Reminders"
                solutionDesc="Instant WhatsApp confirmation sent to client with date, time, stylist name, and salon location, dramatically reducing no-shows."
              />
            </div>
          </Reveal>

          {/* Interactive Double-Booking Conflict Demo */}
          <Reveal delay={0.25}>
            <div className="mt-8 sm:mt-10">
              <DoubleBookingDemo />
            </div>
          </Reveal>
        </section>

        {/* ================= SECTION: HOW IT WORKS (ANIMATED TIMELINE) ================= */}
        <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 border-t border-[#E8E1E5] dark:border-[#3A3040]">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#C69A5D] dark:text-[#D4AD76] mb-2">Simple Multi-Tenant Workflow</h2>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#242126] dark:text-[#F5EFF5] tracking-tight">
                How SalonPro Works in Your Salon (Example: &quot;Priya Salon&quot;)
              </h3>
              <p className="text-xs sm:text-sm text-[#77717A] dark:text-[#B5AAB8] mt-2 max-w-xl mx-auto leading-relaxed">
                Clean segregation between your internal salon operations and what your customers see.
              </p>
            </div>
          </Reveal>

          {/* Interactive Vertical Scroll-Drawn Steps with Animated URLs */}
          <Reveal delay={0.15}>
            <HowItWorksSteps />
          </Reveal>
        </section>

        {/* ================= SECTION: FEATURES GRID (3D TILT CARDS & LIVE WIDGETS) ================= */}
        <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 border-t border-[#E8E1E5] dark:border-[#3A3040]">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#4B263F] dark:text-[#D6A0B4] mb-2">Everything Included</h2>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#242126] dark:text-[#F5EFF5] tracking-tight">
                Built from Ground Up for Beauty & Wellness Studios
              </h3>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Feature 1: Calendar + Animated Slot Filling Demo */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] text-[#4B263F] dark:text-[#D6A0B4] flex items-center justify-center mb-4 shadow-2xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#242126] dark:text-[#F5EFF5]">Smart Appointments Calendar</h4>
                  <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mt-2 leading-relaxed">
                    Day, week, and list views. Filter by stylist, mark customer arrivals with 1-click, and reschedule effortlessly.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E8E1E5] dark:border-[#3A3040]">
                    <CalendarSlotsDemo />
                  </div>
                </div>
              </TiltCard>

              {/* Feature 2: Live Studio Kanban */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] text-[#B77A91] dark:text-[#D6A0B4] flex items-center justify-center mb-4 shadow-2xs">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#242126] dark:text-[#F5EFF5]">Live Studio Kanban</h4>
                  <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mt-2 leading-relaxed">
                    Track walk-in waiting queues, currently seated chairs, and completed sessions ready for POS billing.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] text-[11px] space-y-1">
                    <div className="font-bold text-[#4B263F] dark:text-[#D6A0B4]">⚡ Dynamic Visual Queuing:</div>
                    <p className="text-[#77717A] dark:text-[#B5AAB8] text-[10px]">Staff drag-and-drop client cards as they move from waiting lounge to chair.</p>
                  </div>
                </div>
              </TiltCard>

              {/* Feature 3: POS Billing + Animated Line-by-Line GST Invoice Demo */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] text-[#2F7D68] dark:text-[#55B99A] flex items-center justify-center mb-4 shadow-2xs">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#242126] dark:text-[#F5EFF5]">POS Billing with GST</h4>
                  <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mt-2 leading-relaxed">
                    Itemized service and product checkout. Handles CGST (9%) + SGST (9%), discounts, and split payments (Cash + UPI).
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E8E1E5] dark:border-[#3A3040]">
                    <PosInvoiceDemo />
                  </div>
                </div>
              </TiltCard>

              {/* Feature 4: Staff Commission Automation */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] text-[#C69A5D] dark:text-[#D4AD76] flex items-center justify-center mb-4 shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#242126] dark:text-[#F5EFF5]">Staff Commission Automation</h4>
                  <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mt-2 leading-relaxed">
                    Set separate commission percentages for services and retail products. Export transparent payroll reports.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] text-[11px] space-y-1">
                    <div className="font-bold text-[#C69A5D] dark:text-[#D4AD76]">📊 Stylist Breakdown:</div>
                    <p className="text-[#77717A] dark:text-[#B5AAB8] text-[10px]">Real-time commission calculation per service cut and product sale.</p>
                  </div>
                </div>
              </TiltCard>

              {/* Feature 5: VIP Memberships */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] text-[#B77A91] dark:text-[#D6A0B4] flex items-center justify-center mb-4 shadow-2xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#242126] dark:text-[#F5EFF5]">VIP Memberships & Discounts</h4>
                  <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mt-2 leading-relaxed">
                    Sell Gold or Platinum annual memberships. Member discounts are automatically pre-filled during billing checkout.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] text-[11px] space-y-1">
                    <div className="font-bold text-[#B77A91] dark:text-[#D6A0B4]">⭐ Recurring Loyalty:</div>
                    <p className="text-[#77717A] dark:text-[#B5AAB8] text-[10px]">Up to 35%+ higher customer lifetime value with automated member tiers.</p>
                  </div>
                </div>
              </TiltCard>

              {/* Feature 6: Daily Cash & Sales Reports */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] text-[#2F7D68] dark:text-[#55B99A] flex items-center justify-center mb-4 shadow-2xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#242126] dark:text-[#F5EFF5]">Daily Cash & Sales Reports</h4>
                  <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mt-2 leading-relaxed">
                    End-of-day tally with cash breakdown, UPI payments, gross profit, and top revenue-generating treatments.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] text-[11px] space-y-1">
                    <div className="font-bold text-[#2F7D68] dark:text-[#55B99A]">📈 Instant Nightly Reconciliation:</div>
                    <p className="text-[#77717A] dark:text-[#B5AAB8] text-[10px]">Zero missing rupees. Reconciles drawer cash with digital UPI registers.</p>
                  </div>
                </div>
              </TiltCard>
            </div>
          </Reveal>
        </section>

        {/* ================= SECTION: 7-DAY FREE TRIAL & PRICING ================= */}
        <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 border-t border-[#E8E1E5] dark:border-[#3A3040]">
          <Reveal>
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1EBEF] dark:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] text-[#4B263F] dark:text-[#D6A0B4] text-xs font-bold mb-3 shadow-2xs">
                <Gift className="w-4 h-4 text-[#C69A5D] dark:text-[#D4AD76]" />
                <span>100% Free 7-Day Free Trial</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#242126] dark:text-[#F5EFF5] tracking-tight">
                Start Free for 7 Days, Upgrade as You Grow
              </h2>
              <p className="text-xs sm:text-base text-[#77717A] dark:text-[#B5AAB8] mt-3 max-w-2xl mx-auto leading-relaxed">
                Every new salon starts with a full-featured <strong>7-Day Free Trial</strong>. Experience real online
                bookings, POS billing, staff commission tracking, and live chair kanban with zero upfront cost.
              </p>
            </div>
          </Reveal>

          {/* Step-by-Step Onboarding Roadmap */}
          <Reveal delay={0.15}>
            <div className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] rounded-2xl p-5 sm:p-6 shadow-xs relative">
                <div className="w-10 h-10 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] text-[#4B263F] dark:text-[#D6A0B4] font-black text-base flex items-center justify-center mb-3">
                  1
                </div>
                <h4 className="font-bold text-sm sm:text-base text-[#242126] dark:text-[#F5EFF5]">
                  Create Your Salon Account
                </h4>
                <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mt-1.5 leading-relaxed">
                  Enter your <strong>Full Name, Phone Number, Email, Salon Name, City & Password</strong>. Registration takes less than 60 seconds.
                </p>
              </div>

              <div className="bg-white dark:bg-[#211B24] border border-[#C69A5D] dark:border-[#D4AD76] rounded-2xl p-5 sm:p-6 shadow-xs relative ring-2 ring-[#C69A5D]/25 dark:ring-[#D4AD76]/25">
                <div className="w-10 h-10 rounded-2xl bg-[#4B263F] dark:bg-[#D6A0B4] text-white dark:text-[#151218] font-black text-base flex items-center justify-center mb-3 shadow-md shadow-[#4B263F]/20">
                  2
                </div>
                <h4 className="font-bold text-sm sm:text-base text-[#4B263F] dark:text-[#D6A0B4]">
                  Instant 7-Day Free Trial Activated
                </h4>
                <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mt-1.5 leading-relaxed">
                  Your private salon dashboard goes live immediately. Test with your real stylists, services, and live bookings with <strong>₹0 charged</strong>.
                </p>
              </div>

              <div className="bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] rounded-2xl p-5 sm:p-6 shadow-xs relative">
                <div className="w-10 h-10 rounded-2xl bg-[#F1EBEF] dark:bg-[#2B2230] text-[#242126] dark:text-[#F5EFF5] font-black text-base flex items-center justify-center mb-3">
                  3
                </div>
                <h4 className="font-bold text-sm sm:text-base text-[#242126] dark:text-[#F5EFF5]">
                  Owner Login & Choose Plan
                </h4>
                <p className="text-xs text-[#77717A] dark:text-[#B5AAB8] mt-1.5 leading-relaxed">
                  Log in anytime with your email & password. After 7 days, subscribe to your preferred plan to keep your salon active without losing any data!
                </p>
              </div>
            </div>
          </Reveal>

          {/* Pricing Cards Grid with Animated Toggle and Staggered Rise */}
          <PricingCards />
        </section>

        {/* ================= FINAL CTA BANNER (CONFETTI BURST & GRADIENT) ================= */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <Reveal>
            <div className="relative overflow-hidden bg-gradient-to-r from-[#F1EBEF] via-[#F7F5F2] to-[#F1EBEF] dark:from-[#211B24] dark:via-[#2B2230] dark:to-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-sm transition-colors duration-300">
              {/* Subtle Animated Shimmer in Background */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#B77A91]/20 dark:bg-[#D6A0B4]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#C69A5D]/20 dark:bg-[#D4AD76]/10 rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#242126] dark:text-[#F5EFF5] tracking-tight">
                Ready to Automate Your Salon Operations?
              </h3>
              <p className="text-xs sm:text-sm text-[#77717A] dark:text-[#B5AAB8] mt-3 max-w-lg mx-auto leading-relaxed">
                Join hundreds of forward-thinking salons running with SalonPro. Setup takes under 3 minutes.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                {/* Magnetic Primary CTA with Confetti Burst */}
                <MagneticButton
                  href="/register-salon"
                  withConfetti={true}
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-[#4B263F] hover:bg-[#381c2f] dark:bg-[#D6A0B4] dark:hover:bg-[#c98ea3] text-white dark:text-[#151218] font-extrabold text-xs sm:text-sm shadow-md shadow-[#4B263F]/20 dark:shadow-[#D6A0B4]/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Create Your Salon Account ➔</span>
                </MagneticButton>

                <Link
                  href="/salon-owner"
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-[#F1EBEF] dark:bg-[#211B24] dark:hover:bg-[#2B2230] text-[#242126] dark:text-[#F5EFF5] font-bold text-xs sm:text-sm border border-[#E8E1E5] dark:border-[#3A3040] transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Already Registered? Sign In ➔</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ================= INFINITE LUXURY SALON TESTIMONIAL MARQUEE ================= */}
        <div className="relative z-10 w-full">
          <SalonMarquee />
        </div>

        {/* Full Footer */}
        <LandingFooter />
      </div>
    </SmoothScroll>
  );
}
