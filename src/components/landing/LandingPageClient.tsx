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
  const [pageReady, setPageReady] = useState(false);
  const [typewriterDone, setTypewriterDone] = useState<boolean>(false);

  React.useEffect(() => {
    // Fallback ensure hero content is never blocked
    const timer = setTimeout(() => {
      setTypewriterDone(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SmoothScroll>
      {/* High-Performance Branded Scissors Page Loader that reveals first on every page load/reload */}
      <PageLoader onComplete={() => setPageReady(true)} minDurationMs={1200} />

      <div
        className={`min-h-screen bg-white dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] font-sans selection:bg-[#D4A77F] selection:text-[#080B12] w-full max-w-full overflow-x-hidden relative transition-opacity duration-500 ${
          pageReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Animated Aurora Gradient Background with Desktop Cursor Spotlight */}
        <AuroraBackground />

        {/* Top Sticky Glassmorphism Navbar with Theme Switcher */}
        <LandingNavbar />

        {/* ================= HERO SECTION ================= */}
        <section className="relative z-10 max-w-6xl mx-auto px-3.5 sm:px-6 pt-10 sm:pt-16 lg:pt-20 pb-12 sm:pb-20 text-center w-full">
          {/* Drifting Floating Salon Icons with Mouse Parallax */}
          <FloatingIcons />

          {/* Live Beacon Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] text-white text-[10px] sm:text-xs font-bold mb-4 sm:mb-6 shadow-md shadow-black/10 max-w-full">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping inline-block shrink-0" />
            <span className="text-[#D4A77F] font-extrabold tracking-wide shrink-0">LIVE DEMO</span>
            <span className="text-white/40">·</span>
            <span className="text-[#A0A8B8] truncate">Smart Salon & Spa Suite</span>
          </div>

          {/* H1 Typewriter Effect with Invisible CLS Barrier & Blinking Caret */}
          <Typewriter
            firstLine="Stop Losing Revenue to"
            words={['Paper Registers', 'Double-Bookings', 'Missed Appointments', 'No-Show Clients']}
            onComplete={() => setTypewriterDone(true)}
            speedMs={45}
          />

          {/* Staggered Subtitle, CTAs, Badges & Stats (Revealed when Typewriter Finishes) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={typewriterDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-sans font-normal text-base sm:text-lg text-[#6B7280] dark:text-[#A0A8B8] mt-4 sm:mt-6 max-w-[60ch] mx-auto leading-[1.6] px-1">
              The all-in-one operating system for salons & spas:{' '}
              <strong className="text-[#1F2937] dark:text-[#FFFFFF] font-semibold">conflict-free online client booking</strong>, live studio Kanban, 10-second GST POS
              billing, staff commission tracking, and instant WhatsApp receipts.
            </p>

            {/* Hero CTAs */}
            <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
              {/* Primary CTA with Magnetic Physics, Shimmer Sweep, and Confetti */}
              <MagneticButton
                href="/register-salon"
                withConfetti={true}
                className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-sans font-semibold text-[15px] tracking-normal shadow-xl shadow-[#D4A77F]/25 transition-all active:scale-95 flex items-center justify-center gap-2 group ring-2 ring-[#D4A77F]/30 cursor-pointer"
              >
                <span>Start 7-Day Free Trial</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </MagneticButton>

              <Link
                href="/dixa-beauty-salon"
                target="_blank"
                className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-sans font-semibold text-[15px] tracking-normal shadow-md shadow-[#10B981]/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>⚡ Try Live Booking Demo</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white">1-Click</span>
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#141926] hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF] font-sans font-semibold text-[15px] tracking-normal border border-[#E5E7EB] dark:border-[#2A2F3A] transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#D4A77F]" />
                <span>Owner Portal</span>
              </Link>
            </div>

            {/* Quick Micro-Trust Badges */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#6B7280] dark:text-[#A0A8B8] font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Setup in 60 seconds</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
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
              <h2 className="font-sans font-semibold text-xs sm:text-[13px] tracking-[0.08em] uppercase text-[#D4A77F] mb-2.5">Common Salon Headaches</h2>
              <h3 className="landing-h2 font-heading font-semibold text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
                Running a Salon Shouldn&apos;t Feel Like Chaos
              </h3>
              <p className="font-sans font-normal text-base text-[#6B7280] dark:text-[#A0A8B8] mt-2.5 max-w-[60ch] mx-auto leading-[1.6]">
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
        <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="font-sans font-semibold text-xs sm:text-[13px] tracking-[0.08em] uppercase text-[#D4A77F] mb-2.5">Simple Multi-Tenant Workflow</h2>
              <h3 className="landing-h2 font-heading font-semibold text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
                How SalonPro Works in Your Salon (Example: &quot;Priya Salon&quot;)
              </h3>
              <p className="font-sans font-normal text-base text-[#6B7280] dark:text-[#A0A8B8] mt-2.5 max-w-[60ch] mx-auto leading-[1.6]">
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
        <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="font-sans font-semibold text-xs sm:text-[13px] tracking-[0.08em] uppercase text-[#D4A77F] mb-2.5">Everything Included</h2>
              <h3 className="landing-h2 font-heading font-semibold text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
                Built from Ground Up for Beauty &amp; Wellness Studios
              </h3>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Feature 1: Calendar + Animated Slot Filling Demo */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] flex items-center justify-center mb-4 shadow-2xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">Smart Appointments Calendar</h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-2 leading-relaxed">
                    Day, week, and list views. Filter by stylist, mark customer arrivals with 1-click, and reschedule effortlessly.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <CalendarSlotsDemo />
                  </div>
                </div>
              </TiltCard>

              {/* Feature 2: Live Studio Kanban */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] flex items-center justify-center mb-4 shadow-2xs">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">Live Studio Kanban</h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-2 leading-relaxed">
                    Track walk-in waiting queues, currently seated chairs, and completed sessions ready for POS billing.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[11px] space-y-1">
                    <div className="font-bold text-[#D4A77F]">⚡ Dynamic Visual Queuing:</div>
                    <p className="text-[#6B7280] dark:text-[#A0A8B8] text-[10px]">Staff drag-and-drop client cards as they move from waiting lounge to chair.</p>
                  </div>
                </div>
              </TiltCard>

              {/* Feature 3: POS Billing + Animated Line-by-Line GST Invoice Demo */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#10B981] flex items-center justify-center mb-4 shadow-2xs">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">POS Billing with GST</h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-2 leading-relaxed">
                    Itemized service and product checkout. Handles CGST (9%) + SGST (9%), discounts, and split payments (Cash + UPI).
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <PosInvoiceDemo />
                  </div>
                </div>
              </TiltCard>

              {/* Feature 4: Staff Commission Automation */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] flex items-center justify-center mb-4 shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">Staff Commission Automation</h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-2 leading-relaxed">
                    Set separate commission percentages for services and retail products. Export transparent payroll reports.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[11px] space-y-1">
                    <div className="font-bold text-[#D4A77F]">📊 Stylist Breakdown:</div>
                    <p className="text-[#6B7280] dark:text-[#A0A8B8] text-[10px]">Real-time commission calculation per service cut and product sale.</p>
                  </div>
                </div>
              </TiltCard>

              {/* Feature 5: VIP Memberships */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#D4A77F] flex items-center justify-center mb-4 shadow-2xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">VIP Memberships & Discounts</h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-2 leading-relaxed">
                    Sell Gold or Platinum annual memberships. Member discounts are automatically pre-filled during billing checkout.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[11px] space-y-1">
                    <div className="font-bold text-[#D4A77F]">⭐ Recurring Loyalty:</div>
                    <p className="text-[#6B7280] dark:text-[#A0A8B8] text-[10px]">Higher customer retention with automated VIP member tiers.</p>
                  </div>
                </div>
              </TiltCard>

              {/* Feature 6: Daily Cash & Sales Reports */}
              <TiltCard className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#10B981] flex items-center justify-center mb-4 shadow-2xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">Daily Cash & Sales Reports</h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-2 leading-relaxed">
                    End-of-day tally with cash breakdown, UPI payments, gross profit, and top revenue-generating treatments.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[11px] space-y-1">
                    <div className="font-bold text-[#10B981]">📈 Instant Nightly Reconciliation:</div>
                    <p className="text-[#6B7280] dark:text-[#A0A8B8] text-[10px]">Zero missing rupees. Reconciles drawer cash with digital UPI registers.</p>
                  </div>
                </div>
              </TiltCard>
            </div>
          </Reveal>
        </section>

        {/* ================= SECTION: 7-DAY FREE TRIAL & PRICING ================= */}
        <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
          <Reveal>
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#1C2230] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#D4A77F] font-sans font-semibold text-xs sm:text-[13px] tracking-[0.08em] uppercase mb-3 shadow-2xs">
                <Gift className="w-4 h-4 text-[#D4A77F]" />
                <span>100% Free 7-Day Free Trial</span>
              </div>
              <h2 className="landing-h2 font-heading font-semibold text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
                Start Free for 7 Days, Upgrade as You Grow
              </h2>
              <p className="font-sans font-normal text-base text-[#6B7280] dark:text-[#A0A8B8] mt-2.5 max-w-[60ch] mx-auto leading-[1.6]">
                Every new salon starts with a full-featured <strong>7-Day Free Trial</strong>. Experience real online
                bookings, POS billing, staff commission tracking, and live chair kanban with zero upfront cost.
              </p>
            </div>
          </Reveal>

          {/* Step-by-Step Onboarding Roadmap */}
          <Reveal delay={0.15}>
            <div className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-5 sm:p-6 shadow-xs relative">
                <div className="w-10 h-10 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF] font-black text-base flex items-center justify-center mb-3">
                  1
                </div>
                <h4 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">
                  Create Your Salon Account
                </h4>
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1.5 leading-relaxed">
                  Enter your <strong>Full Name, Phone Number, Email, Salon Name, City & Password</strong>. Registration takes less than 60 seconds.
                </p>
              </div>

              <div className="bg-white dark:bg-[#141926] border-2 border-[#D4A77F] rounded-2xl p-5 sm:p-6 shadow-xs relative ring-2 ring-[#D4A77F]/20">
                <div className="w-10 h-10 rounded-2xl bg-[#D4A77F] text-[#080B12] font-black text-base flex items-center justify-center mb-3 shadow-md shadow-[#D4A77F]/20">
                  2
                </div>
                <h4 className="font-bold text-sm sm:text-base text-[#D4A77F]">
                  Instant 7-Day Free Trial Activated
                </h4>
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1.5 leading-relaxed">
                  Your private salon dashboard goes live immediately. Test with your real stylists, services, and live bookings with <strong>₹0 charged</strong>.
                </p>
              </div>

              <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-5 sm:p-6 shadow-xs relative">
                <div className="w-10 h-10 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF] font-black text-base flex items-center justify-center mb-3">
                  3
                </div>
                <h4 className="font-bold text-sm sm:text-base text-[#1F2937] dark:text-[#FFFFFF]">
                  Owner Login & Choose Plan
                </h4>
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1.5 leading-relaxed">
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
            <div className="relative overflow-hidden bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-sm transition-colors duration-300">
              {/* Subtle Animated Shimmer in Background */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#D4A77F]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#D4A77F]/10 rounded-full blur-3xl pointer-events-none" />

              <h3 className="landing-h2 font-heading font-semibold text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">
                Ready to Automate Your Salon Operations?
              </h3>
              <p className="font-sans font-normal text-base text-[#6B7280] dark:text-[#A0A8B8] mt-2.5 max-w-[60ch] mx-auto leading-[1.6]">
                Join hundreds of forward-thinking salons running with SalonPro. Setup takes under 3 minutes.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                {/* Magnetic Primary CTA with Confetti Burst */}
                <MagneticButton
                  href="/register-salon"
                  withConfetti={true}
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-black text-xs sm:text-sm shadow-md shadow-[#D4A77F]/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Create Your Salon Account ➔</span>
                </MagneticButton>

                <Link
                  href="/salon-owner"
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-[#F3F4F6] dark:bg-[#141926] dark:hover:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF] font-bold text-xs sm:text-sm border border-[#E5E7EB] dark:border-[#2A2F3A] transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Already Registered? Sign In ➔</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ================= BUILT FOR EVERY SALON FORMAT MARQUEE ================= */}
        <div className="relative z-10 w-full">
          <SalonMarquee />
        </div>

        {/* Full Footer */}
        <LandingFooter />
      </div>
    </SmoothScroll>
  );
}
