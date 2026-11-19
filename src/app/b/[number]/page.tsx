import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import ThemeToggle from '@/components/landing/ThemeToggle';
import {
  COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
  verifySessionToken,
  verifyCustomerSessionToken,
  verifyAdminSessionToken,
} from '@/lib/auth';
import PrintReceiptButton from '@/components/receipt/PrintReceiptButton';
import { generateUpiQrDataUrl, buildGPayUrl, buildPhonePeUrl, buildPaytmUrl, buildUpiPayUrl } from '@/lib/upi';
import { QrCode, Smartphone } from 'lucide-react';

export const metadata = {
  title: 'Invoice Receipt - SalonPro',
  description: 'View your digital salon receipt',
};

function formatFullMobile(mobile: string | null | undefined): string {
  if (!mobile) return '';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    const ten = digits.slice(2);
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
  }
  return mobile;
}

export default async function PublicBillPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const decodedNumber = decodeURIComponent(number);

  // Query invoice by unguessable receipt_token or sequential invoice number
  const invRes = await query(
    `SELECT i.*, 
            s.name as salon_name, s.address as salon_address, s.phone as salon_phone, s.logo_url as salon_logo_url,
            s.upi_id as salon_upi_id, s.upi_number as salon_upi_number, s.upi_qr_url as salon_upi_qr_url,
            c.name as customer_name, c.mobile as customer_mobile
     FROM invoices i
     JOIN salons s ON i.salon_id = s.id
     JOIN customers c ON i.customer_id = c.id
     WHERE (i.receipt_token = $1 OR i.number = $1)
     ORDER BY i.created_at DESC
     LIMIT 1`,
    [decodedNumber]
  );

  if (invRes.rows.length === 0) {
    notFound();
  }

  const invoice = invRes.rows[0];

  // Anti-IDOR Security: If accessed via sequential invoice number instead of the unguessable receipt_token,
  // require authenticated caller to be the salon owner/staff, the customer, or platform admin.
  const isDirectTokenMatch = invoice.receipt_token && decodedNumber === invoice.receipt_token;
  if (!isDirectTokenMatch) {
    const cookieStore = await cookies();
    const ownerToken = cookieStore.get(COOKIE_NAME)?.value;
    const customerToken = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    let isAuthorized = false;

    if (ownerToken) {
      const ownerSession = await verifySessionToken(ownerToken);
      if (ownerSession && ownerSession.salonId === invoice.salon_id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && customerToken) {
      const custSession = await verifyCustomerSessionToken(customerToken);
      if (custSession && custSession.customerId === invoice.customer_id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && adminToken) {
      const adminSession = await verifyAdminSessionToken(adminToken);
      if (adminSession) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      notFound();
    }
  }

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

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalAmount = Number(invoice.total) || 0;
  const dueAmount = Math.max(0, totalAmount - totalPaid);

  // Inclusive GST calculation (18% total: 9% CGST + 9% SGST)
  // Tax = Total * 18 / 118
  const totalTax = totalAmount > 0 ? (totalAmount * 18) / 118 : 0;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const taxableSubtotal = Math.max(0, totalAmount - totalTax);

  const status =
    dueAmount <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'PENDING';

  // Pre-generate dynamic UPI payment QR and links if balance is due and salon has UPI configured
  let clientUpiQrDataUrl: string | null = null;
  const salonUpiId = invoice.salon_upi_id;
  if (dueAmount > 0 && salonUpiId) {
    try {
      clientUpiQrDataUrl = await generateUpiQrDataUrl({
        upiId: salonUpiId,
        name: invoice.salon_name || 'Salon',
        amount: dueAmount,
        note: `Invoice ${invoice.number}`,
      });
    } catch {
      clientUpiQrDataUrl = null;
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-[#080B12] flex flex-col justify-start items-center print:bg-white print:p-0 transition-colors duration-200">
      {/* Universal Sticky Top Header for Receipt Page */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#10141F]/95 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2A2F3A] px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-2xs print:hidden mb-6 sm:mb-8">
        <Link href="/portal" className="flex items-center gap-2 group min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#10141F] dark:bg-[#141926] border border-[#2A2F3A] flex items-center justify-center font-black text-xs text-[#D4A77F] shrink-0">
            ✂
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-sm sm:text-base text-[#1F2937] dark:text-white tracking-tight block leading-tight truncate">
              Salon<span className="text-[#8C5E2E] dark:text-[#D4A77F]">Pro</span>
            </span>
            <span className="text-[10px] text-[#8C5E2E] dark:text-[#D4A77F] font-bold block -mt-0.5 truncate">
              Verified Digital Receipt
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold shadow-xs transition-all active:scale-95 whitespace-nowrap"
          >
            <span>My Bookings ➔</span>
          </Link>
        </div>
      </header>

      <div id="invoice-receipt-card" className="w-full max-w-lg bg-white dark:bg-[#141926] rounded-3xl shadow-xl border border-neutral-200 dark:border-[#2A2F3A] overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Top Header Brand Banner */}
        <div className="bg-neutral-900 dark:bg-[#0B0F19] text-white p-6 sm:p-8 text-center relative border-b dark:border-[#2A2F3A]">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#D4A77F]/20 text-[#D4A77F] font-bold text-2xl mb-3 border border-[#D4A77F]/30 overflow-hidden">
            {invoice.salon_logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={invoice.salon_logo_url} alt={invoice.salon_name} className="w-full h-full object-cover" />
            ) : (
              invoice.salon_name?.charAt(0) || 'G'
            )}
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
        <div className="bg-neutral-50 dark:bg-[#10141F] border-b border-neutral-200 dark:border-[#2A2F3A] px-6 py-4 flex flex-wrap justify-between items-center text-xs text-neutral-600 dark:text-neutral-300 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">Tax Invoice</span>
            </div>
            <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">Invoice No</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-white text-sm">{invoice.number}</span>
          </div>
          <div className="text-right">
            <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">Date & Time</span>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
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
        <div className="p-6 border-b border-neutral-100 dark:border-[#2A2F3A]">
          <div className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-1">
            Billed To
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-neutral-900 dark:text-white text-base">{invoice.customer_name}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">{formatFullMobile(invoice.customer_mobile)}</div>
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
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">{item.name}</div>
                  <div className="text-xs text-neutral-400 capitalize">
                    {item.kind} {item.qty > 1 ? `× ${item.qty}` : ''}
                  </div>
                </div>
                <div className="font-semibold text-neutral-900 dark:text-white text-right">
                  ₹{(Number(item.unit_price) * (item.qty || 1)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Calculation Breakdown */}
          <div className="mt-6 pt-4 border-t border-dashed border-neutral-200 dark:border-[#2A2F3A] space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
              <span>Subtotal</span>
              <span>₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
            </div>

            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-pink-600 dark:text-pink-400 font-medium">
                <span>
                  Discount{' '}
                  {invoice.discount_type === 'pct' ? `(${invoice.discount_value}%)` : ''}
                </span>
                <span>-₹{Number(invoice.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-400 pt-1 border-t border-neutral-100 dark:border-[#2A2F3A]">
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

            <div className="flex justify-between items-baseline pt-3 border-t-2 border-neutral-900 dark:border-neutral-200 text-neutral-900 dark:text-white font-bold text-lg">
              <span>Grand Total</span>
              <span className="text-xl">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payments Section */}
          <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-[#2A2F3A]">
            <div className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
              Payment Summary
            </div>
            
            {payments.length === 0 ? (
              <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50 font-medium">
                No payment recorded yet. Total Due: ₹{totalAmount.toLocaleString('en-IN')}
              </div>
            ) : (
              <div className="space-y-1.5">
                {payments.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs bg-neutral-50 dark:bg-[#10141F] px-3 py-2 rounded-lg border border-transparent dark:border-[#2A2F3A]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold uppercase text-neutral-800 dark:text-neutral-200">{p.method}</span>
                      {p.reference && (
                        <span className="text-[10px] text-neutral-400 font-mono">({p.reference})</span>
                      )}
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between items-center text-xs font-bold pt-2 px-1">
                  <span className="text-neutral-600 dark:text-neutral-400">Paid so far</span>
                  <span className="text-emerald-700 dark:text-emerald-400">₹{totalPaid.toLocaleString('en-IN')}</span>
                </div>

                {dueAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-rose-600 dark:text-rose-400 px-1">
                    <span>Balance Due</span>
                    <span>₹{dueAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Direct 1-Tap UPI Payment Option for Outstanding Balance */}
            {dueAmount > 0 && salonUpiId && (
              <div className="mt-5 p-4 rounded-2xl bg-[#D4A77F]/10 border border-[#D4A77F]/30 space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#8C5E2E] dark:text-[#D4A77F]">
                    <QrCode className="w-4 h-4" />
                    <span>Pay Balance Online (0% Fee)</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-500 font-bold">
                    UPI: {salonUpiId}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-[#141926] p-3 rounded-xl border border-neutral-200 dark:border-[#2A2F3A]">
                  {clientUpiQrDataUrl && (
                    <div className="w-28 h-28 bg-white p-1 rounded-xl border border-neutral-200 shrink-0 shadow-xs flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={clientUpiQrDataUrl}
                        alt="Pay Outstanding Balance QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1 text-center sm:text-left w-full">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 inline-block">
                      Exact Amount: ₹{dueAmount.toLocaleString('en-IN')}
                    </span>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">
                      Scan or tap below to pay with any UPI App
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                      <a
                        href={buildGPayUrl({
                          upiId: salonUpiId,
                          name: invoice.salon_name || 'Salon',
                          amount: dueAmount,
                          note: `Invoice ${invoice.number}`,
                        })}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#1C2230] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold text-[11px] flex items-center justify-center gap-1 hover:border-[#D4A77F] shadow-2xs"
                      >
                        <span className="text-blue-500 font-black">G</span>Pay
                      </a>
                      <a
                        href={buildPhonePeUrl({
                          upiId: salonUpiId,
                          name: invoice.salon_name || 'Salon',
                          amount: dueAmount,
                          note: `Invoice ${invoice.number}`,
                        })}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#1C2230] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold text-[11px] flex items-center justify-center gap-1 hover:border-[#D4A77F] shadow-2xs"
                      >
                        <span className="text-purple-600 font-black">पे</span> PhonePe
                      </a>
                      <a
                        href={buildPaytmUrl({
                          upiId: salonUpiId,
                          name: invoice.salon_name || 'Salon',
                          amount: dueAmount,
                          note: `Invoice ${invoice.number}`,
                        })}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-[#1C2230] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 font-bold text-[11px] flex items-center justify-center gap-1 hover:border-[#D4A77F] shadow-2xs"
                      >
                        <span className="text-sky-500 font-black">Pay</span>tm
                      </a>
                      <a
                        href={buildUpiPayUrl({
                          upiId: salonUpiId,
                          name: invoice.salon_name || 'Salon',
                          amount: dueAmount,
                          note: `Invoice ${invoice.number}`,
                        })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#D4A77F]/15 border border-[#D4A77F]/40 text-[#8C5E2E] dark:text-[#D4A77F] font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Any UPI</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info & Print Button */}
        <div className="bg-neutral-50 dark:bg-[#10141F] p-6 border-t border-neutral-200 dark:border-[#2A2F3A] text-center">
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Thank You! Please Visit Again ✨
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center print:hidden">
            <PrintReceiptButton
              salon={{
                name: invoice.salon_name,
                address: invoice.salon_address,
                phone: invoice.salon_phone,
              }}
              invoice={{
                number: invoice.number,
                created_at: invoice.created_at,
                customer_name: invoice.customer_name,
                customer_mobile: invoice.customer_mobile,
                subtotal: invoice.subtotal,
                discount_amount: invoice.discount_amount,
                total: invoice.total,
              }}
              items={items}
              payments={payments}
              taxableSubtotal={taxableSubtotal}
              cgst={cgst}
              sgst={sgst}
              status={status}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
