import { query } from '@/lib/db';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Invoice Receipt - SalonPro',
  description: 'View your digital salon receipt',
};

export const instant = false;

export default async function PublicBillPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const decodedNumber = decodeURIComponent(number);

  // Query invoice
  const invRes = await query(
    `SELECT i.*, 
            s.name as salon_name, s.address as salon_address, s.phone as salon_phone,
            c.name as customer_name, c.mobile as customer_mobile
     FROM invoices i
     JOIN salons s ON i.salon_id = s.id
     JOIN customers c ON i.customer_id = c.id
     WHERE i.number = $1 OR i.id::text = $1
     LIMIT 1`,
    [decodedNumber]
  );

  if (invRes.rows.length === 0) {
    notFound();
  }

  const invoice = invRes.rows[0];

  // Fetch session items
  let items: any[] = [];
  if (invoice.session_id) {
    const itemsRes = await query(
      `SELECT kind, name, qty, unit_price, staff_id 
       FROM session_items 
       WHERE session_id = $1`,
      [invoice.session_id]
    );
    items = itemsRes.rows;
  }

  // Fetch payments
  const payRes = await query(
    `SELECT amount, method, reference, created_at 
     FROM payments 
     WHERE invoice_id = $1 
     ORDER BY created_at ASC`,
    [invoice.id]
  );
  const payments = payRes.rows;

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalAmount = Number(invoice.total);
  const dueAmount = Math.max(0, totalAmount - totalPaid);

  // Inclusive GST calculation (18% total: 9% CGST + 9% SGST)
  // Tax = Total * 18 / 118
  const totalTax = (totalAmount * 18) / 118;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const taxableSubtotal = totalAmount - totalTax;

  const status =
    dueAmount <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'PENDING';

  return (
    <div className="min-h-screen bg-neutral-100 py-6 sm:py-12 px-4 flex justify-center items-start print:bg-white print:p-0">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Top Header Brand Banner */}
        <div className="bg-neutral-900 text-white p-6 sm:p-8 text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 font-bold text-2xl mb-3 border border-pink-500/30">
            {invoice.salon_name?.charAt(0) || 'G'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{invoice.salon_name}</h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            {invoice.salon_address || 'Boutique Salon & Spa'}
          </p>
          {invoice.salon_phone && (
            <p className="text-xs text-neutral-400 mt-0.5">Ph: {invoice.salon_phone}</p>
          )}

          {/* Status Badge */}
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-white/10 backdrop-blur-sm bg-white/5">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'PAID'
                  ? 'bg-emerald-400'
                  : status === 'PARTIAL'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span
              className={
                status === 'PAID'
                  ? 'text-emerald-300'
                  : status === 'PARTIAL'
                  ? 'text-amber-300'
                  : 'text-rose-300'
              }
            >
              {status}
            </span>
          </div>
        </div>

        {/* Invoice Metadata bar */}
        <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-4 flex flex-wrap justify-between items-center text-xs text-neutral-600 gap-2">
          <div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">Invoice No</span>
            <span className="font-mono font-bold text-neutral-800 text-sm">{invoice.number}</span>
          </div>
          <div className="text-right">
            <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">Date & Time</span>
            <span className="font-medium text-neutral-800">
              {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              ·{' '}
              {new Date(invoice.created_at).toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-6 border-b border-neutral-100">
          <div className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-1">
            Billed To
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-neutral-900 text-base">{invoice.customer_name}</div>
              <div className="text-xs text-neutral-500 font-mono mt-0.5">{invoice.customer_mobile}</div>
            </div>
            <div className="text-right text-xs text-neutral-400">
              Verified Client
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6">
          <div className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-3">
            Services & Products
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div className="flex-1 pr-3">
                  <div className="font-medium text-neutral-900">{item.name}</div>
                  <div className="text-xs text-neutral-400 capitalize">
                    {item.kind} {item.qty > 1 ? `× ${item.qty}` : ''}
                  </div>
                </div>
                <div className="font-semibold text-neutral-900 text-right">
                  ₹{(Number(item.unit_price) * (item.qty || 1)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Calculation Breakdown */}
          <div className="mt-6 pt-4 border-t border-dashed border-neutral-200 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
            </div>

            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-pink-600 font-medium">
                <span>
                  Discount{' '}
                  {invoice.discount_type === 'pct' ? `(${invoice.discount_value}%)` : ''}
                </span>
                <span>-₹{Number(invoice.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-400 pt-1 border-t border-neutral-100">
              <span>Taxable Value</span>
              <span>₹{taxableSubtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-neutral-400">
              <span>CGST (9%)</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-neutral-400">
              <span>SGST (9%)</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-3 border-t-2 border-neutral-900 text-neutral-900 font-bold text-lg">
              <span>Grand Total</span>
              <span className="text-xl">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payments Section */}
          <div className="mt-6 pt-4 border-t border-neutral-200">
            <div className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
              Payment Summary
            </div>
            
            {payments.length === 0 ? (
              <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                No payment recorded yet. Total Due: ₹{totalAmount.toLocaleString('en-IN')}
              </div>
            ) : (
              <div className="space-y-1.5">
                {payments.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs bg-neutral-50 px-3 py-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold uppercase text-neutral-800">{p.method}</span>
                      {p.reference && (
                        <span className="text-[10px] text-neutral-400 font-mono">({p.reference})</span>
                      )}
                    </div>
                    <span className="font-bold text-emerald-600">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between items-center text-xs font-bold pt-2 px-1">
                  <span className="text-neutral-600">Paid so far</span>
                  <span className="text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</span>
                </div>

                {dueAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-rose-600 px-1">
                    <span>Balance Due</span>
                    <span>₹{dueAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info & Print Button */}
        <div className="bg-neutral-50 p-6 border-t border-neutral-200 text-center">
          <p className="text-xs text-neutral-500">
            Thank you for pampering yourself with us! ✨
          </p>
          <p className="text-[10px] text-neutral-400 mt-1">
            Prices are inclusive of all applicable GST. This is a computer generated invoice.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center print:hidden">
            <a
              href="javascript:window.print()"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#b3135b] to-[#d62475] hover:from-[#9c0f4e] hover:to-[#b3135b] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-pink-900/20 transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Download / Save Official PDF Receipt</span>
            </a>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `if (window.location.search.includes('download=pdf')) { window.onload = function() { setTimeout(function() { window.print(); }, 400); } }`,
          }}
        />

      </div>
    </div>
  );
}
