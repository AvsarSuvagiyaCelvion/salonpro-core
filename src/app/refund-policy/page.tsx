import Link from 'next/link';

// <!-- TODO: Have this policy reviewed by legal counsel before public launch -->

export const metadata = {
  title: 'Refund & Cancellation Policy | SalonPro',
  description: 'Refund, cancellation, and payment dispute policy for SalonPro subscriptions.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b3135b] hover:underline mb-6">
          ← Back to SalonPro Home
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Refund &amp; Cancellation Policy</h1>
        <p className="text-xs text-slate-500 mt-1">Last updated: November 2026</p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">1. 7-Day Free Trial</h2>
            <p>
              SalonPro provides a complimentary 7-day free trial on new salon registrations with full feature access and zero upfront payment. We encourage all salons to fully evaluate the software during this period.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">2. Subscription Cancellation</h2>
            <p>
              You may cancel your monthly or yearly recurring subscription at any time via your workspace Settings. When you cancel, your account remains active until the end of your current paid billing period, and no further renewal charges will be initiated.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">3. Refund Policy (No Partial Month Refunds)</h2>
            <p>
              Subscriptions are billed in advance. Except as expressly stated below, payments made to SalonPro are non-refundable, and we do not provide refunds or credits for any partial-month subscription periods or unused software features.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">4. 7-Day Outage / Unusable Service Exception</h2>
            <p>
              If our service experiences a verified technical outage or critical defect that prevents your salon from utilizing the platform for your core operations, you may request a full refund within 7 days of the initial subscription charge. Refund requests must be submitted in writing with relevant transaction details.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">5. Razorpay Processing & Timelines</h2>
            <p>
              Approved refunds are credited directly back to the original payment method (Bank Account, Credit/Debit Card, or UPI) through the Razorpay gateway. Refunds typically reflect in your account within 5 to 7 business days following approval, subject to your bank&apos;s processing cycles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">6. Contact Support</h2>
            <p>
              For any questions regarding billing disputes or cancellation inquiries, please reach out via our support email or WhatsApp helpline.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

