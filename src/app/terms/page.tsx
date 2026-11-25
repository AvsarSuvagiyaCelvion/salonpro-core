import React from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  ExternalLink,
  Lock,
  Clock,
  Sparkles,
} from 'lucide-react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Terms of Service | StudioDesk Cloud OS',
  description: 'Terms of Service, subscription rules, and customer agreement for StudioDesk salon & studio management platform.',
};

export default function TermsPage() {
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '8320653782';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'studiodeskapp@gmail.com';

  const sections = [
    { id: 'acceptance', title: '1. Acceptance & Eligibility' },
    { id: 'workspace', title: '2. Workspace & Credentials' },
    { id: 'trial-billing', title: '3. 7-Day Trial & Billing' },
    { id: 'razorpay', title: '4. Razorpay & GST Terms' },
    { id: 'data-ownership', title: '5. Tenant Data Ownership' },
    { id: 'cancellations', title: '6. Self-Service Policies' },
    { id: 'staff', title: '7. Staff Roster & Commissions' },
    { id: 'uptime', title: '8. Availability & SLA' },
    { id: 'fair-usage', title: '9. Prohibited Conduct' },
    { id: 'termination', title: '10. Cancellation & Exit' },
    { id: 'liability', title: '11. Limitation of Liability' },
    { id: 'governing-law', title: '12. Governing Law (India)' },
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
            <span className="text-[#1F2937] dark:text-white">Terms of Service</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F4F6] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#8C5E2E] dark:text-[#D4A77F] text-xs font-bold mb-3 shadow-2xs">
                <FileText className="w-4 h-4 text-[#8C5E2E] dark:text-[#D4A77F]" />
                <span>Commercial SaaS Terms · Indian Contract Act 1872</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#1F2937] dark:text-white tracking-tight leading-tight">
                Terms of Service
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Clear and transparent agreement outlining your 7-day trial, subscription billing, salon data ownership, and acceptable software usage.
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] p-3 rounded-2xl shadow-xs">
              <div><strong>Version:</strong> 2.4 (Active)</div>
              <div><strong>Last Updated:</strong> November 2026</div>
            </div>
          </div>

          {/* Quick Summary Highlights Box */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm mb-2">
                🎁
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">7-Day Free Trial</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Full feature access with zero upfront credit card requirement. Cancel anytime.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mb-2">
                🛡️
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">Full Data Ownership</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                You retain complete exclusive ownership of all client rosters and pricing catalogs.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm mb-2">
                💳
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">Razorpay Processing</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                All subscriptions processed securely via RBI-regulated Razorpay payment aggregator.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm mb-2">
                ⚡
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">High-Availability Cloud</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Enterprise cloud uptime with automatic multi-datacenter failover and backups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Quick Table of Contents Sticky Nav */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Quick Navigation
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
                <div className="text-slate-500 dark:text-slate-400 mb-1">Questions on terms?</div>
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Legal Support</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Legal Content Body (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1 */}
            <section
              id="acceptance"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                1. Acceptance of Terms &amp; Eligibility
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  By creating an account, registering a salon workspace, accessing the Owner ERP, or booking through a StudioDesk client portal, you confirm that you are at least 18 years of age and legally competent to enter into a binding agreement under the Indian Contract Act, 1872.
                </p>
                <p>
                  If you register a workspace on behalf of a partnership, private limited company, LLP, or sole proprietorship, you represent and warrant that you hold authorized legal mandate to bind the business entity to these Terms.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section
              id="workspace"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                2. Salon Workspace &amp; Access Credentials
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Upon registration at `/register-salon`, you will be assigned a unique logical workspace identified by your chosen salon slug (e.g. `your-salon.studiodeskapp.com`).
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>You are exclusively responsible for safeguarding the confidentiality of your owner and staff credentials.</li>
                  <li>You agree not to share administrative passwords across non-authorized individuals.</li>
                  <li>StudioDesk must be notified immediately of any suspected unauthorized access or compromise of your workspace.</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section
              id="trial-billing"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                3. 7-Day Free Trial &amp; Subscription Billing
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Every newly registered salon receives an automatic <strong>7-day free trial</strong> with full access to POS billing, staff rosters, online appointments, and reports without requiring any advance payment or credit card details.
                </p>
                <p>
                  <strong>Paid Subscriptions:</strong> Following trial expiration, continued use requires selecting an active SaaS tier (Starter, Pro, or Enterprise) billed in advance on either a <strong>Monthly</strong> or <strong>Yearly</strong> recurring schedule.
                </p>
                <p>
                  Subscriptions automatically renew at the close of the respective billing period unless cancelled by the salon owner via `/app/subscription` or workspace settings prior to the renewal timestamp.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section
              id="razorpay"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                4. Payment Processing via Razorpay &amp; GST Invoicing
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  All subscription payments, plan upgrades, and renewals are handled via <strong>Razorpay Software Private Limited</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Accepted payment channels include UPI (Google Pay, PhonePe, Paytm), Net Banking, RuPay, Visa, and MasterCard.</li>
                  <li>All subscription charges are subject to applicable Goods and Services Tax (GST) as mandated by Indian tax authorities.</li>
                  <li>A computerized GST Tax Invoice is automatically generated and made available under your account subscription history immediately upon confirmed payment.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="data-ownership"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                5. Tenant Data Ownership &amp; Confidentiality
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>You own your data.</strong> StudioDesk does not claim any intellectual property or ownership rights over the client mobile numbers, appointments, staff commission rates, or inventory data that you enter into the platform.
                </p>
                <div className="p-4 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs">
                  <div className="font-bold text-[#1F2937] dark:text-white mb-1">Our Confidentiality Commitment:</div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    We will never sell, rent, monetize, or disclose your client contacts to third-party marketing companies, competing salons, or advertiser networks under any circumstances.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section
              id="cancellations"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                6. Customer Self-Service &amp; Cancellation Policies
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Salon owners configure their own custom cancellation policies (e.g. 2 hours, 4 hours advance notice) under `/app/settings`.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Clients accessing the self-service Customer Portal (`/portal`) can cancel or reschedule appointments only if the time remaining exceeds the salon&apos;s specified cancellation window.</li>
                  <li>StudioDesk acts solely as the software scheduling platform and is not liable for customer no-shows or disputes regarding in-salon service delivery.</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="staff"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                7. Staff Roster &amp; Commission Calculations
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  The platform provides automated staff commission tracking and revenue allocation tools based on parameters configured by the salon owner. Salon owners remain solely responsible for verifying final payroll disbursements, TDS deductions, and labor law compliance with their individual employees and contractors.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section
              id="uptime"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                8. Service Availability &amp; Maintenance SLA
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  StudioDesk operates on high-availability cloud architecture with continuous automated database backups. Scheduled maintenance, provider migrations, or emergency security patching are conducted during off-peak Indian Standard Time (IST) hours with advance notice published via in-app banners.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section
              id="fair-usage"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                9. Prohibited Conduct &amp; Fair Usage
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  You agree NOT to:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Reverse engineer, decompile, or attempt to extract the source code of the StudioDesk software engine.</li>
                  <li>Use automated scraping bots or scripted tools to bypass booking slot concurrency controls or rate limits.</li>
                  <li>Transmit unsolicited promotional messages or spam violating Telecom Regulatory Authority of India (TRAI) directives.</li>
                  <li>Upload unlawful, offensive, or infringing media content to salon gallery storage.</li>
                </ul>
              </div>
            </section>

            {/* Section 10 */}
            <section
              id="termination"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                10. Cancellation &amp; Account Exit
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Salon owners may cancel subscription renewals at any time directly through the dashboard. Upon cancellation, your workspace remains fully active until the conclusion of your current paid billing cycle. You may export all customer records and financial ledgers at zero extra charge.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section
              id="liability"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                11. Limitation of Liability
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  To the maximum extent permitted by applicable Indian law, StudioDesk and its directors shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from lost salon business profits, telecom network downtime, or third-party payment gateway disruptions. Our aggregate liability under any claim shall not exceed the subscription fees paid by you in the preceding three (3) months.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section
              id="governing-law"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                12. Governing Law &amp; Jurisdiction
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  These Terms of Service and any contractual disputes shall be governed by and construed exclusively in accordance with the laws of India. Any legal proceedings arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Gujarat, India.
                </p>

                <div className="mt-5 p-5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-[#1F2937] dark:text-white text-sm">
                      Need custom enterprise contract terms?
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Multi-location salon chains and wellness franchises can request dedicated enterprise MSAs.
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/91${supportPhone}?text=Hello%20StudioDesk%20Team,%20I%20am%20interested%20in%20an%20enterprise%20agreement.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs shadow-sm inline-flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95"
                  >
                    <span>Talk to Enterprise Sales</span>
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
