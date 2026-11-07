import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Server,
  FileText,
  Mail,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Privacy Policy | SalonPro Cloud OS',
  description: 'Privacy Policy and data protection terms for SalonPro salon operating system, tenant owners, staff, and clients.',
};

export default function PrivacyPage() {
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '8320653782';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'avsarsuvagiya968@gmail.com';

  const sections = [
    { id: 'overview', title: '1. Overview & Scope' },
    { id: 'collection', title: '2. Information We Collect' },
    { id: 'usage', title: '3. How We Use Information' },
    { id: 'payments', title: '4. Payment Security & Razorpay' },
    { id: 'whatsapp', title: '5. WhatsApp Communications' },
    { id: 'security', title: '6. Tenant Isolation & Safeguards' },
    { id: 'retention', title: '7. Retention, Export & Deletion' },
    { id: 'cookies', title: '8. Cookies & Storage' },
    { id: 'rights', title: '9. Your Privacy Rights' },
    { id: 'contact', title: '10. Grievance & Contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#080B12] text-[#1F2937] dark:text-[#FFFFFF] transition-colors duration-300 font-sans selection:bg-[#D4A77F] selection:text-[#080B12]">
      {/* Universal Top Header with Theme Toggle */}
      <LandingNavbar />

      {/* Hero Header Banner */}
      <section className="relative overflow-hidden border-b border-[#E5E7EB] dark:border-[#2A2F3A] bg-gradient-to-b from-white via-neutral-50 to-[#F8F9FA] dark:from-[#10141F] dark:via-[#0D111A] dark:to-[#080B12] py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] dark:text-[#A0A8B8] mb-4">
            <Link href="/" className="hover:text-[#1F2937] dark:hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#8C5E2E] dark:text-[#D4A77F]">Legal</span>
            <span>/</span>
            <span className="text-[#1F2937] dark:text-white">Privacy Policy</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F4F6] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#8C5E2E] dark:text-[#D4A77F] text-xs font-bold mb-3 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#8C5E2E] dark:text-[#D4A77F]" />
                <span>SPDI &amp; IT Act 2000 Compliant Data Protection</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#1F2937] dark:text-white tracking-tight leading-tight">
                Privacy Policy
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Learn how SalonPro protects your business records, salon client details, payment transactions, and appointment scheduling communications.
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] p-3 rounded-2xl shadow-xs">
              <div><strong>Last Updated:</strong> November 2026</div>
              <div><strong>Effective:</strong> Immediately upon use</div>
            </div>
          </div>

          {/* Quick Summary Highlights Box */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm mb-2">
                🔒
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">Zero Raw Card Storage</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Subscriptions and invoices tokenized securely via PCI-DSS certified Razorpay.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mb-2">
                🏢
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">Tenant Logical Isolation</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Each salon workspace is partitioned. Your client rosters are never sold or shared.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm mb-2">
                💬
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">Official WhatsApp API</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Meta Cloud API utilized solely for requested transactional OTPs, receipts &amp; reminders.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm mb-2">
                ⚖️
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">Complete Data Export</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Salon owners maintain full ownership with instant CSV/Excel and PDF data exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Quick Table of Contents Sticky Nav (Desktop lg+) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Contents Table
              </h2>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#8C5E2E] dark:hover:text-[#D4A77F] py-1 px-2 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] transition-colors"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#2A2F3A] text-xs">
                <div className="text-slate-500 dark:text-slate-400 mb-1">Need legal clarity?</div>
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact Data Officer</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Legal Sections Body (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1 */}
            <section
              id="overview"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                1. Overview &amp; Scope
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  This Privacy Policy describes the policies and procedures of SalonPro (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operating under Indian jurisdiction, regarding the collection, use, processing, and disclosure of information when you access or use our multi-tenant salon management software platform, website, tenant subdomains, and customer booking portals.
                </p>
                <p>
                  This policy applies to:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li><strong>Salon Tenants &amp; Owners:</strong> Individuals or business entities registering a salon workspace.</li>
                  <li><strong>Salon Staff &amp; Stylists:</strong> Employees and independent service providers utilizing the floor ERP.</li>
                  <li><strong>Salon Clients / End Customers:</strong> Consumers booking appointments, receiving digital invoices, or using the self-service customer portal.</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section
              id="collection"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                2. Information We Collect
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  We collect information essential to deliver uninterrupted salon management, online appointment scheduling, and automated tax invoicing:
                </p>
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <h3 className="font-bold text-[#1F2937] dark:text-white text-xs uppercase tracking-wider mb-1">
                      A. Salon Business &amp; Owner Profile
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Salon commercial business name, registered owner name, work email address, contact phone number, city, business logo, operating hours, and customizable invoice prefixes.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <h3 className="font-bold text-[#1F2937] dark:text-white text-xs uppercase tracking-wider mb-1">
                      B. Customer Booking &amp; Profile Details
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Customer full name, 10-digit Indian mobile number, encrypted 4-digit PIN for self-service verification, optional email and delivery address, appointment history, review ratings, and digital invoice tokens.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <h3 className="font-bold text-[#1F2937] dark:text-white text-xs uppercase tracking-wider mb-1">
                      C. Transactional &amp; Billing Data
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Service lines billed, retail product sales, staff commission attribution, payment method tags (Cash, UPI, Card), and Razorpay transaction reference identifiers.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section
              id="usage"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                3. How We Use Your Information
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Collected data is strictly utilized for authorized business operations:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Compute real-time stylist availability, prevent duplicate slots via atomic database locks, and confirm appointments.</li>
                  <li>Generate compliant GST tax invoices with itemized totals and unique sequential bill numbers.</li>
                  <li>Send instant transactional WhatsApp confirmations, reschedule notices, and digital PDF bills.</li>
                  <li>Calculate accurate stylist performance reports, retail stock movements, and end-of-day register tallies.</li>
                  <li>Authenticate users and defend against automated brute-force attacks via rate-limited security endpoints.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section
              id="payments"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                4. Payment Security &amp; Razorpay Compliance
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>SalonPro does NOT store credit/debit card numbers, CVVs, net banking credentials, or UPI PINs on its servers.</strong>
                </p>
                <p>
                  All online payments for SaaS subscription tiers (Monthly and Yearly plans) are securely processed through <strong>Razorpay Software Private Limited</strong>, an RBI-regulated and PCI-DSS Level 1 compliant payment aggregator.
                </p>
                <p>
                  Payment transactions are executed over 256-bit TLS encrypted channels directly to Razorpay gateways. We receive only tokenized payment IDs, transaction timestamps, and payment status indicators (SUCCESS, PENDING, FAILED) to activate and maintain your subscription license.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="whatsapp"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                5. WhatsApp Communications &amp; Meta Cloud API
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  SalonPro integrates with authorized telecom gateways and Meta WhatsApp Cloud API to deliver transactional messages on behalf of salon tenants.
                </p>
                <div className="p-4 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-2 text-xs">
                  <div className="font-bold text-[#1F2937] dark:text-white">What we send via WhatsApp:</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                    <li>Booking confirmation with stylist name, date, time slot, and salon address.</li>
                    <li>Instant link to the customer self-service cancellation and reschedule portal.</li>
                    <li>Digital tax invoice link (`/b/[number]`) with downloadable PDF receipt.</li>
                  </ul>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    Customers may opt out of receiving messages at any time by replying &quot;STOP&quot; or informing the salon administrator.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section
              id="security"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                6. Tenant Logical Isolation &amp; Technical Safeguards
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  SalonPro operates a hardened cloud infrastructure designed specifically for multi-tenant business privacy:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <div className="font-bold text-[#1F2937] dark:text-white text-xs mb-1">Row-Level Tenant Boundary</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Every database query enforces verified JWT tenant identifiers. No salon owner or staff member can read another tenant&apos;s records.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <div className="font-bold text-[#1F2937] dark:text-white text-xs mb-1">Cryptographic PIN Hashing</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Customer 4-digit booking PINs and owner passwords are cryptographically salted and hashed using bcryptjs.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <div className="font-bold text-[#1F2937] dark:text-white text-xs mb-1">Unguessable Invoice Tokens</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Public digital bills use random high-entropy receipt tokens to prevent sequential number probing.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <div className="font-bold text-[#1F2937] dark:text-white text-xs mb-1">Dual-Layer Rate Limiting</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Strict brute-force defenses against authentication attacks and automated booking abuse.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="retention"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                7. Data Retention, Export &amp; Account Deletion
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  We retain salon operational records for as long as your workspace remains in good standing.
                </p>
                <p>
                  <strong>Exporting Data:</strong> Salon owners may export client directories, appointment logs, product catalogs, and revenue spreadsheets at any time directly through the Reports and Settings modules.
                </p>
                <p>
                  <strong>Deletion upon Termination:</strong> Upon subscription cancellation or non-renewal, data remains accessible in read-only format for 30 calendar days to allow final export. Thereafter, salon owners may request permanent purge of all tenant records by contacting our support team.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section
              id="cookies"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                8. Cookies &amp; Local Browser Storage
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  SalonPro utilizes essential first-party cookies and local browser storage strictly to ensure security and platform usability:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>`salonpro_session`: Secure HTTP-only JWT for salon owner and staff authentication.</li>
                  <li>`salonpro_customer_session`: Secure HTTP-only JWT for customer portal verification.</li>
                  <li>`salonpro_theme`: Local browser storage key preserving your preferred Light or Dark visual mode.</li>
                  <li>`sessionStorage`: Temporary booking wizard state preserving service, stylist, and date during page refreshes.</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section
              id="rights"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                9. Your Privacy Rights
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Under Indian Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, you have the right to:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Review and update inaccurate personal information (via the Customer Portal `/portal` or Owner Settings `/app/settings`).</li>
                  <li>Revoke consent for optional promotional marketing communications.</li>
                  <li>Request a full report of personal information processed by SalonPro.</li>
                </ul>
              </div>
            </section>

            {/* Section 10 */}
            <section
              id="contact"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                10. Grievance Redressal &amp; Privacy Officer
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  In accordance with the Information Technology Act 2000 and rules made thereunder, any privacy disputes, concerns, or data deletion requests should be directed to our designated officer:
                </p>

                <div className="mt-4 p-5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-[#1F2937] dark:text-white text-sm">
                      SalonPro Privacy &amp; Compliance Cell
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Support Email: <a href={`mailto:${supportEmail}`} className="text-[#8C5E2E] dark:text-[#D4A77F] font-semibold hover:underline">{supportEmail}</a>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Direct WhatsApp Helpline: <a href={`https://wa.me/91${supportPhone}`} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">+91 {supportPhone}</a>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      Resolution timeframe: Within 48 business hours.
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/91${supportPhone}?text=Hello%20SalonPro%20Legal%20Team,%20I%20have%20a%20privacy%20question.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-sm inline-flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95"
                  >
                    <span>💬 Chat on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Universal Footer */}
      <LandingFooter />
    </div>
  );
}
