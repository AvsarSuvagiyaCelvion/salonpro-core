import React from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  ExternalLink,
  Sparkles,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'Refund & Cancellation Policy | SalonPro Cloud OS',
  description: 'Refund, cancellation, and payment dispute policy for SalonPro subscription plans and salon client appointments.',
};

export default function RefundPolicyPage() {
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '8320653782';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'avsarsuvagiya968@gmail.com';

  const sections = [
    { id: 'trial-model', title: '1. 7-Day Evaluation Model' },
    { id: 'cancellation', title: '2. Subscription Cancellation' },
    { id: 'refund-terms', title: '3. General Refund Terms' },
    { id: 'outage-exception', title: '4. Critical Outage Exception' },
    { id: 'razorpay-timeline', title: '5. Razorpay Refund Timelines' },
    { id: 'client-appointments', title: '6. In-Salon Client Bookings' },
    { id: 'how-to-claim', title: '7. How to Submit a Claim' },
    { id: 'disputes', title: '8. Disputes & Chargebacks' },
    { id: 'contact', title: '9. Support Helpline' },
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
            <span className="text-[#1F2937] dark:text-white">Refund &amp; Cancellation</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F4F6] dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-[#8C5E2E] dark:text-[#D4A77F] text-xs font-bold mb-3 shadow-2xs">
                <RotateCcw className="w-4 h-4 text-[#8C5E2E] dark:text-[#D4A77F]" />
                <span>Fair &amp; Transparent Indian E-Commerce Compliance</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#1F2937] dark:text-white tracking-tight leading-tight">
                Refund &amp; Cancellation Policy
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Clear guidelines regarding SaaS subscription renewals, 1-click workspace cancellations, Razorpay refund processing cycles, and customer appointment rules.
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] p-3 rounded-2xl shadow-xs">
              <div><strong>Gateway Partner:</strong> Razorpay (PCI-DSS)</div>
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
                Test all premium features with ₹0 upfront payment before paying any subscription fee.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mb-2">
                ⚡
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">1-Click Cancellation</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Cancel subscription anytime directly from your dashboard. No lock-in or penalties.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm mb-2">
                ⏱️
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">5-7 Days Refund Credit</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Approved refunds routed directly back to original UPI, Bank Account, or Card.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm mb-2">
                🛡️
              </div>
              <h2 className="text-xs font-bold text-[#1F2937] dark:text-white">Outage Protection</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                Full 100% refund granted if a verified technical outage blocks core salon usage.
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
                <div className="text-slate-500 dark:text-slate-400 mb-1">Billing questions?</div>
                <a
                  href={`https://wa.me/91${supportPhone}?text=Hello%20SalonPro%20Billing%20Support`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#10B981] hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>WhatsApp Billing Help</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Legal Content Body (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1 */}
            <section
              id="trial-model"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                1. 7-Day Free Trial Evaluation Model
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  To ensure complete satisfaction and eliminate financial uncertainty, SalonPro provides a full-featured, zero-risk <strong>7-Day Free Trial</strong> for every new salon workspace.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>No credit card, debit card, or advance security deposit is required during registration.</li>
                  <li>During these 7 days, salon owners can test all capabilities: GST POS billing, customer WhatsApp receipts, booking wizards, staff commission trackers, and analytics.</li>
                  <li>We encourage every salon business to thoroughly evaluate software performance during this complimentary window.</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section
              id="cancellation"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                2. Subscription Cancellation Rules
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Salon owners maintain full control over their account renewals:
                </p>
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <h3 className="font-bold text-[#1F2937] dark:text-white text-xs mb-1">
                      Cancel Anytime from Dashboard
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      You may cancel your monthly or yearly recurring subscription at any moment by navigating to `/app/subscription` in your Owner ERP.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <h3 className="font-bold text-[#1F2937] dark:text-white text-xs mb-1">
                      Access Remains Active Until Period Ends
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      When you cancel, your salon workspace remains completely functional until the final day of your currently prepaid subscription period. No unexpected mid-term shutoff will occur.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A]">
                    <h3 className="font-bold text-[#1F2937] dark:text-white text-xs mb-1">
                      No Automatic Renewal Charges
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Once cancelled, no subsequent recurring charges will be initiated via Razorpay.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section
              id="refund-terms"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                3. General Refund Terms (No Partial-Month Refunds)
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Because SalonPro operates as a Software-as-a-Service (SaaS) platform with real-time multi-tenant database provisioning and dedicated telecom SMS/WhatsApp gateway resources allocated immediately upon payment:
                </p>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Standard Rule:</strong> Subscriptions are billed in advance. Except as expressly provided in Section 4 below, subscription payments are non-refundable, and we do not provide prorated refunds or credits for partial subscription months or unused feature allowances.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section
              id="outage-exception"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                4. Critical Outage &amp; Service Defect Exception (Full Refund)
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  We stand firmly behind the reliability of SalonPro. You are eligible for a <strong>100% full refund</strong> of your most recent subscription charge if:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Our software experiences an unresolvable server failure, data corruption, or verified continuous platform downtime exceeding 48 consecutive business hours; AND</li>
                  <li>Our technical support team is unable to remediate the service defect within 5 business days of your written notice; AND</li>
                  <li>You submit your refund request within <strong>7 days</strong> of the date of the disputed subscription payment.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="razorpay-timeline"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                5. Razorpay Refund Processing Flow &amp; Timelines
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  When a refund is approved by our billing department, the refund instruction is triggered electronically through the <strong>Razorpay Payment Gateway API</strong>:
                </p>

                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl overflow-hidden">
                    <thead className="bg-[#F9FAFB] dark:bg-[#10141F] text-[#1F2937] dark:text-white font-bold border-b border-[#E5E7EB] dark:border-[#2A2F3A]">
                      <tr>
                        <th className="py-2.5 px-3">Original Payment Channel</th>
                        <th className="py-2.5 px-3">Refund Credit Destination</th>
                        <th className="py-2.5 px-3">Expected Timeframe (IST)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2A2F3A] text-slate-600 dark:text-slate-300">
                      <tr>
                        <td className="py-2.5 px-3 font-medium">UPI (GPay, PhonePe, Paytm)</td>
                        <td className="py-2.5 px-3">Linked Primary Bank Account</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">2 to 4 Business Days</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium">Net Banking (IMPS/NEFT)</td>
                        <td className="py-2.5 px-3">Originating Bank Account</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">3 to 5 Business Days</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium">Credit / Debit Card (Visa, RuPay, MC)</td>
                        <td className="py-2.5 px-3">Original Card Statement</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">5 to 7 Business Days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Note: Refund timelines depend on your issuing bank&apos;s internal clearing schedule. You will receive an automated Razorpay ARN (Acquirer Reference Number) email to track the refund with your bank.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section
              id="client-appointments"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                6. In-Salon Client Bookings &amp; Salon Policies
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>Important Distinction:</strong> SalonPro is a B2B SaaS software provider. Payments collected by salons from their walk-in customers or clients (for haircuts, facial treatments, spa sessions, retail shampoos) are direct commercial transactions between the salon and the consumer.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Client cancellations and advance appointment refund requests are governed by each salon&apos;s individual policy configured in `/app/settings`.</li>
                  <li>Clients can cancel or reschedule appointments within the allowed policy hours via the Customer Portal (`/portal`).</li>
                  <li>SalonPro does not hold client appointment payments in escrow and does not adjudicate disputes regarding in-salon service quality.</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="how-to-claim"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                7. How to Submit a Refund Claim
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  To submit a refund request for an exceptional outage or billing discrepancy:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Send an email to <a href={`mailto:${supportEmail}`} className="text-[#8C5E2E] dark:text-[#D4A77F] font-bold hover:underline">{supportEmail}</a> with the subject line <strong>&quot;Refund Request - [Your Salon Name]&quot;</strong>.</li>
                  <li>Include your registered owner email address and salon subdomain slug.</li>
                  <li>Attach the Razorpay Payment ID or invoice number from `/app/subscription`.</li>
                  <li>Provide a concise description of the verified technical disruption encountered.</li>
                </ol>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  Our billing team evaluates requests within 2 business days and notifies you of the status.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section
              id="disputes"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                8. Payment Disputes &amp; Chargebacks
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  If you notice an unrecognized charge from SalonPro on your bank statement, please contact us first before initiating a bank dispute or chargeback. We resolve legitimate billing inquiries swiftly and avoid unnecessary banking dispute fees for both parties.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section
              id="contact"
              className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                9. Billing &amp; Support Escalation Contact
              </h2>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="p-5 rounded-2xl bg-[#F9FAFB] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-[#1F2937] dark:text-white text-sm">
                      SalonPro Customer Success &amp; Billing Desk
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Billing Email: <a href={`mailto:${supportEmail}`} className="text-[#8C5E2E] dark:text-[#D4A77F] font-semibold hover:underline">{supportEmail}</a>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Direct WhatsApp: <a href={`https://wa.me/91${supportPhone}`} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">+91 {supportPhone}</a>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      Operating Hours: 09:00 AM – 09:00 PM IST (Mon - Sat)
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/91${supportPhone}?text=Hello%20SalonPro%20Team,%20I%20have%20a%20billing%20question.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-sm inline-flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95"
                  >
                    <span>💬 Contact Support on WhatsApp</span>
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
