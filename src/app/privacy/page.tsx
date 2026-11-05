import Link from 'next/link';

// <!-- TODO: Have this policy reviewed by legal counsel before public launch -->

export const metadata = {
  title: 'Privacy Policy | SalonPro',
  description: 'Privacy Policy for SalonPro salon management platform.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#080B12] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#141926] rounded-2xl border border-[#E5E7EB] dark:border-[#2A2F3A]/80 p-8 sm:p-12 shadow-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4A77F] hover:underline mb-6">
          ← Back to SalonPro Home
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] dark:text-white tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">Last updated: November 2026</p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#1F2937] dark:text-white mb-2">1. Information We Collect</h2>
            <p>
              When you register a salon workspace, create an appointment, or use our digital billing portal, we collect essential business information including salon names, business mobile numbers, email addresses, staff rosters, and customer appointment booking details.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1F2937] dark:text-white mb-2">2. How We Use Information</h2>
            <p>
              Information collected is used strictly to deliver the SalonPro software service: scheduling bookings, sending automated WhatsApp appointment confirmations and digital PDF bills, computing staff commissions, and maintaining secure salon workspace operations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1F2937] dark:text-white mb-2">3. Payment Information & Security</h2>
            <p>
              SalonPro does not store sensitive credit card numbers or UPI PINs. All payment transactions are tokenized and processed through PCI-DSS certified payment processors, primarily Razorpay.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1F2937] dark:text-white mb-2">4. Communications & WhatsApp Delivery</h2>
            <p>
              We integrate with Meta WhatsApp Cloud API and authorized telecom partners to deliver real-time booking confirmations and invoice receipts requested by salon clients. You may opt out of promotional messages at any time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1F2937] dark:text-white mb-2">5. Data Retention & Compliance</h2>
            <p>
              We maintain data retention procedures in compliance with Indian Information Technology regulations. Salon owners may request complete export or deletion of their workspace data upon account termination.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1F2937] dark:text-white mb-2">6. Contact for Privacy Inquiries</h2>
            <p>
              If you have any questions or data requests regarding this Privacy Policy, please reach out to our privacy officer via our official support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

