import Link from 'next/link';

// <!-- TODO: Have this policy reviewed by legal counsel before public launch -->

export const metadata = {
  title: 'Terms of Service | SalonPro',
  description: 'Terms of Service and Customer Agreement for SalonPro multi-tenant SaaS platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b3135b] hover:underline mb-6">
          ← Back to SalonPro Home
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1">Last updated: November 2026</p>

        <div className="mt-8 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By signing up for or using the SalonPro software platform (&quot;Service&quot;), provided under Indian jurisdiction, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a salon or business entity, you represent that you have the authority to bind such entity.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">2. Subscription, Billing & Renewals</h2>
            <p>
              SalonPro offers a 7-day free trial for new salon workspaces. Upon completion of the trial period, continuous access requires a paid subscription tier (Monthly or Yearly) processed securely via Razorpay. Subscriptions renew automatically unless cancelled prior to the renewal date.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">3. Payment Gateway & Razorpay Terms</h2>
            <p>
              All subscription charges, recurring payments, and transaction fees are processed through Razorpay Software Private Limited. By making payments on SalonPro, you agree to comply with Razorpay&apos;s applicable terms of service and payment processing policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">4. Tenant Isolation & Data Ownership</h2>
            <p>
              Each salon workspace is logically isolated. Salon owners retain exclusive ownership of their business data, client records, and service catalogs. SalonPro implements tenant-level access controls and does not sell or distribute salon client contact lists to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">5. Cancellation & Termination</h2>
            <p>
              Salon owners may cancel their subscription at any time via the workspace settings. Upon cancellation, your workspace remains accessible until the end of your prepaid billing period. Data export is available prior to workspace deactivation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">6. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

